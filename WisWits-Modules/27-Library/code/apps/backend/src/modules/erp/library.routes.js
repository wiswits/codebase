const express = require('express');
const router  = express.Router();
const { query, queryOne, transaction } = require('../../config/db');
const { success, error }  = require('../../utils/response');
const { authenticate }    = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission } = require('../../middleware/rbac');
const { parseMoney, moneyError } = require('../../utils/money');
const { buildNameSearch } = require('../../utils/sqlBuild');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('library'));
// ═══ STATS ═══
router.get('/stats', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_library_books WHERE org_id=? AND status='active') total_books,
        (SELECT COALESCE(SUM(copies_total),0) FROM client_library_books WHERE org_id=? AND status='active') total_copies,
        (SELECT COUNT(*) FROM client_book_issues WHERE org_id=? AND status='issued') currently_issued,
        (SELECT COUNT(*) FROM client_book_issues WHERE org_id=? AND status='overdue') overdue_count,
        (SELECT COUNT(*) FROM client_library_members WHERE org_id=? AND status='active') total_members,
        (SELECT COALESCE(SUM(fine_amount - fine_paid),0) FROM client_book_issues WHERE org_id=? AND status='overdue') pending_fines
    `, [orgId, orgId, orgId, orgId, orgId, orgId]);
    return success(res, stats);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ BOOKS ═══
router.get('/books', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { search='', category_id, availability, page=1, limit=30 } = req.query;
    const offset = (parseInt(page)-1) * parseInt(limit);
    let where = "WHERE b.org_id=? AND b.status='active'";
    const params = [orgId];
    if (search) {
      where += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.subject LIKE ?)';
      const q = `%${search}%`;
      params.push(q,q,q,q);
    }
    if (category_id) { where += ' AND b.category_id=?'; params.push(category_id); }
    if (availability === 'available') where += ' AND b.copies_available > 0';
    if (availability === 'issued')    where += ' AND b.copies_available < b.copies_total';

    const countRow = await queryOne(`SELECT COUNT(*) total FROM client_library_books b ${where}`, params);
    const books = await query(`
      SELECT b.*, c.name as category_name
      FROM client_library_books b
      LEFT JOIN client_book_categories c ON c.id=b.category_id
      ${where}
      ORDER BY b.title
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    return success(res, {
      books,
      pagination: { total: countRow.total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countRow.total/parseInt(limit)) }
    });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/books/:id', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const book = await queryOne(`
      SELECT b.*, c.name as category_name
      FROM client_library_books b
      LEFT JOIN client_book_categories c ON c.id=b.category_id
      WHERE b.id=? AND b.org_id=?`, [id, orgId]);
    if (!book) return error(res, 'Not found', 404);
    
    const issues = await query(`
      SELECT bi.*, m.card_no, u.first_name, u.last_name
      FROM client_book_issues bi
      LEFT JOIN client_library_members m ON m.id=bi.member_id
      LEFT JOIN client_users u ON u.id=m.user_id
      WHERE bi.book_id=? AND bi.org_id=?
      ORDER BY bi.issue_date DESC LIMIT 20`, [id, orgId]);
    
    return success(res, { book, issues });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/books', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { title, author, isbn, publisher, edition, publication_year, category_id, subject, language='English', copies_total=1, location_code, cover_url, description, price } = req.body;
    if (!title) return error(res, 'title required', 400);
    const r = await query(
      `INSERT INTO client_library_books (org_id, title, author, isbn, publisher, edition, publication_year, category_id, subject, language, copies_total, copies_available, location_code, cover_url, description, price, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orgId, title, author||null, isbn||null, publisher||null, edition||null, publication_year||null, category_id||null, subject||null, language, copies_total, copies_total, location_code||null, cover_url||null, description||null, price||null, 'active']);
    return success(res, { id: r.insertId }, 'Book added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/books/:id', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const b = await queryOne('SELECT * FROM client_library_books WHERE id=? AND org_id=?', [id, orgId]);
    if (!b) return error(res, 'Not found', 404);
    const { title, author, isbn, publisher, edition, publication_year, category_id, subject, language, copies_total, location_code, cover_url, description, price, status } = req.body;
    
    // Adjust copies_available if copies_total changes
    let copies_available = b.copies_available;
    if (copies_total !== undefined && copies_total !== b.copies_total) {
      const diff = copies_total - b.copies_total;
      copies_available = Math.max(0, b.copies_available + diff);
    }
    
    await query(
      `UPDATE client_library_books SET title=COALESCE(?,title), author=?, isbn=?, publisher=?, edition=?, publication_year=?, category_id=?, subject=?, language=COALESCE(?,language), copies_total=COALESCE(?,copies_total), copies_available=?, location_code=?, cover_url=?, description=?, price=?, status=COALESCE(?,status)
       WHERE id=?`,
      [title||null, author||null, isbn||null, publisher||null, edition||null, publication_year||null, category_id||null, subject||null, language||null, copies_total||null, copies_available, location_code||null, cover_url||null, description||null, price||null, status||null, id]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/books/:id', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const issued = await queryOne("SELECT COUNT(*) cnt FROM client_book_issues WHERE book_id=? AND status IN ('issued','overdue')", [id]);
    if (issued.cnt > 0) {
      await query("UPDATE client_library_books SET status='archived' WHERE id=? AND org_id=?", [id, orgId]);
      return success(res, {}, 'Book archived (has active issues)');
    }
    await query('DELETE FROM client_library_books WHERE id=? AND org_id=?', [id, orgId]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ CATEGORIES ═══
router.get('/categories', async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const cats = await query(`
      SELECT c.*, (SELECT COUNT(*) FROM client_library_books WHERE category_id=c.id AND status='active') book_count
      FROM client_book_categories c WHERE c.org_id=? ORDER BY c.name`, [orgId]);
    return success(res, { categories: cats });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/categories', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, parent_id } = req.body;
    if (!name) return error(res, 'name required', 400);
    const r = await query('INSERT INTO client_book_categories (org_id, name, parent_id) VALUES (?,?,?)', [orgId, name, parent_id||null]);
    return success(res, { id: r.insertId }, 'Created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ MEMBERS ═══
// Member PII (name/email/phone) — librarian/staff only.
router.get('/members', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { search='', type } = req.query;
    let where = "WHERE m.org_id=?";
    const params = [orgId];
    if (search) {
      const ns = buildNameSearch(search, 'u', ['m.card_no', 'u.email']);
      if (ns.clause) { where += ` AND ${ns.clause}`; params.push(...ns.values); }
    }
    if (type) { where += ' AND m.member_type=?'; params.push(type); }
    const members = await query(`
      SELECT m.*, u.first_name, u.last_name, u.email, u.phone,
        s.admission_number,
        c.name as class_name, sec.name as section_name,
        (SELECT COUNT(*) FROM client_book_issues WHERE member_id=m.id AND status IN ('issued','overdue')) active_issues,
        (SELECT COUNT(*) FROM client_book_issues WHERE member_id=m.id) total_issues
      FROM client_library_members m
      JOIN client_users u ON u.id=m.user_id
      LEFT JOIN client_students s ON s.user_id=u.id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      ${where}
      ORDER BY u.first_name LIMIT 200`, params);
    return success(res, { members });
  } catch (e) { return error(res, e.message, 500); }
});

// Card-number lookup — cards are guessable/enumerable, so this needs the same
// gate as /members, not just "logged in".
router.get('/members/by-card/:cardNo', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { cardNo } = req.params;
    const m = await queryOne(`
      SELECT m.*, u.first_name, u.last_name, u.email, u.phone,
        s.admission_number,
        c.name as class_name, sec.name as section_name,
        (SELECT COUNT(*) FROM client_book_issues WHERE member_id=m.id AND status IN ('issued','overdue')) active_issues
      FROM client_library_members m
      JOIN client_users u ON u.id=m.user_id
      LEFT JOIN client_students s ON s.user_id=u.id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      WHERE m.card_no=? AND m.org_id=?`, [cardNo, orgId]);
    if (!m) return error(res, 'Card not found', 404);
    
    const issues = await query(`
      SELECT bi.*, b.title, b.author
      FROM client_book_issues bi
      JOIN client_library_books b ON b.id=bi.book_id
      WHERE bi.member_id=? AND bi.status IN ('issued','overdue')
      ORDER BY bi.issue_date DESC`, [m.id]);
    
    return success(res, { member: m, active_issues: issues });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ ISSUE / RETURN ═══
router.post('/issue', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const issuerId = req.user.user_id;
    const { book_id, member_id, days=14, fine_per_day=2 } = req.body;
    if (!book_id || !member_id) return error(res, 'book_id, member_id required', 400);
    // MONEY GUARD: fine_per_day is a rupee rate written to DECIMAL — validate it.
    const finePerDay = parseMoney(fine_per_day, { allowZero: true });
    if (finePerDay === null) return error(res, moneyError('Fine per day', { allowZero: true }), 400);

    // Check member & limits (no shared row to race on, safe outside the lock)
    const member = await queryOne(`
      SELECT m.*, (SELECT COUNT(*) FROM client_book_issues WHERE member_id=m.id AND status IN ('issued','overdue')) active_count
      FROM client_library_members m WHERE m.id=? AND m.org_id=?`, [member_id, orgId]);
    if (!member) return error(res, 'Member not found', 404);
    if (member.status !== 'active') return error(res, 'Member is inactive', 400);
    if (member.active_count >= member.max_books) return error(res, `Book limit reached (max ${member.max_books})`, 400);

    const issue_date = new Date().toISOString().split('T')[0];
    const due_date = new Date(Date.now() + days*86400000).toISOString().split('T')[0];

    // RACE GUARD: two staff issuing the last copy at once could both pass an
    // unlocked availability check. Lock the book row for the check+decrement+
    // insert so the second request re-reads the post-commit copy count.
    const r = await transaction(async (conn) => {
      const [[book]] = await conn.execute(
        'SELECT copies_available FROM client_library_books WHERE id=? AND org_id=? FOR UPDATE',
        [book_id, orgId]);
      if (!book) throw Object.assign(new Error('Book not found'), { status: 404 });
      if (book.copies_available < 1) throw Object.assign(new Error('Book not available'), { status: 400 });

      const [ins] = await conn.execute(
        `INSERT INTO client_book_issues (org_id, book_id, member_id, issue_date, due_date, fine_per_day, issued_by, status)
         VALUES (?,?,?,?,?,?,?,?)`,
        [orgId, book_id, member_id, issue_date, due_date, finePerDay, issuerId, 'issued']);

      await conn.execute('UPDATE client_library_books SET copies_available=copies_available-1 WHERE id=?', [book_id]);
      return ins;
    }).catch(e => { if (e.status) throw e; throw Object.assign(e, { status: 500 }); });

    const issue = await queryOne(`
      SELECT bi.*, b.title, b.author, u.first_name, u.last_name, m.card_no
      FROM client_book_issues bi
      JOIN client_library_books b ON b.id=bi.book_id
      JOIN client_library_members m ON m.id=bi.member_id
      JOIN client_users u ON u.id=m.user_id
      WHERE bi.id=?`, [r.insertId]);
    
    return success(res, { issue }, 'Book issued', 201);
  } catch (e) { return error(res, e.message, e.status || 500); }
});

router.post('/return/:issueId', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const returnerId = req.user.user_id;
    const { issueId } = req.params;
    const { fine_paid=0, notes } = req.body;
    
    const issue = await queryOne('SELECT * FROM client_book_issues WHERE id=? AND org_id=?', [issueId, orgId]);
    if (!issue) return error(res, 'Issue not found', 404);
    if (issue.status === 'returned') return error(res, 'Already returned', 400);
    
    const today = new Date();
    const due = new Date(issue.due_date);
    const daysOverdue = Math.max(0, Math.ceil((today.getTime() - due.getTime()) / 86400000));
    const fine_amount = Math.round(daysOverdue * (parseMoney(issue.fine_per_day, { allowZero: true }) || 0) * 100) / 100;

    // MONEY GUARD: fine_paid is user-supplied. Reject junk/negative/absurd, and
    // never let a clerk record more collected than the fine actually owed
    // (there is no advance/credit concept anywhere in this product).
    const finePaid = parseMoney(fine_paid, { allowZero: true });
    if (finePaid === null) return error(res, moneyError('Fine paid', { allowZero: true }), 400);
    if (finePaid > fine_amount + 0.01) {
      return error(res, `Fine paid \u20b9${finePaid.toFixed(2)} exceeds the fine due of \u20b9${fine_amount.toFixed(2)}`, 400);
    }

    await query(
      `UPDATE client_book_issues SET return_date=CURDATE(), status='returned', fine_amount=?, fine_paid=?, returned_by=?, notes=COALESCE(?,notes) WHERE id=?`,
      [fine_amount, finePaid, returnerId, notes||null, issueId]);
    
    await query('UPDATE client_library_books SET copies_available=copies_available+1 WHERE id=?', [issue.book_id]);
    
    return success(res, { fine_amount, days_overdue: daysOverdue }, 'Book returned');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ OVERDUE / ACTIVE ISSUES ═══
// Borrower name/phone on every issued/overdue book — librarian/staff only.
router.get('/issues', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { status='issued,overdue', search='' } = req.query;
    const statuses = status.split(',').map(s => s.trim());
    const placeholders = statuses.map(() => '?').join(',');
    
    let where = `WHERE bi.org_id=? AND bi.status IN (${placeholders})`;
    const params = [orgId, ...statuses];
    if (search) {
      const ns = buildNameSearch(search, 'u', ['b.title', 'm.card_no']);
      if (ns.clause) { where += ` AND ${ns.clause}`; params.push(...ns.values); }
    }
    
    const issues = await query(`
      SELECT bi.*, b.title, b.author, m.card_no, u.first_name, u.last_name, u.phone,
        DATEDIFF(CURDATE(), bi.due_date) as days_overdue
      FROM client_book_issues bi
      JOIN client_library_books b ON b.id=bi.book_id
      JOIN client_library_members m ON m.id=bi.member_id
      JOIN client_users u ON u.id=m.user_id
      ${where}
      ORDER BY bi.due_date ASC`, params);
    
    return success(res, { issues });
  } catch (e) { return error(res, e.message, 500); }
});

// Auto-mark overdue status
router.post('/mark-overdue', requirePermission('library.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const r = await query(
      `UPDATE client_book_issues SET status='overdue' WHERE org_id=? AND status='issued' AND due_date < CURDATE()`,
      [orgId]);
    return success(res, { marked: r.affectedRows }, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
