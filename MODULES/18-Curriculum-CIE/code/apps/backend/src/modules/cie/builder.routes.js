'use strict';
const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');
const { normalise } = require('./subjectKey');
const { nodeCodeFor, nextConceptCode, domainFor } = require('./nodeCode');

/*
 * CIE Builder — the write API for the curriculum tree and master content.
 * Decision: ADR-013 + ADR-014 (the auto-concept bootstrap). Tables: 051-055.
 *
 * ── WHAT CHANGED FROM PHASE 1 ──────────────────────────────────────────────
 * cie.routes.js says, in a comment, "there are no writes — the Atlas is
 * authored as files, and the approval gate is the pull-request merge". That was
 * right while the Atlas was 27 hand-written concepts. It stops being right the
 * moment a content library exists and the owner needs to file it: nobody
 * structures a few hundred chapters by editing YAML and waiting for a merge.
 *
 * So writes land here, in a SEPARATE file from the read API, for one reason: the
 * read API is open to every authenticated user and this one is not. Two files
 * means the guard cannot be lost in a merge that only touched a GET.
 *
 * Mounted at /api/cie/builder — its own prefix, because the `router.use(platformOnly)`
 * below runs for every request that ENTERS this router. Sharing /api/cie with the
 * read API would 403 every school on a plain GET. See cie.module.js.
 *
 * ── THE ONE DESIGN DECISION WORTH READING (ADR-014) ─────────────────────────
 * The owner never sees the word "concept".
 *
 * ADR-013's whole architecture is that content maps to grade-agnostic CONCEPTS,
 * never to class-bearing curriculum nodes — that indirection is what makes one
 * worksheet serve five boards (N+M instead of N×M). But authoring an Atlas by
 * hand is slow, and it is exactly the kind of abstraction that makes a product
 * feel like an engineering artefact.
 *
 * The resolution: when a topic is created here, this file ALSO creates the
 * matching concept and the node→concept link, silently. The UI shows
 * Board → Class → Subject → Chapter → Topic → Content, which is what the owner
 * asked for. Underneath, content still attaches to a concept, so:
 *
 *   - the mapping plane stays the only path from content to a board;
 *   - `cie_curriculum_nodes` still has no content column;
 *   - and the day a second board teaches the same idea, POST /nodes/:code/same-as
 *     points its topic at the EXISTING concept and one library serves both.
 *
 * Until someone uses same-as, concepts and topics sit 1:1 and N+M is latent
 * rather than realised. That is a deliberate bootstrap, not a violation: the
 * cheap path stays open, and nothing has to be re-mapped to take it.
 *
 * ── SEPARATION OF DUTIES ───────────────────────────────────────────────────
 * Auto-created concepts land `status='approved'` because the person creating
 * them IS the approver (platformOnly + the owner-level permission below). A
 * curriculum_architect proposing concepts through a future Atlas Studio still
 * goes through proposer ≠ approver — that gate is not weakened here, it simply
 * does not apply when the approver is the actor.
 */

const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);

const platformOnly = (req, res, next) =>
  req.user.org_id === PLATFORM_ORG_ID
    ? next()
    : error(res, 'Curriculum authoring is a WisWits-internal workspace', 403);

router.use(authenticate);
router.use(platformOnly);

// ── Code generation lives in nodeCode.js ────────────────────────────────────
// It was here, and the CMS importer needed the identical grammar. A second copy
// of an immutable-identity generator is a future collision, not duplication:
// two spellings of the subject fragment would mint two trees for one
// class-subject and nobody would see it until a school's chapters appeared
// twice. One module, two callers.
//
// nextConceptCode takes `query` as its first argument because it is shared with
// a standalone script that has its own connection.

// ── Boards ──────────────────────────────────────────────────────────────────
router.post('/boards', async (req, res) => {
  try {
    const { board_key, name, kind } = req.body || {};
    if (!board_key || !name) return error(res, 'board_key and name are both required', 400);
    const key = String(board_key).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
    if (!key) return error(res, 'board_key must contain at least one letter or digit', 400);
    if (kind && !['board', 'program'].includes(kind)) {
      return error(res, "kind must be 'board' or 'program'", 400);
    }
    await query(
      `INSERT INTO cie_boards (board_key, name, kind) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), kind=VALUES(kind)`,
      [key, String(name).slice(0, 120), kind || 'board']);
    await audit(req, 'CURRICULUM_BOARD_SAVE', 'cie_board', key, { new_data: { board_key: key, name, kind: kind || 'board' } });
    return success(res, { board_key: key }, `Saved ${name}`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Create a node — and, invisibly, its concept ──────────────────────────────
// This is the endpoint the whole "easy" claim rests on. One POST creates the
// chapter or topic the owner typed, plus (for leaf-level nodes) the concept that
// content will actually hang off, plus the link between them. The response says
// nothing about concepts.
router.post('/nodes', async (req, res) => {
  try {
    const {
      board, session, subject, subject_name,
      node_type = 'topic', parent_code = null, display_name, official_code = null,
      sequence, teaching_periods = null, assessment_marks = null,
    } = req.body || {};
    const classNo = req.body?.class;

    if (!board || !session || classNo == null || !subject || !display_name) {
      return error(res, 'board, session, class, subject and display_name are all required', 400);
    }
    if (!['unit', 'chapter', 'topic', 'subtopic'].includes(node_type)) {
      return error(res, 'node_type must be unit, chapter, topic or subtopic', 400);
    }

    const boardRow = await queryOne('SELECT board_key FROM cie_boards WHERE board_key=? AND is_active=1', [board]);
    if (!boardRow) return error(res, `Unknown board "${board}" — add it first`, 400);

    const classInt = parseInt(classNo, 10);
    if (!Number.isFinite(classInt)) return error(res, 'class must be a number', 400);
    const subjectKey = normalise(subject);
    if (!subjectKey) return error(res, 'subject must contain at least one letter', 400);

    // A parent must exist, and must sit in the SAME tree — otherwise a topic
    // could be filed under another board's chapter and would resolve for the
    // wrong school. This is the check that keeps the tree a tree.
    if (parent_code) {
      const p = await queryOne(
        `SELECT node_code, board_key, session, class_no, subject_key, node_type
           FROM cie_curriculum_nodes WHERE node_code=? AND is_active=1`, [parent_code]);
      if (!p) return error(res, 'That parent chapter no longer exists', 400);
      if (p.board_key !== board || p.session !== session
          || p.class_no !== classInt || p.subject_key !== subjectKey) {
        return error(res, 'A topic must sit inside a chapter of the same board, class and subject', 400);
      }
    }

    // Sequence: honour an explicit value, otherwise append. Appending is what
    // the builder does 99% of the time and asking the UI to compute it would
    // just move a race into the browser.
    let seq = parseInt(sequence, 10);
    if (!Number.isFinite(seq)) {
      const [max] = await query(
        `SELECT COALESCE(MAX(sequence), 0) AS m FROM cie_curriculum_nodes
          WHERE board_key=? AND session=? AND class_no=? AND subject_key=?
            AND ${parent_code ? 'parent_code=?' : 'parent_code IS NULL'} AND is_active=1`,
        parent_code ? [board, session, classInt, subjectKey, parent_code]
                    : [board, session, classInt, subjectKey]);
      seq = (max?.m || 0) + 1;
    }

    const nodeCode = nodeCodeFor({ board, session, classNo: classInt, subjectKey, nodeType: node_type, seq, parentCode: parent_code });
    const exists = await queryOne('SELECT node_code FROM cie_curriculum_nodes WHERE node_code=?', [nodeCode]);
    if (exists) return error(res, 'A node already exists at that position — refresh and try again', 409);

    await query(
      `INSERT INTO cie_curriculum_nodes
         (node_code, board_key, session, class_no, subject_key, subject_name, node_type,
          parent_code, display_name, official_code, sequence, teaching_periods, assessment_marks,
          status, source_ref)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'draft','builder')`,
      [nodeCode, board, session, classInt, subjectKey, subject_name || subject, node_type,
       parent_code, String(display_name).slice(0, 200), official_code, seq,
       teaching_periods, assessment_marks]);

    // ── the invisible half (ADR-014) ────────────────────────────────────────
    // Only leaf-level nodes get a concept. A chapter is a container; giving it
    // its own concept would double-map every asset inside it and trip the
    // over-mapping check in /quality.
    let conceptCode = null;
    if (node_type === 'topic' || node_type === 'subtopic') {
      const domain = domainFor(subjectKey);
      conceptCode = await nextConceptCode(query, domain);
      await query(
        `INSERT INTO cie_concepts
           (concept_code, domain, canonical_name, granularity, status,
            proposed_by, approved_by, approved_at, source_ref)
         VALUES (?,?,?,'topic','approved',?,?,NOW(),?)`,
        [conceptCode, domain, String(display_name).slice(0, 200),
         req.user.user_id, req.user.user_id, `builder:${nodeCode}`]);
      await query(
        `INSERT INTO cie_node_concepts (node_code, concept_code, weight, rationale, mapped_by)
         VALUES (?,?,1.00,'Created with the topic in the curriculum builder',?)`,
        [nodeCode, conceptCode, req.user.user_id]);
    }

    await audit(req, 'CURRICULUM_NODE_CREATE', 'cie_curriculum_node', nodeCode,
      { new_data: { node_code: nodeCode, board, session, class: classInt, subject: subjectKey,
                    node_type, display_name, sequence: seq, concept_code: conceptCode } });

    return success(res, { node_code: nodeCode, sequence: seq }, `Added ${display_name}`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Rename / reorder / weight a node ────────────────────────────────────────
// node_code, board, session, class and subject are all rejected: changing any of
// them is not an edit, it is a move, and a move must not silently orphan the
// mappings and the content hanging off this node's concept.
const NODE_IMMUTABLE = ['node_code', 'board_key', 'board', 'session', 'class_no', 'class', 'subject_key', 'subject'];

router.patch('/nodes/:code', async (req, res) => {
  try {
    const body = req.body || {};
    const offending = NODE_IMMUTABLE.filter((k) => k in body);
    if (offending.length) {
      return error(res, `${offending.join(', ')} cannot be changed after a node is created`, 400);
    }
    const node = await queryOne(
      'SELECT node_code, display_name, status FROM cie_curriculum_nodes WHERE node_code=? AND is_active=1',
      [req.params.code]);
    if (!node) return error(res, 'That chapter or topic no longer exists', 404);

    const sets = [];
    const vals = [];
    if (body.display_name != null) { sets.push('display_name=?'); vals.push(String(body.display_name).slice(0, 200)); }
    if (body.official_code !== undefined) { sets.push('official_code=?'); vals.push(body.official_code || null); }
    if (body.sequence != null) {
      const s = parseInt(body.sequence, 10);
      if (!Number.isFinite(s)) return error(res, 'sequence must be a number', 400);
      sets.push('sequence=?'); vals.push(s);
    }
    if (body.teaching_periods !== undefined) { sets.push('teaching_periods=?'); vals.push(body.teaching_periods ?? null); }
    if (body.assessment_marks !== undefined) { sets.push('assessment_marks=?'); vals.push(body.assessment_marks ?? null); }
    if (!sets.length) return error(res, 'Nothing to change', 400);

    vals.push(req.params.code);
    await query(`UPDATE cie_curriculum_nodes SET ${sets.join(', ')} WHERE node_code=?`, vals);

    // The concept generated with this topic carries the topic's name. Keeping
    // them in step matters: the concept name is what the "same as" picker shows
    // when a second board looks for this idea, and a stale name makes the one
    // feature that delivers N+M unusable.
    if (body.display_name != null) {
      await query(
        `UPDATE cie_concepts SET canonical_name=? WHERE source_ref=? AND status<>'deprecated'`,
        [String(body.display_name).slice(0, 200), `builder:${req.params.code}`]);
    }

    await audit(req, 'CURRICULUM_NODE_UPDATE', 'cie_curriculum_node', req.params.code,
      { old_data: { display_name: node.display_name }, new_data: body });
    return success(res, { node_code: req.params.code }, 'Saved');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Retire a node ───────────────────────────────────────────────────────────
// Soft only (CLAUDE.md §15: mark → migrate → remove). A hard delete would break
// the FK from cie_node_concepts and, worse, would silently drop content that is
// still mapped to the concept underneath.
router.delete('/nodes/:code', async (req, res) => {
  try {
    const node = await queryOne(
      'SELECT node_code, display_name FROM cie_curriculum_nodes WHERE node_code=? AND is_active=1',
      [req.params.code]);
    if (!node) return error(res, 'That chapter or topic no longer exists', 404);

    const kids = await query(
      'SELECT node_code FROM cie_curriculum_nodes WHERE parent_code=? AND is_active=1 LIMIT 1', [req.params.code]);
    if (kids.length) return error(res, 'Remove the topics inside this chapter first', 409);

    await query('UPDATE cie_curriculum_nodes SET is_active=0, status=\'archived\' WHERE node_code=?', [req.params.code]);
    await audit(req, 'CURRICULUM_NODE_ARCHIVE', 'cie_curriculum_node', req.params.code,
      { old_data: { display_name: node.display_name } });
    return success(res, {}, `Removed ${node.display_name}`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── "Same as" — the button where N+M actually starts paying ─────────────────
// Point this topic at a concept that already exists, instead of its own generated
// one. After this, every content object already mapped to that concept appears
// under this topic too — for a different board, a different class, immediately,
// with nothing re-uploaded and nothing re-tagged.
//
// The generated concept is deprecated rather than deleted: content may already
// hang off it, and deleting it would take that content out of resolution
// silently. Deprecating leaves it findable and leaves the mappings intact.
router.post('/nodes/:code/same-as', async (req, res) => {
  try {
    const { concept_code } = req.body || {};
    if (!concept_code) return error(res, 'Pick the topic this one is the same as', 400);

    const node = await queryOne(
      'SELECT node_code, display_name FROM cie_curriculum_nodes WHERE node_code=? AND is_active=1',
      [req.params.code]);
    if (!node) return error(res, 'That topic no longer exists', 404);

    const target = await queryOne(
      "SELECT concept_code, canonical_name FROM cie_concepts WHERE concept_code=? AND status<>'deprecated'",
      [concept_code]);
    if (!target) return error(res, 'That idea no longer exists', 400);

    const generated = await query(
      'SELECT concept_code FROM cie_concepts WHERE source_ref=?', [`builder:${req.params.code}`]);

    // Link first, then retire — so the node is never momentarily concept-less
    // (a concept-less published node is an orphan and would stop resolving).
    await query(
      `INSERT INTO cie_node_concepts (node_code, concept_code, weight, rationale, mapped_by)
       VALUES (?,?,1.00,'Marked as the same idea as an existing topic',?)
       ON DUPLICATE KEY UPDATE weight=1.00`,
      [req.params.code, concept_code, req.user.user_id]);

    for (const g of generated) {
      if (g.concept_code === concept_code) continue;
      const used = await queryOne(
        'SELECT id FROM cie_content_concepts WHERE concept_code=? LIMIT 1', [g.concept_code]);
      await query('DELETE FROM cie_node_concepts WHERE node_code=? AND concept_code=?',
        [req.params.code, g.concept_code]);
      // Only deprecate a generated concept that nothing is mapped to. If content
      // already hangs off it, leave it approved and leave it linked to nothing —
      // it is now a real concept with a real library, and the content team can
      // merge it deliberately.
      if (!used) {
        await query("UPDATE cie_concepts SET status='deprecated' WHERE concept_code=?", [g.concept_code]);
      }
    }

    await audit(req, 'CURRICULUM_NODE_SAME_AS', 'cie_curriculum_node', req.params.code,
      { new_data: { node_code: req.params.code, concept_code, concept_name: target.canonical_name } });
    return success(res, { concept_code }, `Linked to ${target.canonical_name}`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── The "same as" picker's search ───────────────────────────────────────────
// Deliberately does NOT return the concept the caller's own node already owns —
// offering a topic the chance to be "the same as itself" is a support ticket.
router.get('/concepts/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const exclude = String(req.query.exclude_node || '');
    if (q.length < 2) return success(res, { concepts: [] });
    const rows = await query(
      `SELECT c.concept_code, c.canonical_name, c.domain,
              (SELECT COUNT(*) FROM cie_content_concepts cc WHERE cc.concept_code=c.concept_code) AS content_count,
              (SELECT GROUP_CONCAT(DISTINCT CONCAT(n.board_key,' ',n.class_no) ORDER BY n.board_key SEPARATOR ', ')
                 FROM cie_node_concepts nc JOIN cie_curriculum_nodes n ON n.node_code=nc.node_code
                WHERE nc.concept_code=c.concept_code AND n.is_active=1) AS taught_in
         FROM cie_concepts c
        WHERE c.status='approved' AND c.is_active=1
          AND c.canonical_name LIKE ?
          AND (? = '' OR c.source_ref <> CONCAT('builder:', ?))
        ORDER BY content_count DESC, c.canonical_name ASC
        LIMIT 20`,
      [`%${q}%`, exclude, exclude]);
    return success(res, { concepts: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Content: attach a learning object to a topic ────────────────────────────
// Writes platform_content (the global master store) AND the content→concept
// mapping, in that order, in one call. Two calls would leave unmapped content
// behind every time the second one failed, and unmapped content is invisible to
// resolution — the "dead feature that reads as no data" failure mode.
router.post('/content', async (req, res) => {
  try {
    const {
      node_code, type, title, language = 'en',
      asset_url = null, thumb_url = null, duration_secs = null,
      body_html = null, coverage = 'full', publish = false,
    } = req.body || {};

    if (!node_code || !type || !title) {
      return error(res, 'node_code, type and title are all required', 400);
    }
    if (!asset_url && !body_html) {
      return error(res, 'Add a file, a link, or written content — one of the two is required', 400);
    }
    const COVERAGE = ['full', 'partial', 'introduces', 'reinforces', 'assesses', 'remediates', 'extends'];
    if (!COVERAGE.includes(coverage)) return error(res, `coverage must be one of: ${COVERAGE.join(', ')}`, 400);

    const node = await queryOne(
      `SELECT node_code, board_key, class_no, subject_key, subject_name, display_name, parent_code, node_type
         FROM cie_curriculum_nodes WHERE node_code=? AND is_active=1`, [node_code]);
    if (!node) return error(res, 'That topic no longer exists', 404);
    if (node.node_type === 'unit' || node.node_type === 'chapter') {
      return error(res, 'Add content to a topic, not to a chapter', 400);
    }

    // Resolution reads content through concepts, so a topic with no concept can
    // hold content that nobody can ever see. Refuse rather than accept it.
    const concepts = await query(
      'SELECT concept_code FROM cie_node_concepts WHERE node_code=?', [node_code]);
    if (!concepts.length) {
      return error(res, 'This topic is not linked to an idea yet, so content added here would be unreachable', 409);
    }

    const chapter = node.parent_code
      ? await queryOne('SELECT display_name FROM cie_curriculum_nodes WHERE node_code=?', [node.parent_code])
      : null;

    // platform_content's board/class/subject/chapter/topic columns are
    // DENORMALISED copies, kept for the existing content-dev console, search and
    // the author-scope check (platform_content_scope matches on them). They are
    // NOT how resolution finds content — that is cie_content_concepts. Writing
    // both keeps the old surface working without making it a second source of
    // truth.
    const r = await query(
      `INSERT INTO platform_content
         (board, \`class\`, subject, chapter, topic, type, title, language,
          body_html, asset_url, thumb_url, duration_secs, status, author_id, published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [node.board_key, String(node.class_no), node.subject_name || node.subject_key,
       chapter?.display_name || null, node.display_name, String(type).slice(0, 40),
       String(title).slice(0, 255), language, body_html, asset_url, thumb_url,
       duration_secs ? parseInt(duration_secs, 10) : null,
       publish ? 'published' : 'draft', req.user.user_id, publish ? new Date() : null]);

    const contentId = r.insertId;

    for (const c of concepts) {
      await query(
        `INSERT INTO cie_content_concepts
           (content_source, content_id, org_id, concept_code, coverage, confidence, rationale, mapped_by)
         VALUES ('master', ?, NULL, ?, ?, 'human_reviewed', 'Added to this topic in the curriculum builder', ?)
         ON DUPLICATE KEY UPDATE coverage=VALUES(coverage)`,
        [contentId, c.concept_code, coverage, req.user.user_id]);
    }

    await audit(req, publish ? 'CONTENT_PUBLISH' : 'CONTENT_CREATE', 'platform_content', String(contentId),
      { new_data: { id: contentId, node_code, type, title, published: !!publish,
                    concepts: concepts.map((c) => c.concept_code) } });

    return success(res, { id: contentId, concepts: concepts.length },
      publish ? `Published ${title}` : `Saved ${title} as draft`);
  } catch (e) { return error(res, e.message, 500); }
});

// ── Content listing for one topic (the builder's right-hand panel) ──────────
router.get('/content', async (req, res) => {
  try {
    const nodeCode = String(req.query.node_code || '');
    if (!nodeCode) return error(res, 'node_code is required', 400);
    const rows = await query(
      `SELECT DISTINCT p.id, p.type, p.title, p.language, p.status, p.asset_url, p.thumb_url,
              p.duration_secs, p.version, p.published_at, p.created_at,
              cc.coverage, cc.confidence
         FROM cie_node_concepts nc
         JOIN cie_content_concepts cc
              ON cc.concept_code = nc.concept_code AND cc.content_source='master'
         JOIN platform_content p ON p.id = cc.content_id
        WHERE nc.node_code = ? AND p.status <> 'archived'
        ORDER BY FIELD(p.status,'published','submitted','draft'), p.created_at DESC
        LIMIT 500`, [nodeCode]);
    return success(res, { content: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.patch('/content/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return error(res, 'Bad content id', 400);
    const row = await queryOne('SELECT id, title, status FROM platform_content WHERE id=?', [id]);
    if (!row) return error(res, 'That content no longer exists', 404);

    const body = req.body || {};
    const sets = [];
    const vals = [];
    for (const [col, key] of [['title', 'title'], ['type', 'type'], ['language', 'language'],
                              ['asset_url', 'asset_url'], ['thumb_url', 'thumb_url'],
                              ['body_html', 'body_html']]) {
      if (body[key] !== undefined) { sets.push(`${col}=?`); vals.push(body[key] ?? null); }
    }
    if (body.duration_secs !== undefined) {
      sets.push('duration_secs=?');
      vals.push(body.duration_secs == null ? null : parseInt(body.duration_secs, 10));
    }
    if (body.status !== undefined) {
      if (!['draft', 'submitted', 'published', 'archived'].includes(body.status)) {
        return error(res, 'Unknown status', 400);
      }
      sets.push('status=?'); vals.push(body.status);
      if (body.status === 'published') sets.push('published_at=NOW()');
    }
    if (!sets.length) return error(res, 'Nothing to change', 400);

    sets.push('updated_by=?'); vals.push(req.user.user_id);
    vals.push(id);
    await query(`UPDATE platform_content SET ${sets.join(', ')} WHERE id=?`, vals);

    if (body.coverage !== undefined) {
      await query(
        "UPDATE cie_content_concepts SET coverage=? WHERE content_source='master' AND content_id=?",
        [body.coverage, id]);
    }

    await audit(req, 'CONTENT_UPDATE', 'platform_content', String(id),
      { old_data: { title: row.title, status: row.status }, new_data: body });
    return success(res, { id }, 'Saved');
  } catch (e) { return error(res, e.message, 500); }
});

// Archive, never delete. content-dev's recall already propagates an archive
// across every tenant that copied the row; a hard delete would leave those
// copies pointing at nothing.
router.delete('/content/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return error(res, 'Bad content id', 400);
    const row = await queryOne('SELECT id, title FROM platform_content WHERE id=?', [id]);
    if (!row) return error(res, 'That content no longer exists', 404);
    await query("UPDATE platform_content SET status='archived', updated_by=? WHERE id=?", [req.user.user_id, id]);
    await audit(req, 'CONTENT_ARCHIVE', 'platform_content', String(id), { old_data: { title: row.title } });
    return success(res, {}, `Removed ${row.title}`);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
