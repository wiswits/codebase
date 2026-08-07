const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { success, error } = require('../../utils/response');
const { audit } = require('../../utils/audit');

/*
 * CIE — Curriculum Intelligence Engine, read API (CIE-1.4).
 * Decision: ADR-013. Plan: docs/specs/CIE_IMPLEMENTATION_PLAN.md. Tables: 051-053.
 *
 * ── WHAT THIS MODULE IS ────────────────────────────────────────────────────
 * The Atlas (board-agnostic concepts + typed edges) and the board curriculum
 * trees, plus the mappings between them. Authored by org #1, read by everyone.
 *
 * ── WHAT IT IS NOT, YET ────────────────────────────────────────────────────
 * There is no resolver here. Turning "who + where + what for" into an ordered
 * set of content is Phase 2, and it deliberately does not exist yet: Phase 1's
 * job is to prove the spine holds, and a resolver written before the spine is
 * proven is a resolver written against a guess.
 *
 * ── WRITES ─────────────────────────────────────────────────────────────────
 * There are none. The Atlas is authored as files and loaded by
 * scripts/cie_load.js, so the approval gate is the pull-request merge — which
 * is exactly the "proposer is not approver" rule ADR-013 §3a requires, enforced
 * by git instead of by a permission workflow nobody has written yet. Write
 * endpoints arrive with the Atlas Studio UI in Phase 3+, not before.
 *
 * ── WHO CAN READ ───────────────────────────────────────────────────────────
 * Any authenticated user. That is deliberate and matches PRD §15's cross-tenant
 * law: master content and the Atlas are the ONLY shared surfaces, and they are
 * read-only to organisations. Nothing here is tenant data — there is no org_id
 * on any of these tables — so there is nothing to scope and nothing to leak.
 * The moment org-scoped rows enter (cie_content_concepts for org_private
 * content, Phase 3), every query touching them scopes by org_id.
 */

const PLATFORM_ORG_ID = parseInt(process.env.PLATFORM_ORG_ID || '1', 10);

// Kept for the write endpoints that land in Phase 3 — the guard the whole
// "org 1 authors, schools read" model rests on. Same shape as the one in
// content-dev and curriculum, deliberately: three modules enforcing the same
// rule three different ways is how the rule eventually gets enforced twice and
// skipped once.
const platformOnly = (req, res, next) =>
  req.user.org_id === PLATFORM_ORG_ID
    ? next()
    : error(res, 'Curriculum authoring is a WisWits-internal workspace', 403);

router.use(authenticate);

const LIMIT = 2000;   // interpolated, never bound — see the note on /concepts

// ── Overview ────────────────────────────────────────────────────────────────
// One call for the console header: how much Atlas exists, and how much of it is
// actually reachable from a board. The last number is the one that matters —
// concepts nobody teaches are work that has not paid off yet.
router.get('/overview', async (req, res) => {
  try {
    const [counts] = await query(
      `SELECT
         (SELECT COUNT(*) FROM cie_concepts WHERE is_active=1)          AS concepts,
         (SELECT COUNT(*) FROM cie_concept_edges)                        AS edges,
         (SELECT COUNT(*) FROM cie_boards WHERE is_active=1)             AS boards,
         (SELECT COUNT(*) FROM cie_curriculum_nodes WHERE is_active=1)   AS nodes,
         (SELECT COUNT(*) FROM cie_node_concepts)                        AS node_mappings,
         (SELECT COUNT(*) FROM cie_content_concepts)                     AS content_mappings,
         (SELECT COUNT(DISTINCT concept_code) FROM cie_node_concepts)    AS concepts_taught`);
    const domains = await query(
      `SELECT domain, COUNT(*) AS concepts FROM cie_concepts WHERE is_active=1 GROUP BY domain ORDER BY domain`);
    const boards = await query(
      `SELECT b.board_key, b.name, b.kind,
              COUNT(DISTINCT n.node_code) AS nodes,
              COUNT(DISTINCT CONCAT(n.class_no,'-',n.subject_key)) AS class_subjects
         FROM cie_boards b
         LEFT JOIN cie_curriculum_nodes n ON n.board_key = b.board_key AND n.is_active = 1
        WHERE b.is_active = 1
        GROUP BY b.board_key, b.name, b.kind
        ORDER BY b.sort_order, b.board_key`);
    return success(res, {
      counts: {
        ...counts,
        // Orphan concepts: authored but not reachable from any board tree.
        // PRD §8.3 wants this visible, not buried in a nightly job nobody reads.
        concepts_orphan: Number(counts.concepts) - Number(counts.concepts_taught),
      },
      domains,
      boards,
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Concepts ────────────────────────────────────────────────────────────────
// LIMIT is interpolated from a validated integer constant, never bound as a
// parameter. `LIMIT ?` is a documented engine split in this codebase — it works
// on the server's MariaDB and fails on a developer's MySQL, which means the bug
// only ever shows up somewhere it cannot be reproduced.
router.get('/concepts', async (req, res) => {
  try {
    const { domain, q, granularity, orphan } = req.query;
    let where = 'WHERE c.is_active = 1';
    const p = [];
    if (domain) { where += ' AND c.domain = ?'; p.push(domain); }
    if (granularity) { where += ' AND c.granularity = ?'; p.push(granularity); }
    if (q) { where += ' AND (c.canonical_name LIKE ? OR c.concept_code LIKE ?)'; p.push(`%${q}%`, `%${q}%`); }
    if (orphan === '1') where += ' AND NOT EXISTS (SELECT 1 FROM cie_node_concepts nc WHERE nc.concept_code = c.concept_code)';

    const rows = await query(
      `SELECT c.concept_code, c.domain, c.canonical_name, c.granularity, c.description, c.status,
              (SELECT COUNT(*) FROM cie_concept_edges e WHERE e.to_concept = c.concept_code AND e.relation='prerequisite_of') AS unlocks,
              (SELECT COUNT(*) FROM cie_concept_edges e WHERE e.from_concept = c.concept_code AND e.relation='prerequisite_of') AS prerequisites,
              (SELECT COUNT(DISTINCT n.board_key) FROM cie_node_concepts nc
                 JOIN cie_curriculum_nodes n ON n.node_code = nc.node_code
                WHERE nc.concept_code = c.concept_code) AS boards_reaching,
              (SELECT COUNT(*) FROM cie_content_concepts cc WHERE cc.concept_code = c.concept_code) AS content_count
         FROM cie_concepts c
         ${where}
         ORDER BY c.domain, c.concept_code
         LIMIT ${LIMIT}`, p);
    return success(res, { concepts: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// One concept, with everything hanging off it — its edges in both directions,
// and every curriculum node in every board that teaches it. That last list is
// the whole value proposition rendered as data.
router.get('/concepts/:code', async (req, res) => {
  try {
    const concept = await queryOne(
      `SELECT * FROM cie_concepts WHERE concept_code = ?`, [req.params.code]);
    if (!concept) return error(res, 'Concept not found', 404);

    const outgoing = await query(
      `SELECT e.relation, e.to_concept AS concept_code, c.canonical_name, c.domain
         FROM cie_concept_edges e JOIN cie_concepts c ON c.concept_code = e.to_concept
        WHERE e.from_concept = ? ORDER BY e.relation, c.canonical_name`, [req.params.code]);
    const incoming = await query(
      `SELECT e.relation, e.from_concept AS concept_code, c.canonical_name, c.domain
         FROM cie_concept_edges e JOIN cie_concepts c ON c.concept_code = e.from_concept
        WHERE e.to_concept = ? ORDER BY e.relation, c.canonical_name`, [req.params.code]);
    const taughtIn = await query(
      `SELECT n.node_code, n.board_key, n.session, n.class_no, n.subject_key, n.display_name,
              n.node_type, n.status, nc.weight, nc.rationale
         FROM cie_node_concepts nc
         JOIN cie_curriculum_nodes n ON n.node_code = nc.node_code
        WHERE nc.concept_code = ?
        ORDER BY n.board_key, n.class_no, n.sequence`, [req.params.code]);

    return success(res, { concept, outgoing, incoming, taughtIn });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Boards and trees ────────────────────────────────────────────────────────
router.get('/boards', async (req, res) => {
  try {
    const boards = await query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM cie_curriculum_nodes n WHERE n.board_key = b.board_key AND n.is_active=1) AS nodes
         FROM cie_boards b WHERE b.is_active = 1 ORDER BY b.sort_order, b.board_key`);
    return success(res, { boards });
  } catch (e) { return error(res, e.message, 500); }
});

// The class+subject combinations that actually have a tree. Drives the picker.
router.get('/trees', async (req, res) => {
  try {
    const { board } = req.query;
    let where = 'WHERE is_active = 1';
    const p = [];
    if (board) { where += ' AND board_key = ?'; p.push(board); }
    const trees = await query(
      `SELECT board_key, session, class_no, subject_key, MAX(subject_name) AS subject_name,
              COUNT(*) AS nodes,
              SUM(status = 'published') AS published_nodes
         FROM cie_curriculum_nodes ${where}
         GROUP BY board_key, session, class_no, subject_key
         ORDER BY board_key, class_no, subject_key`, p);
    return success(res, { trees });
  } catch (e) { return error(res, e.message, 500); }
});

// A tree, flat, with its concept mappings attached. Flat rather than nested
// because the client needs both a tree view and a table view of the same data,
// and nesting server-side forces the table to un-nest it again.
router.get('/nodes', async (req, res) => {
  try {
    const { board, session, subject } = req.query;
    const classNo = req.query.class;
    let where = 'WHERE n.is_active = 1';
    const p = [];
    if (board) { where += ' AND n.board_key = ?'; p.push(board); }
    if (session) { where += ' AND n.session = ?'; p.push(session); }
    if (classNo) { where += ' AND n.class_no = ?'; p.push(parseInt(classNo, 10)); }
    if (subject) { where += ' AND n.subject_key = ?'; p.push(subject); }

    const nodes = await query(
      `SELECT n.node_code, n.board_key, n.session, n.class_no, n.stream, n.subject_key, n.subject_name,
              n.node_type, n.parent_code, n.display_name, n.official_code, n.sequence,
              n.teaching_periods, n.assessment_marks, n.status, n.version,
              (SELECT COUNT(*) FROM cie_node_concepts nc WHERE nc.node_code = n.node_code) AS concept_count
         FROM cie_curriculum_nodes n
         ${where}
         ORDER BY n.class_no, n.subject_key, n.sequence, n.node_code
         LIMIT ${LIMIT}`, p);

    if (!nodes.length) return success(res, { nodes: [], conceptsByNode: {} });

    // One query for every node's concepts rather than N queries — the tree view
    // renders them all at once, and this endpoint sits on an academic screen
    // that has to hold the §12 performance budget.
    const codes = nodes.map((n) => n.node_code);
    const placeholders = codes.map(() => '?').join(',');
    const maps = await query(
      `SELECT nc.node_code, nc.concept_code, nc.weight, nc.rationale, c.canonical_name, c.domain
         FROM cie_node_concepts nc
         JOIN cie_concepts c ON c.concept_code = nc.concept_code
        WHERE nc.node_code IN (${placeholders})
        ORDER BY nc.weight DESC, c.concept_code`, codes);

    const conceptsByNode = {};
    for (const m of maps) (conceptsByNode[m.node_code] ||= []).push(m);
    return success(res, { nodes, conceptsByNode });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/nodes/:code', async (req, res) => {
  try {
    const node = await queryOne(
      `SELECT * FROM cie_curriculum_nodes WHERE node_code = ?`, [req.params.code]);
    if (!node) return error(res, 'Curriculum node not found', 404);
    const concepts = await query(
      `SELECT nc.concept_code, nc.weight, nc.rationale, c.canonical_name, c.domain, c.granularity, c.description
         FROM cie_node_concepts nc
         JOIN cie_concepts c ON c.concept_code = nc.concept_code
        WHERE nc.node_code = ? ORDER BY nc.weight DESC, c.concept_code`, [req.params.code]);
    const children = await query(
      `SELECT node_code, display_name, node_type, sequence, status
         FROM cie_curriculum_nodes WHERE parent_code = ? AND is_active = 1 ORDER BY sequence`, [req.params.code]);
    return success(res, { node, concepts, children });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Cross-board reach — the architecture, as an endpoint ────────────────────
// For every concept taught by more than one board, which boards and which years.
// This is CIE-1.8's proof rendered for a human: each row here is a concept that
// would have been duplicated once per board under the old design, and is not.
router.get('/cross-board', async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.concept_code, c.canonical_name, c.domain,
              COUNT(DISTINCT n.board_key) AS board_count,
              COUNT(DISTINCT n.class_no)  AS class_count,
              GROUP_CONCAT(DISTINCT CONCAT(n.board_key, ' · Class ', n.class_no)
                           ORDER BY n.board_key, n.class_no SEPARATOR ' | ') AS reached_from
         FROM cie_concepts c
         JOIN cie_node_concepts nc ON nc.concept_code = c.concept_code
         JOIN cie_curriculum_nodes n ON n.node_code = nc.node_code AND n.is_active = 1
        GROUP BY c.concept_code, c.canonical_name, c.domain
       HAVING board_count > 1
        ORDER BY board_count DESC, class_count DESC, c.concept_code
        LIMIT ${LIMIT}`);
    return success(res, { shared: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Mapping quality (CIE-1.10, read half) ───────────────────────────────────
// Findings only. Nothing is auto-deleted or auto-fixed — CLAUDE.md §12.1 rule 2:
// an audit is a proposal list, never an action list.
router.get('/quality', async (req, res) => {
  try {
    const orphanConcepts = await query(
      `SELECT c.concept_code, c.canonical_name, c.domain
         FROM cie_concepts c
        WHERE c.is_active = 1
          AND NOT EXISTS (SELECT 1 FROM cie_node_concepts nc WHERE nc.concept_code = c.concept_code)
        ORDER BY c.concept_code LIMIT ${LIMIT}`);
    const orphanNodes = await query(
      `SELECT n.node_code, n.board_key, n.class_no, n.subject_key, n.display_name, n.status
         FROM cie_curriculum_nodes n
        WHERE n.is_active = 1
          AND NOT EXISTS (SELECT 1 FROM cie_node_concepts nc WHERE nc.node_code = n.node_code)
          AND NOT EXISTS (SELECT 1 FROM cie_curriculum_nodes k WHERE k.parent_code = n.node_code)
        ORDER BY n.node_code LIMIT ${LIMIT}`);
    // PRD §8.3: an object claiming FULL coverage of more than five concepts is
    // usually one object that should have been three.
    const overMapped = await query(
      `SELECT content_source, content_id, COUNT(*) AS full_claims
         FROM cie_content_concepts
        WHERE coverage = 'full'
        GROUP BY content_source, content_id
       HAVING full_claims > 5
        ORDER BY full_claims DESC LIMIT ${LIMIT}`);
    const disputed = await query(
      `SELECT cc.content_source, cc.content_id, cc.concept_code, cc.disputed_note, c.canonical_name
         FROM cie_content_concepts cc
         JOIN cie_concepts c ON c.concept_code = cc.concept_code
        WHERE cc.confidence = 'disputed' ORDER BY cc.mapped_at DESC LIMIT ${LIMIT}`);
    return success(res, {
      orphanConcepts, orphanNodes, overMapped, disputed,
      summary: {
        orphan_concepts: orphanConcepts.length,
        orphan_nodes: orphanNodes.length,
        over_mapped: overMapped.length,
        disputed: disputed.length,
      },
    });
  } catch (e) { return error(res, e.message, 500); }
});

// ── Publish a tree (the one write, and it is a status flip) ─────────────────
// A tree is not resolvable by a school until it is published, and PRD §8.3 says
// a node with no Atlas edge must never publish — it would render to a teacher as
// an empty chapter, which reads as "the platform has nothing" rather than
// "nobody mapped this yet". So the gate is enforced here, not documented here.
router.post('/trees/publish', platformOnly, async (req, res) => {
  try {
    const { board, session, subject } = req.body || {};
    const classNo = req.body?.class;
    if (!board || !session || classNo == null || !subject) {
      return error(res, 'board, session, class and subject are all required', 400);
    }
    const scope = [board, session, parseInt(classNo, 10), subject];

    const orphans = await query(
      `SELECT n.node_code, n.display_name
         FROM cie_curriculum_nodes n
        WHERE n.board_key=? AND n.session=? AND n.class_no=? AND n.subject_key=? AND n.is_active=1
          AND NOT EXISTS (SELECT 1 FROM cie_node_concepts nc WHERE nc.node_code = n.node_code)
          AND NOT EXISTS (SELECT 1 FROM cie_curriculum_nodes k WHERE k.parent_code = n.node_code)`, scope);
    if (orphans.length) {
      return error(res, `${orphans.length} node(s) teach no concept — map them to the Atlas before publishing`, 409,
        orphans.map((o) => `${o.node_code} — ${o.display_name}`));
    }

    const r = await query(
      `UPDATE cie_curriculum_nodes
          SET status='published', published_at=NOW(), published_by=?
        WHERE board_key=? AND session=? AND class_no=? AND subject_key=? AND is_active=1 AND status='draft'`,
      [req.user.user_id, ...scope]);

    await audit(req, 'CURRICULUM_PUBLISH', 'cie_curriculum_tree', `${board}-${session}-${classNo}-${subject}`,
      { new_data: { board, session, class: classNo, subject, nodes_published: r.affectedRows } });

    return success(res, { published: r.affectedRows }, `Published ${r.affectedRows} node(s)`);
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
