'use strict';
const { query, queryOne } = require('../../config/db');
const { resolveSubjectKey } = require('./subjectKey');
const { groupByPurpose } = require('./purpose');

/*
 * RESOLVE v1 — turning "this school, this class, this subject" into content.
 *
 * This is the layer CIE_IMPLEMENTATION_PLAN F3 says does not exist: every
 * academic module queries content tables directly, which is why content authored
 * centrally has never reached a classroom. This file is the single answer to
 * "what content belongs here", and every consumer goes through it.
 *
 * ── THE CHAIN ──────────────────────────────────────────────────────────────
 *
 *   school's own class + subject          (client_classes, client_subjects)
 *        ↓  matched by board + class number + slugified subject name
 *   board curriculum tree                 (cie_curriculum_nodes, published only)
 *        ↓  cie_node_concepts
 *   concepts                              (cie_concepts — no board, no class)
 *        ↓  cie_content_concepts
 *   content                               (platform_content + client_cms_assets)
 *
 * Content is NEVER matched to a class or a board directly. If you find yourself
 * adding `WHERE p.board = ?` here, stop: that is the N×M shortcut ADR-013 exists
 * to prevent, and it would work today and cost a year later.
 *
 * ── WHY THE MATCH IS BY NAME, AND WHAT THAT COSTS ──────────────────────────
 * Adoption — an explicit, human-confirmed binding from a school's class+subject
 * to a published subtree — is the right answer and lands in LOOP 7. It needs a
 * school-side profile table that does not exist yet (F5: client_classes has no
 * board, client_subjects has no class link).
 *
 * Rather than block the engine on that, v1 derives the same three facts from
 * columns that DO exist today: the org's board, the class's standard, and the
 * subject's name through cie_subject_aliases. Nothing is written to a school's
 * tables. JDPS is untouched.
 *
 * The cost is honest and worth naming: a match can MISS (a school types a
 * subject we have no alias for, or its board is blank). A miss must never render
 * as an empty list — an empty list reads to a teacher as "the platform has
 * nothing" rather than "nobody mapped this yet". So every resolve returns a
 * `match` object explaining exactly which link in the chain failed, and the UI
 * says so in words.
 *
 * ── WHAT IS DELIBERATELY STUBBED ───────────────────────────────────────────
 * Entitlement filtering (LOOP 7) and overrides (LOOP 8) are pass-through here.
 * Both are gates that REMOVE content, so shipping them as pass-through is the
 * safe direction: today every entitled school sees all published master content,
 * and when the gates land they can only narrow that. The reverse — shipping a
 * filter and loosening it later — would silently hide content nobody knew was
 * missing.
 */

// Interpolated, never bound. `LIMIT ?` is the one place mysql2's prepared
// statements diverge between the local MySQL and the server's MariaDB, and this
// codebase has ~16 endpoints that cannot run on a dev machine for exactly that
// reason. These are integer constants in source, so interpolation is safe.
const MAX_NODES = 500;
const MAX_CONTENT = 2000;

// A school's board column is free text typed at onboarding: "CBSE", "cbse",
// "C.B.S.E.", "Cbse Board". Fold it the same way we fold subject names.
const BOARD_ALIAS = {
  cbse: 'CBSE',
  icse: 'ICSE', cisce: 'ICSE', isc: 'ICSE',
  rbse: 'RBSE', bser: 'RBSE', rajasthanboard: 'RBSE',
  upmsp: 'UPMSP', upboard: 'UPMSP',
  msbshse: 'MSBSHSE', maharashtraboard: 'MSBSHSE',
  ib: 'IB', ibdp: 'IB',
  jee: 'JEE', neet: 'NEET',
  state: 'STATE', stateboard: 'STATE', other: 'STATE',
};

function boardKeyFor(raw) {
  const folded = String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (!folded) return null;
  if (BOARD_ALIAS[folded]) return BOARD_ALIAS[folded];
  // A board we have a tree for but no alias row: try the raw uppercase form, so
  // adding a board via POST /boards makes it resolvable without a code change.
  return folded.toUpperCase().slice(0, 20);
}

// `client_classes.standard` is NULLable and is NOT reliably populated — verified
// on the dev DB, where a class literally named "Class 10" has standard = NULL.
// Resolution keyed only on that column would return "this class has no class
// number" to a school whose class number is sitting right there in its name.
//
// This is the failure mode that has bitten this codebase before: a filter over a
// column nothing consistently writes. So the number is DERIVED from the name when
// the column is empty, and the column always wins when it is set.
//
// Roman numerals are included because Indian schools write them constantly
// ("Class X", "IX-B"). The order of these patterns matters: a bare-number match
// must come after the labelled ones, or "Class 10 (2026)" would match the year.
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };

function classNoFromName(name) {
  const s = String(name || '').toLowerCase().trim();
  if (!s) return null;

  // "Class 10", "Grade 9", "Std 8", "10th", "10-A", "10 A", or a bare "10".
  const labelled = s.match(/(?:class|grade|std|standard)\s*[-.]?\s*(\d{1,2})/);
  const ordinal = s.match(/\b(\d{1,2})\s*(?:st|nd|rd|th)\b/);
  const leading = s.match(/^(\d{1,2})\s*(?:[-–—.\s]|$)/);
  for (const m of [labelled, ordinal, leading]) {
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 12) return n;
    }
  }

  // "Class X", "IX-B", "XII Science". Anchored to a word boundary so the "x" in
  // "Excel" or the "v" in "Div A" cannot be read as a class number.
  const rm = s.match(/(?:class|grade|std|standard)?\s*\b(x{0,1}i{1,3}|iv|v|vi{1,3}|ix|xi{1,2}|x)\b/);
  if (rm && ROMAN[rm[1]] != null) return ROMAN[rm[1]];

  return null;
}

// A tree is authored per session ("2026-27"). A school's class carries
// academic_year, which is the same shape but not guaranteed to be populated or
// to match a session we have authored. So: try the class's own year, then fall
// back to the most recent PUBLISHED session for that board+class+subject.
//
// Falling back is the right default. The alternative — returning nothing because
// the school wrote "2026-2027" and the tree says "2026-27" — would make the
// engine look broken for a formatting difference.
async function pickSession({ boardKey, classNo, subjectKey, preferred }) {
  if (preferred) {
    const hit = await queryOne(
      `SELECT session FROM cie_curriculum_nodes
        WHERE board_key=? AND class_no=? AND subject_key=? AND session=?
          AND status='published' AND is_active=1 LIMIT 1`,
      [boardKey, classNo, subjectKey, preferred]);
    if (hit) return hit.session;
  }
  const latest = await queryOne(
    `SELECT session FROM cie_curriculum_nodes
      WHERE board_key=? AND class_no=? AND subject_key=? AND status='published' AND is_active=1
      ORDER BY session DESC LIMIT 1`,
    [boardKey, classNo, subjectKey]);
  return latest ? latest.session : null;
}

/**
 * Establish which board tree a school's class+subject points at.
 * Returns a `match` object that is always safe to show a user: every failure
 * mode names the link that broke and what to do about it.
 */
async function resolveContext({ orgId, classRow, subjectRow }) {
  // ── THE DECLARED PROFILE WINS OVER ANY DERIVATION ───────────────────────
  // 056 gives a school a place to SAY what it is. When that row exists it is the
  // answer, full stop — a school that has told us its board must never be
  // second-guessed by string-folding its name.
  const profile = await queryOne(
    `SELECT board_key, medium, session, confirmed_at
       FROM cie_org_academic_profile WHERE org_id=?`, [orgId]);

  // Fallback for an org with no profile row: derive it, exactly as 055 did.
  // TWO board columns exist and picking the wrong one silently breaks the match
  // for almost every school. `board` (VARCHAR 64) is newer and often NULL;
  // `affiliation_board` is the ENUM the branding screen actually writes and it
  // defaults to 'CBSE', so it is populated for practically every org.
  let boardKey = profile?.board_key || null;
  let medium = profile?.medium || 'en';
  if (!boardKey) {
    const org = await queryOne(
      `SELECT id, COALESCE(NULLIF(TRIM(board), ''), affiliation_board) AS board
         FROM client_organizations WHERE id=?`, [orgId]);
    boardKey = boardKeyFor(org?.board);
  }

  if (!boardKey) {
    return { ok: false, reason: 'no_board',
      message: 'This school has not set its board yet, so we cannot pick a curriculum. Set it in Settings.' };
  }
  const board = await queryOne(
    'SELECT board_key, name FROM cie_boards WHERE board_key=? AND is_active=1', [boardKey]);
  if (!board) {
    // `org` no longer exists at this scope (it is declared inside the derivation
    // branch above), so name the KEY we resolved to. That is also the more useful
    // message: it tells the reader what we actually looked for.
    return { ok: false, reason: 'unknown_board', board: boardKey,
      message: `No curriculum has been published for ${boardKey} yet.` };
  }

  // The column when it is set; the name when it is not. Never a guess when both
  // are silent — that returns a named failure instead.
  const classNo = classRow?.standard ?? classNoFromName(classRow?.name);
  if (classNo == null) {
    return { ok: false, reason: 'no_standard', board: board.board_key,
      message: `We could not tell which class "${classRow?.name || 'this'}" is. `
             + 'Set its class number in Academics → Classes and it will match automatically.' };
  }

  const sub = await resolveSubjectKey(query, subjectRow?.name);
  if (!sub.key) {
    return { ok: false, reason: 'no_subject', board: board.board_key,
      message: 'This subject has no name, so it cannot be matched to a curriculum.' };
  }

  // A session pinned on the profile wins: it is a deliberate choice by the school
  // ("stay on 2026-27"), whereas academic_year is incidental data entry.
  const session = await pickSession({
    boardKey: board.board_key, classNo, subjectKey: sub.key,
    preferred: profile?.session || classRow?.academic_year,
  });
  if (!session) {
    return { ok: false, reason: 'no_tree', board: board.board_key, class_no: classNo, subject_key: sub.key,
      message: `No published curriculum for ${board.name} · Class ${classNo} · ${subjectRow?.name} yet.` };
  }

  return {
    ok: true,
    board: board.board_key, board_name: board.name,
    class_no: classNo, subject_key: sub.key, subject_alias_matched: sub.matched, session,
    medium,
    // false = we derived this school's identity instead of being told it. The
    // setup screen shows a "please confirm" prompt on the strength of this flag,
    // so a guess is never displayed as a declaration.
    declared: !!profile?.confirmed_at,
  };
}

/**
 * The full resolve: chapters → topics → content, for one school's class+subject.
 *
 * @param {object}  o
 * @param {number}  o.orgId
 * @param {object}  o.classRow    a client_classes row (id, name, standard, academic_year)
 * @param {object}  o.subjectRow  a client_subjects row (id, name)
 * @param {string}  [o.purpose]   teach | practice | assess — filters by coverage
 * @param {boolean} [o.includeDrafts=false]  org-1 preview only, never for a school
 */
async function resolveForSubject({ orgId, classRow, subjectRow, purpose = null,
                                  includeDrafts = false, studentId = null, sectionId = null }) {
  const ctx = await resolveContext({ orgId, classRow, subjectRow });
  if (!ctx.ok) return { match: ctx, chapters: [] };

  const scope = [ctx.board, ctx.session, ctx.class_no, ctx.subject_key];
  const statusClause = includeDrafts ? "('published','draft')" : "('published')";

  const nodes = await query(
    `SELECT node_code, node_type, parent_code, display_name, official_code, sequence,
            teaching_periods, assessment_marks, status
       FROM cie_curriculum_nodes
      WHERE board_key=? AND session=? AND class_no=? AND subject_key=?
        AND is_active=1 AND status IN ${statusClause}
      ORDER BY sequence ASC, display_name ASC
      LIMIT ${MAX_NODES}`, scope);

  if (!nodes.length) {
    return { match: { ...ctx, ok: false, reason: 'empty_tree',
      message: `The curriculum for ${ctx.board_name} · Class ${ctx.class_no} is published but has no chapters yet.` },
      chapters: [] };
  }

  const leafCodes = nodes.filter((n) => n.node_type === 'topic' || n.node_type === 'subtopic')
                         .map((n) => n.node_code);

  // Content for every leaf in one query rather than one query per topic. A
  // Class-10 subject is ~15 chapters × ~5 topics; per-topic queries would be 75
  // round trips on a page that has a 2-second budget (CLAUDE.md §12).
  let contentRows = [];
  if (leafCodes.length) {
    const placeholders = leafCodes.map(() => '?').join(',');

    // Master content and the school's own private content are resolved in ONE
    // pass and both are first-class (PRD §9.5). org_private rows are scoped by
    // org_id — that is the tenant boundary, and it is the reason this UNION is
    // two branches rather than one clever join.
    //
    // ai_suggested mappings are excluded: 053's comment says they never resolve,
    // because an unreviewed machine guess appearing as curriculum is worse than
    // a gap a teacher can see.
    const params = [...leafCodes];
    let purposeClause = '';
    if (purpose === 'practice') {
      purposeClause = "AND cc.coverage IN ('assesses','reinforces','remediates')";
    } else if (purpose === 'assess') {
      purposeClause = "AND cc.coverage IN ('assesses')";
    } else if (purpose === 'teach') {
      purposeClause = "AND cc.coverage IN ('full','partial','introduces','extends')";
    }

    contentRows = await query(
      `SELECT nc.node_code, 'master' AS source, p.id AS content_id, p.type, p.title, p.language,
              p.asset_url, p.thumb_url, p.duration_secs, p.body_html IS NOT NULL AS has_body,
              p.version, cc.coverage, cc.confidence, p.published_at AS available_at
         FROM cie_node_concepts nc
         JOIN cie_content_concepts cc
              ON cc.concept_code = nc.concept_code
             AND cc.content_source = 'master'
             AND cc.confidence <> 'ai_suggested'
         JOIN platform_content p
              ON p.id = cc.content_id AND p.status = 'published'
        WHERE nc.node_code IN (${placeholders}) ${purposeClause}

        UNION ALL

       SELECT nc.node_code, 'school' AS source, a.id AS content_id, t.type_key AS type,
              a.title, a.language, NULL AS asset_url, NULL AS thumb_url,
              a.estimated_minutes * 60 AS duration_secs, 1 AS has_body,
              CAST(a.version AS CHAR) AS version, cc.coverage, cc.confidence,
              a.published_at AS available_at
         FROM cie_node_concepts nc
         JOIN cie_content_concepts cc
              ON cc.concept_code = nc.concept_code
             AND cc.content_source = 'org_private'
             AND cc.org_id = ?
             AND cc.confidence <> 'ai_suggested'
         JOIN client_cms_assets a
              ON a.id = cc.content_id AND a.org_id = ? AND a.status = 'published'
         JOIN client_cms_types t
              ON t.id = a.content_type_id AND t.org_id = a.org_id
        WHERE nc.node_code IN (${placeholders}) ${purposeClause}

        LIMIT ${MAX_CONTENT}`,
      [...params, orgId, orgId, ...leafCodes]);
  }

  // ── DEDUPE, and why it is not optional ──────────────────────────────────
  // The join above is node → concept → content. A topic that teaches FIVE
  // concepts, holding content mapped to all five, yields the same content row
  // five times — and the first end-to-end run of this resolver returned 304
  // items for 57 real objects for exactly that reason.
  //
  // The duplication is a property of the mapping plane being many-to-many in
  // both directions, which is the whole point of it, so the fix belongs here
  // rather than in the schema. Deduping in JS rather than with GROUP BY on
  // purpose: this codebase has confirmed MySQL-vs-MariaDB divergences around
  // ONLY_FULL_GROUP_BY and aggregate aliases, and a resolver that runs locally
  // but not on the server is worse than a slightly longer function.
  //
  // When the same object arrives under several coverages (it covers one concept
  // fully and another only partly), the STRONGEST claim wins — otherwise a video
  // that teaches the topic could be filed under "revision" by whichever row the
  // database happened to return first.
  const COVERAGE_RANK = {
    full: 6, partial: 5, introduces: 4, extends: 3, reinforces: 2, assesses: 1, remediates: 0,
  };
  // ── MEDIUM: prefer the school's language, NEVER hide because of it ───────
  // A Hindi-medium school with no Hindi content yet must see the English video.
  // So this is a PREFERENCE applied per content object, not a WHERE clause: for
  // each object we keep the school's medium if it exists and fall back otherwise.
  //
  // Objects are grouped by their title so that "the same object in two languages"
  // is recognisable without a translation-group column, which does not exist yet.
  // That is a real limitation and it is the honest cheap version: two DIFFERENT
  // videos that happen to share a title would collapse into one. Titles inside a
  // topic are authored to be distinct, so the trade is acceptable until a
  // translation-group id exists.
  const wantMedium = (ctx.medium || 'en').toLowerCase();
  const preferMedium = (rows) => {
    const groups = new Map();
    for (const r of rows) {
      const k = `${r.node_code}|${r.type}|${String(r.title).trim().toLowerCase()}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    const kept = [];
    for (const list of groups.values()) {
      if (list.length === 1) { kept.push(list[0]); continue; }
      const exact = list.filter((r) => String(r.language || 'en').toLowerCase() === wantMedium);
      if (exact.length) { kept.push(...exact); continue; }
      const english = list.filter((r) => String(r.language || 'en').toLowerCase() === 'en');
      kept.push(...(english.length ? english : list));
    }
    return kept;
  };
  contentRows = preferMedium(contentRows);

  // ── PROGRESS + ASSIGNMENT, attached only when someone asked as a person ──
  // Both are optional joins rather than part of the main query because the
  // curriculum resolve is also used by org-1 previews and by the teacher's
  // browse, where there is no student and no section to join against.
  if (contentRows.length && (studentId || sectionId)) {
    const ids = [...new Set(contentRows.map((r) => `${r.source}:${r.content_id}`))];
    const progressBy = new Map();
    const assignedBy = new Map();

    if (studentId) {
      const pr = await query(
        `SELECT content_source, content_id, status, pct, seconds_spent, score, completed_at
           FROM cie_progress WHERE org_id=? AND student_id=?`, [orgId, studentId]);
      for (const r of pr) {
        progressBy.set(`${r.content_source === 'master' ? 'master' : 'school'}:${r.content_id}`, {
          status: r.status, pct: Number(r.pct), seconds_spent: r.seconds_spent,
          score: r.score == null ? null : Number(r.score), completed_at: r.completed_at,
        });
      }
    }
    if (sectionId) {
      const ar = await query(
        `SELECT content_source, content_id, due_date, note
           FROM cie_assignments
          WHERE org_id=? AND section_id=? AND status='active'`, [orgId, sectionId]);
      for (const r of ar) {
        assignedBy.set(`${r.content_source === 'master' ? 'master' : 'school'}:${r.content_id}`, {
          due_date: r.due_date, note: r.note,
        });
      }
    }

    for (const r of contentRows) {
      const k = `${r.source}:${r.content_id}`;
      // A default progress object rather than undefined: every consumer reads
      // `.progress.status`, and an undefined here is the JSX-children crash class
      // this codebase has already shipped once.
      r.progress = progressBy.get(k) || { status: 'not_started', pct: 0, seconds_spent: 0, score: null, completed_at: null };
      r.assigned = assignedBy.get(k) || null;
    }
    void ids;
  } else {
    for (const r of contentRows) {
      r.progress = { status: 'not_started', pct: 0, seconds_spent: 0, score: null, completed_at: null };
      r.assigned = null;
    }
  }

  const byNode = new Map();
  for (const r of contentRows) {
    if (!byNode.has(r.node_code)) byNode.set(r.node_code, new Map());
    const seen = byNode.get(r.node_code);
    const key = `${r.source}:${r.content_id}`;
    const prev = seen.get(key);
    if (!prev || (COVERAGE_RANK[r.coverage] ?? -1) > (COVERAGE_RANK[prev.coverage] ?? -1)) {
      seen.set(key, r);
    }
  }
  for (const [code, seen] of byNode) byNode.set(code, [...seen.values()]);

  // Assemble the tree. Chapters keep their authored sequence; a topic with no
  // content still appears, carrying content_count 0 — because a teacher needs to
  // see that the chapter exists and this bit is not covered yet. Hiding empty
  // topics would make the curriculum look complete when it is not.
  const byParent = new Map();
  for (const n of nodes) {
    const key = n.parent_code || '__root__';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(n);
  }

  const shape = (n) => {
    const content = byNode.get(n.node_code) || [];
    const children = (byParent.get(n.node_code) || []).map(shape);
    return {
      // `steps` is computed HERE, on the server, from the same function the
      // frontend mirrors. The teacher's tab strip and the student's ordered path
      // are two renderings of this one array — and crucially the LOCK decision is
      // the server's, so a client cannot draw an unlocked step the server would
      // refuse to serve.
      steps: groupByPurpose(content),
      node_code: n.node_code,
      node_type: n.node_type,
      name: n.display_name,
      official_code: n.official_code,
      sequence: n.sequence,
      status: n.status,
      teaching_periods: n.teaching_periods,
      assessment_marks: n.assessment_marks,
      content,
      content_count: content.length + children.reduce((a, c) => a + c.content_count, 0),
      children,
    };
  };

  const chapters = (byParent.get('__root__') || []).map(shape);
  const totalContent = chapters.reduce((a, c) => a + c.content_count, 0);

  return {
    match: {
      ...ctx,
      // A tree with chapters but zero content is a real, nameable state and the
      // UI must say it plainly rather than showing an empty screen.
      ok: true,
      empty_library: totalContent === 0,
    },
    chapters,
    totals: {
      chapters: chapters.length,
      topics: leafCodes.length,
      content: totalContent,
    },
  };
}

// classNoFromName and boardKeyFor are exported for tests, not for callers:
// they are the two places a school's free text becomes a curriculum key, so they
// are also the two places a silent regression would stop content reaching a
// classroom without any error anywhere. Covered in tests/cie-resolve.test.js.
module.exports = { resolveForSubject, resolveContext, boardKeyFor, classNoFromName };
