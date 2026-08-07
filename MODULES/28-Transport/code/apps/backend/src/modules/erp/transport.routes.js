const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/db');
const { success, error }  = require('../../utils/response');
const { authenticate }    = require('../../middleware/auth');
const { requireModule }   = require('../../middleware/moduleGate');
const { requirePermission, userCan } = require('../../middleware/rbac');
const { audit } = require('../../utils/audit');
const { parseMoney, moneyError } = require('../../utils/money');
const { buildNameSearch } = require('../../utils/sqlBuild');
// ONE definition of "this student_id is a child who is still here" — see
// utils/headcount.js. A bus seat held by a removed child is not a seat.
const { activeStudent } = require('../../utils/headcount');

router.use(authenticate);

// PLAN LOCK: hiding the menu item never stopped the URL. This module answers
// only if the org's plan (or an add-on grant) includes it. Dormant unless the
// org has `platform.plan_gating` on; fails OPEN. See middleware/moduleGate.js.
router.use(requireModule('transport'));

/*
 * WHO MAY READ THE TRANSPORT CONSOLE.
 *
 * Every write here has always required `transport.manage`. The READS did not —
 * they were mounted behind `authenticate` alone, which in a school means every
 * student and every parent in the org. `/staff` is the one that matters: it
 * selects `s.*`, so it returned each driver's phone, licence number, licence
 * expiry and home address, plus the email of their login. `/vehicles`,
 * `/routes`, `/routes/:id` and `/stats` handed over the whole fleet and route
 * plan on the same terms.
 *
 * None of these are read by a parent or student screen — the parent view calls
 * only /my-children and /my-bus, both of which scope to the caller's own
 * children. So the console reads take the same permission their writes always
 * had. Nothing a family can see changes.
 */
const canManage = requirePermission('transport.manage');

// ═══ STATS / DASHBOARD ═══
router.get('/stats', canManage, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const today = new Date().toISOString().split('T')[0];
    const alertDate = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM client_transport_vehicles WHERE org_id=? AND status='active') vehicles_active,
        (SELECT COUNT(*) FROM client_transport_vehicles WHERE org_id=?) vehicles_total,
        (SELECT COUNT(*) FROM client_transport_routes WHERE org_id=? AND status='active') routes_active,
        -- Seats held by children who have left are not seats (WW-128).
        (SELECT COUNT(*) FROM client_student_transport st
          WHERE st.org_id=? AND st.status='active' AND ${activeStudent('st.student_id')}) students_assigned,
        -- "Drivers + helpers" has TWO sources and this card used to count one.
        -- A driver can be a client_transport_staff record, or (legacy, and still
        -- the common case in schools that never filled in the driver list) just
        -- a user attached to a route as its driver. Counting only the first made
        -- the card read 0 while three routes each named a driver, every one of
        -- them tagged "(not in your driver list)" — WW-94.
        -- Same union as /assignable-drivers, which is the list this number is
        -- read against; if the two ever disagree again they are wrong together.
        (SELECT COUNT(*) FROM (
           SELECT s.user_id AS uid, s.id AS sid
             FROM client_transport_staff s
            WHERE s.org_id=? AND s.status='active'
           UNION
           SELECT r.driver_user_id AS uid, NULL AS sid
             FROM client_transport_routes r
             JOIN client_users u ON u.id=r.driver_user_id AND u.org_id=r.org_id AND u.is_active=1
            WHERE r.org_id=? AND r.driver_user_id IS NOT NULL
              AND r.driver_user_id NOT IN (
                SELECT s2.user_id FROM client_transport_staff s2
                 WHERE s2.org_id=? AND s2.user_id IS NOT NULL AND s2.status='active')
         ) crew) staff_active,
        (SELECT COUNT(*) FROM client_transport_vehicles 
         WHERE org_id=? AND status='active' 
         AND (insurance_expiry<=? OR fitness_expiry<=? OR permit_expiry<=?)) expiry_alerts
    `,
    // 8 org bindings now, not 6: vehicles_active, vehicles_total, routes_active,
    // students_assigned, three inside the staff UNION, then expiry_alerts.
    [orgId, orgId, orgId, orgId, orgId, orgId, orgId, orgId, alertDate, alertDate, alertDate]);

    return success(res, stats);
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ PARENT: my children's transport (strictly scoped to the caller) ═══
router.get('/my-children', async (req, res) => {
  try {
    const o = req.user.org_id;
    const uid = req.user.user_id;
    const parent = await queryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, o]);
    if (!parent) return success(res, { children: [] });

    const children = await query(`
      SELECT ps.student_id, s.admission_number, u.first_name, u.last_name,
        st.status AS transport_status, st.stop_id,
        r.id AS route_id, r.name AS route_name, r.start_point, r.end_point, r.monthly_fee,
        v.reg_no AS vehicle_reg_no, v.name AS vehicle_name, v.type AS vehicle_type,
        d.name AS driver_name, d.phone AS driver_phone,
        h.name AS helper_name, h.phone AS helper_phone,
        myst.stop_name AS my_stop_name, myst.sequence_no AS my_stop_seq
      FROM client_parent_students ps
      JOIN client_students s ON s.id=ps.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_student_transport st ON st.student_id=ps.student_id AND st.status='active'
      LEFT JOIN client_transport_routes r ON r.id=st.route_id
      LEFT JOIN client_transport_vehicles v ON v.id=COALESCE(st.vehicle_id, r.vehicle_id)
      LEFT JOIN client_transport_staff d ON d.id=v.driver_id
      LEFT JOIN client_transport_staff h ON h.id=v.helper_id
      LEFT JOIN client_transport_stops myst ON myst.id=st.stop_id
      WHERE ps.parent_id=? AND ps.org_id=?
      ORDER BY u.first_name`, [parent.id, o]);

    for (const child of children) {
      child.assigned = !!child.route_id;
      child.stops = child.route_id
        ? await query('SELECT stop_name, sequence_no FROM client_transport_stops WHERE route_id=? ORDER BY sequence_no, id', [child.route_id])
        : [];
    }
    return success(res, { children });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ VEHICLES ═══
router.get('/vehicles', canManage, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT v.*,
        d.name  AS driver_name,  d.phone AS driver_phone,
        h.name  AS helper_name,  h.phone AS helper_phone,
        (SELECT r.name FROM client_transport_routes r WHERE r.vehicle_id=v.id AND r.status='active' LIMIT 1) AS route_name,
        (SELECT COUNT(*) FROM client_student_transport st WHERE st.vehicle_id=v.id AND st.status='active') AS student_count
      FROM client_transport_vehicles v
      LEFT JOIN client_transport_staff d ON d.id=v.driver_id
      LEFT JOIN client_transport_staff h ON h.id=v.helper_id
      WHERE v.org_id=?
      ORDER BY v.status='active' DESC, v.reg_no`, [orgId]);
    return success(res, { vehicles: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/vehicles', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { reg_no, name, type='bus', capacity=30, driver_id, helper_id, insurance_expiry, fitness_expiry, permit_expiry, purchase_date, notes } = req.body;
    if (!reg_no) return error(res, 'reg_no required', 400);
    const exists = await queryOne('SELECT id FROM client_transport_vehicles WHERE org_id=? AND reg_no=?', [orgId, reg_no]);
    if (exists) return error(res, 'Vehicle with this registration already exists', 409);
    const r = await query(
      `INSERT INTO client_transport_vehicles (org_id, reg_no, name, type, capacity, driver_id, helper_id, insurance_expiry, fitness_expiry, permit_expiry, purchase_date, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orgId, reg_no, name||null, type, capacity, driver_id||null, helper_id||null, insurance_expiry||null, fitness_expiry||null, permit_expiry||null, purchase_date||null, notes||null, 'active']);
    return success(res, { id: r.insertId }, 'Vehicle added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/vehicles/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const v = await queryOne('SELECT * FROM client_transport_vehicles WHERE id=? AND org_id=?', [id, orgId]);
    if (!v) return error(res, 'Not found', 404);
    const { reg_no, name, type, capacity, driver_id, helper_id, insurance_expiry, fitness_expiry, permit_expiry, purchase_date, notes, status } = req.body;
    await query(
      `UPDATE client_transport_vehicles SET
        reg_no=COALESCE(?,reg_no), name=?, type=COALESCE(?,type), capacity=COALESCE(?,capacity),
        driver_id=?, helper_id=?, insurance_expiry=?, fitness_expiry=?, permit_expiry=?,
        purchase_date=?, notes=?, status=COALESCE(?,status)
       WHERE id=?`,
      [reg_no||null, name||null, type||null, capacity||null, driver_id||null, helper_id||null,
       insurance_expiry||null, fitness_expiry||null, permit_expiry||null, purchase_date||null, notes||null, status||null, id]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/vehicles/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const students = await queryOne('SELECT COUNT(*) cnt FROM client_student_transport WHERE vehicle_id=? AND status=?', [id, 'active']);
    if (students.cnt > 0) {
      await query('UPDATE client_transport_vehicles SET status=? WHERE id=? AND org_id=?', ['retired', id, orgId]);
      return success(res, {}, 'Vehicle retired (has active students)');
    }
    await query('DELETE FROM client_transport_vehicles WHERE id=? AND org_id=?', [id, orgId]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ ROUTES ═══
router.get('/routes', canManage, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT r.*, v.reg_no AS vehicle_reg_no, v.name AS vehicle_name,
        (SELECT COUNT(*) FROM client_transport_stops WHERE route_id=r.id) stop_count,
        -- Same archive check as the seat list and the stats card, so a route
        -- cannot advertise passengers its own manifest will not show (WW-128).
        (SELECT COUNT(*) FROM client_student_transport st
          WHERE st.route_id=r.id AND st.status='active' AND ${activeStudent('st.student_id')}) student_count
      FROM client_transport_routes r
      LEFT JOIN client_transport_vehicles v ON v.id=r.vehicle_id
      WHERE r.org_id=?
      ORDER BY r.status='active' DESC, r.name`, [orgId]);
    return success(res, { routes: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.get('/routes/:id', canManage, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const route = await queryOne(`
      SELECT r.*, v.reg_no AS vehicle_reg_no, v.name AS vehicle_name,
        d.name AS driver_name, d.phone AS driver_phone
      FROM client_transport_routes r
      LEFT JOIN client_transport_vehicles v ON v.id=r.vehicle_id
      LEFT JOIN client_transport_staff d ON d.id=v.driver_id
      WHERE r.id=? AND r.org_id=?`, [id, orgId]);
    if (!route) return error(res, 'Not found', 404);
    const stops = await query('SELECT * FROM client_transport_stops WHERE route_id=? ORDER BY sequence_no, id', [id]);
    const students = await query(`
      SELECT st.*, s.admission_number, u.first_name, u.last_name,
        stp.stop_name, c.name AS class_name, sec.name AS section_name
      FROM client_student_transport st
      JOIN client_students s ON s.id=st.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_transport_stops stp ON stp.id=st.stop_id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      WHERE st.route_id=? AND st.status='active' AND u.is_active=1
      ORDER BY stp.sequence_no, u.first_name`, [id]);
    return success(res, { route, stops, students });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/routes', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, start_point, end_point, distance_km, monthly_fee=0, vehicle_id, stops=[] } = req.body;
    if (!name) return error(res, 'name required', 400);
    // MONEY GUARD: monthly_fee is written to a DECIMAL column.
    const fee = parseMoney(monthly_fee, { allowZero: true });
    if (fee === null) return error(res, moneyError('Monthly fee', { allowZero: true }), 400);
    const r = await query(
      `INSERT INTO client_transport_routes (org_id, name, start_point, end_point, distance_km, monthly_fee, vehicle_id, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [orgId, name, start_point||null, end_point||null, distance_km||null, fee, vehicle_id||null, 'active']);
    if (stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        await query(
          'INSERT INTO client_transport_stops (org_id, route_id, stop_name, pickup_time, drop_time, sequence_no, lat, lng) VALUES (?,?,?,?,?,?,?,?)',
          [orgId, r.insertId, s.stop_name, s.pickup_time||null, s.drop_time||null, i+1, s.lat||null, s.lng||null]);
      }
    }
    return success(res, { id: r.insertId }, 'Route created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/routes/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const r = await queryOne('SELECT * FROM client_transport_routes WHERE id=? AND org_id=?', [id, orgId]);
    if (!r) return error(res, 'Not found', 404);
    const { name, start_point, end_point, distance_km, monthly_fee, vehicle_id, status, stops } = req.body;
    let fee = null;
    if (monthly_fee !== undefined && monthly_fee !== null && monthly_fee !== '') {
      fee = parseMoney(monthly_fee, { allowZero: true });
      if (fee === null) return error(res, moneyError('Monthly fee', { allowZero: true }), 400);
    }
    await query(
      `UPDATE client_transport_routes SET name=COALESCE(?,name), start_point=?, end_point=?, distance_km=?, monthly_fee=COALESCE(?,monthly_fee), vehicle_id=?, status=COALESCE(?,status) WHERE id=?`,
      [name||null, start_point||null, end_point||null, distance_km||null, fee, vehicle_id||null, status||null, id]);
    if (Array.isArray(stops)) {
      await query('DELETE FROM client_transport_stops WHERE route_id=?', [id]);
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        if (!s.stop_name) continue;
        await query(
          'INSERT INTO client_transport_stops (org_id, route_id, stop_name, pickup_time, drop_time, sequence_no, lat, lng) VALUES (?,?,?,?,?,?,?,?)',
          [orgId, id, s.stop_name, s.pickup_time||null, s.drop_time||null, i+1, s.lat||null, s.lng||null]);
      }
    }
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/routes/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const count = await queryOne('SELECT COUNT(*) cnt FROM client_student_transport WHERE route_id=? AND status=?', [id, 'active']);
    if (count.cnt > 0) {
      await query('UPDATE client_transport_routes SET status=? WHERE id=? AND org_id=?', ['inactive', id, orgId]);
      return success(res, {}, 'Route deactivated');
    }
    await query('DELETE FROM client_transport_stops WHERE route_id=?', [id]);
    await query('DELETE FROM client_transport_routes WHERE id=? AND org_id=?', [id, orgId]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ STAFF ═══
router.get('/staff', canManage, async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT s.*,
        (SELECT v.reg_no FROM client_transport_vehicles v WHERE v.driver_id=s.id OR v.helper_id=s.id LIMIT 1) AS assigned_vehicle,
        -- WW-32: the login attached to this driver, if any. NULL means "no app
        -- login yet", which is why they cannot be picked to drive a route.
        TRIM(CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) AS login_name,
        u.email AS login_email
      FROM client_transport_staff s
      LEFT JOIN client_users u ON u.id = s.user_id AND u.org_id = s.org_id
      WHERE s.org_id=?
      ORDER BY s.role, s.status='active' DESC, s.name`, [orgId]);
    return success(res, { staff: rows });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * A driver's optional app login (WW-32). Must be a real user of THIS school and
 * must not be a student or a parent — a login that can be set as a route driver
 * is a login that can broadcast a bus's live position.
 * Returns { ok, value } so callers keep the 400 rather than a silent null.
 */
async function resolveStaffLogin(orgId, userId) {
  if (userId === undefined) return { ok: true, value: undefined };   // field not sent → leave as is
  if (userId === null || userId === '') return { ok: true, value: null };
  const u = await queryOne(
    `SELECT u.id FROM client_users u
      WHERE u.id=? AND u.org_id=? AND u.is_active=1
        AND u.id NOT IN (SELECT user_id FROM client_students WHERE org_id=?)
        AND u.id NOT IN (SELECT user_id FROM client_parents WHERE org_id=? AND user_id IS NOT NULL)`,
    [userId, orgId, orgId, orgId]);
  if (!u) return { ok: false, message: 'That login is not a staff account in this school' };
  return { ok: true, value: u.id };
}

router.post('/staff', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { name, role='driver', phone, license_no, license_expiry, address, user_id } = req.body;
    if (!name) return error(res, 'name required', 400);
    const login = await resolveStaffLogin(orgId, user_id);
    if (!login.ok) return error(res, login.message, 400);
    const r = await query(
      `INSERT INTO client_transport_staff (org_id, user_id, name, role, phone, license_no, license_expiry, address, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [orgId, login.value ?? null, name, role, phone||null, license_no||null, license_expiry||null, address||null, 'active']);
    return success(res, { id: r.insertId }, 'Staff added', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/staff/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { name, role, phone, license_no, license_expiry, address, status, user_id } = req.body;
    const s = await queryOne('SELECT * FROM client_transport_staff WHERE id=? AND org_id=?', [id, orgId]);
    if (!s) return error(res, 'Not found', 404);
    const login = await resolveStaffLogin(orgId, user_id);
    if (!login.ok) return error(res, login.message, 400);
    await query(
      `UPDATE client_transport_staff SET name=COALESCE(?,name), role=COALESCE(?,role), phone=?, license_no=?, license_expiry=?, address=?, status=COALESCE(?,status),
              user_id=? WHERE id=?`,
      [name||null, role||null, phone||null, license_no||null, license_expiry||null, address||null, status||null,
       // undefined = the caller did not touch the link; null = they cleared it.
       login.value === undefined ? s.user_id : login.value, id]);
    return success(res, {}, 'Updated');
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/staff/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const v = await queryOne('SELECT id FROM client_transport_vehicles WHERE (driver_id=? OR helper_id=?) LIMIT 1', [id, id]);
    if (v) {
      await query('UPDATE client_transport_staff SET status=? WHERE id=? AND org_id=?', ['inactive', id, orgId]);
      return success(res, {}, 'Staff deactivated (assigned to vehicle)');
    }
    await query('DELETE FROM client_transport_staff WHERE id=? AND org_id=?', [id, orgId]);
    return success(res, {}, 'Deleted');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ STUDENT ASSIGNMENTS ═══
// Student name/phone on every transport assignment — staff only. Parents/
// students use /my-children, /my-bus and /trips/mine for their own data.
router.get('/assignments', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { route_id, status='active', search } = req.query;
    // Archived children do not ride the bus. Without this the seat list carried
    // four names from an old cohort that the school could not find anywhere in
    // People › Students (WW-128) — and a manifest naming a child who is not
    // coming is worse than a short one, because the driver waits for them.
    let where = 'WHERE st.org_id=? AND u.is_active=1';
    const params = [orgId];
    if (status) { where += ' AND st.status=?'; params.push(status); }
    if (route_id) { where += ' AND st.route_id=?'; params.push(route_id); }
    if (search) {
      const ns = buildNameSearch(search, 'u', ['s.admission_number']);
      if (ns.clause) { where += ` AND ${ns.clause}`; params.push(...ns.values); }
    }
    const rows = await query(`
      SELECT st.*, s.admission_number, u.first_name, u.last_name, u.phone,
        r.name AS route_name, stp.stop_name, stp.pickup_time, stp.drop_time,
        v.reg_no AS vehicle_reg_no,
        c.name AS class_name, sec.name AS section_name
      FROM client_student_transport st
      JOIN client_students s ON s.id=st.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_transport_routes r ON r.id=st.route_id
      LEFT JOIN client_transport_stops stp ON stp.id=st.stop_id
      LEFT JOIN client_transport_vehicles v ON v.id=st.vehicle_id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      ${where}
      ORDER BY r.name, stp.sequence_no, u.first_name`, params);
    return success(res, { assignments: rows });
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/assignments', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { student_id, route_id, stop_id, fee_amount, start_date } = req.body;
    if (!student_id || !route_id || !stop_id) return error(res, 'student_id, route_id, stop_id required', 400);

    // TENANT GUARD: the student, route and stop MUST belong to the caller's org.
    // Without this, a transport.manage user could pass a foreign student_id and
    // discontinue another org's assignment / stamp a foreign student into ours.
    const stu = await queryOne('SELECT id FROM client_students WHERE id=? AND org_id=?', [student_id, orgId]);
    if (!stu) return error(res, 'Student not found', 404);
    const route = await queryOne('SELECT vehicle_id, monthly_fee FROM client_transport_routes WHERE id=? AND org_id=?', [route_id, orgId]);
    if (!route) return error(res, 'Route not found', 404);
    const stop = await queryOne('SELECT id FROM client_transport_stops WHERE id=? AND org_id=?', [stop_id, orgId]);
    if (!stop) return error(res, 'Stop not found', 404);

    // Discontinue existing active assignment (org-scoped)
    await query('UPDATE client_student_transport SET status=? WHERE student_id=? AND org_id=? AND status=?', ['discontinued', student_id, orgId, 'active']);

    // MONEY GUARD: an explicit fee_amount override is user input.
    const fee = parseMoney(fee_amount !== undefined && fee_amount !== null && fee_amount !== ''
      ? fee_amount : (route?.monthly_fee || 0), { allowZero: true });
    if (fee === null) return error(res, moneyError('Transport fee', { allowZero: true }), 400);

    const r = await query(
      `INSERT INTO client_student_transport (org_id, student_id, route_id, stop_id, vehicle_id, fee_amount, start_date, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [orgId, student_id, route_id, stop_id, route?.vehicle_id || null, fee, start_date || new Date().toISOString().split('T')[0], 'active']);
    return success(res, { id: r.insertId }, 'Assignment created', 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/assignments/:id', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    await query('UPDATE client_student_transport SET status=?, end_date=CURDATE() WHERE id=? AND org_id=?', ['discontinued', id, orgId]);
    return success(res, {}, 'Discontinued');
  } catch (e) { return error(res, e.message, 500); }
});

// ═══ UNASSIGNED STUDENTS ═══
// Names/emails of every unassigned student org-wide — staff only.
router.get('/unassigned-students', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { search='' } = req.query;
    let where = 'WHERE s.org_id=? AND u.is_active=1 AND s.id NOT IN (SELECT student_id FROM client_student_transport WHERE status=?)';
    const params = [orgId, 'active'];
    if (search) {
      const ns = buildNameSearch(search, 'u', ['s.admission_number']);
      if (ns.clause) { where += ` AND ${ns.clause}`; params.push(...ns.values); }
    }
    const rows = await query(`
      SELECT s.id, u.first_name, u.last_name, u.email, s.admission_number,
        c.name class_name, sec.name section_name
      FROM client_students s
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      ${where}
      ORDER BY u.first_name LIMIT 30`, params);
    return success(res, { students: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════
// LIVE BUS TRACKING — SUG-0077 (docs/CLIENT_ASKS_PLAN.md)
// The driver's phone is the GPS. Driver "Start Trip" → browser geolocation
// streams here → admin map + parent/student ETA. No hardware, no vendor.
// Driver actions are NOT permission-gated (a driver is a custom-role login who
// would fail transport.manage) — each user can only affect their OWN trip.
// ═══════════════════════════════════════════════════════════════════════════

// straight-line distance in metres (good enough for stop-proximity + ETA)
function haversineM(aLat, aLng, bLat, bLng) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
const STALE_MS = 90 * 1000; // no ping in 90s → treat bus as offline/parked

// Only a DESIGNATED driver (assigned to ≥1 route) or an admin may broadcast a
// bus location — so a random student/parent/teacher can't turn their phone into
// a "bus" (privacy + anti-abuse). Substitutes: admin assigns them to the route.
async function canStartTrip(orgId, uid) {
  const r = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM client_transport_routes WHERE org_id=? AND driver_user_id=?) AS is_driver,
      (SELECT COUNT(*) FROM client_user_roles ur JOIN client_roles ro ON ro.id=ur.role_id
        WHERE ur.user_id=? AND ur.org_id=? AND ro.base_role IN ('owner','admin','principal')) AS is_admin
  `, [orgId, uid, uid, orgId]);
  return (r.is_driver > 0) || (r.is_admin > 0);
}

// Privacy hygiene: a trip whose driver closed the app (no ping for 45 min, or
// started but never shared location for 15 min) is auto-ended so a parked bus
// never keeps "broadcasting". Cheap, lazy — called on read/start (no cron).
async function endStaleTrips(orgId) {
  await query(`
    UPDATE client_transport_trips SET status='ended', ended_at=NOW()
     WHERE org_id=? AND status='active'
       AND ( (last_ping_at IS NOT NULL AND last_ping_at < (NOW() - INTERVAL 45 MINUTE))
          OR (last_ping_at IS NULL AND started_at < (NOW() - INTERVAL 15 MINUTE)) )`, [orgId]);
}

/*
 * Routes the caller may run. Serves two screens with one answer:
 *   • the office (transport.manage) picking who drives what — needs every route
 *   • a driver's own bus screen — needs THEIR routes and nothing else
 *
 * It used to return every active route in the school to anyone signed in, and
 * the driver screen then pre-selected `routes.find(mine) || routes[0]`. For a
 * driver with no route of their own that `[0]` was somebody else's bus, shown
 * as "YOUR BUS", named and registration-plated. Scoping the query removes the
 * fallback's raw material: an unassigned driver now gets an empty list and the
 * screen's honest "ask the office to assign you to a route".
 *
 * `can_start` still says whether this person may broadcast at all.
 */
router.get('/drivable-routes', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    const manages = await userCan(uid, 'transport.manage', orgId);
    const rows = await query(`
      SELECT r.id, r.name, r.start_point, r.end_point,
        v.reg_no AS vehicle_reg_no, v.name AS vehicle_name, r.vehicle_id, r.driver_user_id,
        (r.driver_user_id = ?) AS mine, (r.path_json IS NOT NULL) AS has_path,
        (SELECT COUNT(*) FROM client_transport_stops WHERE route_id=r.id) stop_count
      FROM client_transport_routes r
      LEFT JOIN client_transport_vehicles v ON v.id=r.vehicle_id
      WHERE r.org_id=? AND r.status='active' ${manages ? '' : 'AND r.driver_user_id = ?'}
      ORDER BY (r.driver_user_id = ?) DESC, r.name`,
      manages ? [uid, orgId, uid] : [uid, orgId, uid, uid]);
    const can_start = await canStartTrip(orgId, uid);
    return success(res, { routes: rows, can_start });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * WW-32 — "for the bus driver selection list it should not be the existing users
 * list it should be the list of drivers added by authorities".
 *
 * It used to be exactly that: every active user in the school who was not a
 * student or a parent. Every teacher, the accountant and the principal were
 * offered as bus drivers, because nothing connected a school's driver records
 * (client_transport_staff — the people they add under Transport → Staff, with
 * licence number and expiry) to the LOGIN that a live-tracking driver needs.
 * Migration 035 adds that link; this is the list it makes possible.
 *
 * Returned:
 *   • the school's own active drivers that have a linked login, and
 *   • anyone ALREADY set as a route's driver — deliberately, so deploying this
 *     narrower list can never orphan a school's working live-bus setup. Those
 *     rows are flagged `legacy` so the UI can say where they came from.
 *
 * The broad "any staff login" list still exists at /staff-logins, where it
 * belongs: the one place an admin links a driver record to an account.
 */
router.get('/assignable-drivers', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
             s.name AS driver_name, s.license_no, 0 AS legacy
        FROM client_transport_staff s
        JOIN client_users u ON u.id = s.user_id AND u.org_id = s.org_id AND u.is_active = 1
       WHERE s.org_id = ? AND s.role = 'driver' AND s.status = 'active'
      UNION
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
             NULL, NULL, 1 AS legacy
        FROM client_transport_routes r
        JOIN client_users u ON u.id = r.driver_user_id AND u.org_id = r.org_id
       WHERE r.org_id = ? AND r.driver_user_id IS NOT NULL
         AND u.id NOT IN (
           SELECT s2.user_id FROM client_transport_staff s2
            WHERE s2.org_id = ? AND s2.user_id IS NOT NULL
              AND s2.role = 'driver' AND s2.status = 'active')
      ORDER BY legacy, first_name, last_name`, [orgId, orgId, orgId]);
    return success(res, { drivers: rows });
  } catch (e) { return error(res, e.message, 500); }
});

/*
 * Candidate LOGINS an admin can attach to a driver record (Transport → Staff →
 * "App login"). Staff only — never a student or a parent, who must not be able
 * to broadcast a bus position. This is the old /assignable-drivers query, kept
 * for the one screen where "any staff account" is the right question to ask.
 */
router.get('/staff-logins', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const rows = await query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, r.name AS role
      FROM client_users u
      LEFT JOIN client_user_roles ur ON ur.user_id=u.id AND ur.org_id=u.org_id
      LEFT JOIN client_roles r ON r.id=ur.role_id
      WHERE u.org_id=? AND u.is_active=1
        AND u.id NOT IN (SELECT user_id FROM client_students WHERE org_id=?)
        AND u.id NOT IN (SELECT user_id FROM client_parents WHERE org_id=? AND user_id IS NOT NULL)
      GROUP BY u.id
      ORDER BY u.first_name, u.last_name`, [orgId, orgId, orgId]);
    return success(res, { users: rows });
  } catch (e) { return error(res, e.message, 500); }
});

// Assign / clear a route's app-driver (existing login user)
router.put('/routes/:id/driver', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const { id } = req.params;
    const { driver_user_id } = req.body;
    const route = await queryOne('SELECT id FROM client_transport_routes WHERE id=? AND org_id=?', [id, orgId]);
    if (!route) return error(res, 'Route not found', 404);
    let uid = null;
    if (driver_user_id) {
      const u = await queryOne('SELECT id FROM client_users WHERE id=? AND org_id=?', [driver_user_id, orgId]);
      if (!u) return error(res, 'Driver user not found in this school', 404);
      uid = u.id;
    }
    const before = await queryOne('SELECT driver_user_id FROM client_transport_routes WHERE id=? AND org_id=?', [id, orgId]);
    await query('UPDATE client_transport_routes SET driver_user_id=? WHERE id=? AND org_id=?', [uid, id, orgId]);
    // Putting someone on a route grants them the right to broadcast a live
    // location to that route's parents. Nothing in this module was audited at
    // all, so "who gave this person the bus, and when" had no answer.
    await audit(req, uid ? 'TRANSPORT_DRIVER_ASSIGN' : 'TRANSPORT_DRIVER_CLEAR', 'transport_route', Number(id), {
      old_data: { driver_user_id: before?.driver_user_id ?? null },
      new_data: { driver_user_id: uid },
    });
    return success(res, {}, uid ? 'Driver assigned' : 'Driver cleared');
  } catch (e) { return error(res, e.message, 500); }
});

// ── Auto-route (drive-to-map, SUG-0081) ────────────────────────────────────
function safeParse(json) { try { return json ? JSON.parse(json) : null; } catch { return null; } }
function metres(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
// keep at most maxPoints, preserving shape (even sampling + endpoints)
function simplifyTrail(points, maxPoints = 300) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const out = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}
// a dwell (bus within ~35m for >=25s) = an auto-detected stop
function detectStops(points) {
  const stops = [];
  let i = 0;
  while (i < points.length) {
    let j = i + 1;
    while (j < points.length && metres(points[i], points[j]) < 35) j++;
    const last = Math.min(j, points.length - 1);
    if (((points[last].t || 0) - (points[i].t || 0)) >= 25000) {
      let lat = 0, lng = 0, n = 0;
      for (let k = i; k < j; k++) { lat += points[k].lat; lng += points[k].lng; n++; }
      stops.push({ lat: +(lat / n).toFixed(7), lng: +(lng / n).toFixed(7) });
      i = j;
    } else i++;
  }
  return stops;
}

// Save a driven trail as the route's road-path (+ seed stops if none yet).
router.post('/routes/:id/record-path', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    if (!(await canStartTrip(orgId, uid)))
      return error(res, 'Only a driver or admin can record a route.', 403);
    const { id } = req.params;
    const route = await queryOne('SELECT id FROM client_transport_routes WHERE id=? AND org_id=?', [id, orgId]);
    if (!route) return error(res, 'Route not found', 404);

    let pts = Array.isArray(req.body.points) ? req.body.points : [];
    pts = pts.map((p) => ({ lat: +p.lat, lng: +p.lng, t: +p.t || 0 }))
             .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
    if (pts.length < 3) return error(res, 'Not enough of the drive was recorded to map this route.', 400);

    const simplified = simplifyTrail(pts);
    await query('UPDATE client_transport_routes SET path_json=? WHERE id=? AND org_id=?',
      [JSON.stringify(simplified.map((p) => [p.lat, p.lng])), id, orgId]);

    // seed stops from dwell points only if the route has none (never clobber named stops)
    let stops_created = 0;
    const existing = await queryOne('SELECT COUNT(*) cnt FROM client_transport_stops WHERE route_id=?', [id]);
    if (!existing.cnt) {
      const detected = detectStops(pts);
      for (let k = 0; k < detected.length; k++) {
        const isLast = k === detected.length - 1;
        await query('INSERT INTO client_transport_stops (org_id, route_id, stop_name, sequence_no, lat, lng) VALUES (?,?,?,?,?,?)',
          [orgId, id, isLast ? 'School' : `Stop ${k + 1}`, k + 1, detected[k].lat, detected[k].lng]);
      }
      stops_created = detected.length;
    }
    // This rewrites the route's shape, and on a route with no stops it CREATES
    // stops. A silent overwrite of a school's route map is exactly the change
    // someone will later need to trace back.
    await audit(req, 'TRANSPORT_ROUTE_PATH', 'transport_route', Number(id), {
      new_data: { points: simplified.length, stops_created },
    });
    return success(res, { points: simplified.length, stops_created }, 'Route map saved from your drive');
  } catch (e) { return error(res, e.message, 500); }
});

// Driver's roster: which students board at each stop today + who's on leave.
router.get('/route-manifest/:routeId', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    if (!(await canStartTrip(orgId, uid)))
      return error(res, 'Only a driver or admin can view the route roster.', 403);
    const { routeId } = req.params;
    const route = await queryOne('SELECT id, name, driver_user_id FROM client_transport_routes WHERE id=? AND org_id=?', [routeId, orgId]);
    if (!route) return error(res, 'Route not found', 404);
    // This roster is children: names, class, and who is on leave today. Being a
    // driver somewhere is not a reason to read another route's list, so a driver
    // sees the roster of the bus they actually drive and the office sees any.
    if (route.driver_user_id !== uid && !(await userCan(uid, 'transport.manage', orgId)))
      return error(res, 'You can only see the roster for a route you drive.', 403);

    const stops = await query('SELECT id, stop_name, sequence_no FROM client_transport_stops WHERE route_id=? ORDER BY sequence_no, id', [routeId]);
    const kids = await query(`
      SELECT st.stop_id, s.id AS student_id, u.first_name, u.last_name,
        c.name AS class_name, sec.name AS section_name, u.phone AS phone,
        (SELECT lr.status FROM client_leave_requests lr
           WHERE lr.org_id=? AND lr.student_id=s.id AND lr.status IN ('approved','pending')
             AND lr.from_date <= CURDATE() AND lr.to_date >= CURDATE()
           ORDER BY FIELD(lr.status,'approved','pending') LIMIT 1) AS leave_status
      FROM client_student_transport st
      JOIN client_students s ON s.id=st.student_id
      JOIN client_users u ON u.id=s.user_id
      LEFT JOIN client_enrollments e ON e.student_id=s.id AND e.status='active'
      LEFT JOIN client_sections sec ON sec.id=e.section_id
      LEFT JOIN client_classes c ON c.id=sec.class_id
      WHERE st.org_id=? AND st.route_id=? AND st.status='active' AND u.is_active=1
      ORDER BY u.first_name`, [orgId, orgId, routeId]);

    const byStop = new Map();
    for (const s of stops) byStop.set(s.id, { id: s.id, stop_name: s.stop_name, sequence_no: s.sequence_no, students: [] });
    const noStop = { id: null, stop_name: 'Stop not set', sequence_no: 9999, students: [] };
    let expected = 0, onLeave = 0;
    for (const k of kids) {
      const row = {
        name: [k.first_name, k.last_name].filter(Boolean).join(' '),
        klass: [k.class_name, k.section_name].filter(Boolean).join(' '),
        on_leave: !!k.leave_status,
        leave_status: k.leave_status || null,
      };
      if (k.leave_status) onLeave++; else expected++;
      (byStop.get(k.stop_id) || noStop).students.push(row);
    }
    const out = [...byStop.values()];
    if (noStop.students.length) out.push(noStop);
    for (const st of out) {
      st.expected = st.students.filter((x) => !x.on_leave).length;
      st.on_leave = st.students.filter((x) => x.on_leave).length;
    }
    return success(res, { route: route.name, stops: out, total_students: kids.length, expected, on_leave: onLeave });
  } catch (e) { return error(res, e.message, 500); }
});

// The caller's current active trip (so the driver page resumes after reload)
router.get('/trips/mine', async (req, res) => {
  try {
    const trip = await queryOne(`
      SELECT t.*, r.name AS route_name, v.reg_no AS vehicle_reg_no
      FROM client_transport_trips t
      LEFT JOIN client_transport_routes r ON r.id=t.route_id
      LEFT JOIN client_transport_vehicles v ON v.id=t.vehicle_id
      WHERE t.driver_user_id=? AND t.org_id=? AND t.status='active'
      ORDER BY t.id DESC LIMIT 1`, [req.user.user_id, req.user.org_id]);
    return success(res, { trip: trip || null });
  } catch (e) { return error(res, e.message, 500); }
});

// Start a trip
router.post('/trips/start', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    const { route_id, direction = 'pickup' } = req.body;
    if (!route_id) return error(res, 'route_id required', 400);

    // gate: only a designated driver or an admin may broadcast a bus
    if (!(await canStartTrip(orgId, uid)))
      return error(res, 'Only a driver assigned to a route can start a trip. Ask the office to set you as the driver.', 403);

    const route = await queryOne('SELECT id, vehicle_id, status FROM client_transport_routes WHERE id=? AND org_id=?', [route_id, orgId]);
    if (!route) return error(res, 'Route not found', 404);
    if (route.status !== 'active') return error(res, 'This route is not active.', 400);
    const dir = direction === 'drop' ? 'drop' : 'pickup';

    await endStaleTrips(orgId);
    // one bus per route + one trip per driver: close any active trip by this
    // driver AND any active trip already on this route (clean handover/substitute)
    await query(
      `UPDATE client_transport_trips SET status='ended', ended_at=NOW()
        WHERE org_id=? AND status='active' AND (driver_user_id=? OR route_id=?)`,
      [orgId, uid, route_id]);

    const me = await queryOne('SELECT first_name, last_name FROM client_users WHERE id=?', [uid]);
    const driverName = me ? [me.first_name, me.last_name].filter(Boolean).join(' ').trim() : null;

    const r = await query(
      `INSERT INTO client_transport_trips (org_id, route_id, vehicle_id, driver_user_id, driver_name, direction, status)
       VALUES (?,?,?,?,?,?, 'active')`,
      [orgId, route_id, route.vehicle_id || null, uid, driverName || null, dir]);
    // A trip is the moment a person's live position starts going to families.
    // Both ends of that are recorded, so the school can always say who was
    // sharing, on which bus, and for how long.
    await audit(req, 'TRANSPORT_TRIP_START', 'transport_trip', r.insertId, {
      new_data: { route_id: Number(route_id), direction: dir, vehicle_id: route.vehicle_id || null },
    });
    return success(res, { trip_id: r.insertId }, 'Trip started', 201);
  } catch (e) { return error(res, e.message, 500); }
});

// Location ping (called every ~15-20s by the driver's browser) — kept tiny
router.post('/trips/:id/ping', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    const { id } = req.params;
    let { lat, lng, speed, heading } = req.body;
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
      return error(res, 'Valid lat/lng required', 400);
    const spd = Number.isFinite(Number(speed)) ? Number(speed) : null;
    const hdg = Number.isFinite(Number(heading)) ? Number(heading) : null;
    const r = await query(
      `UPDATE client_transport_trips
         SET last_lat=?, last_lng=?, last_speed=?, last_heading=?, last_ping_at=NOW()
       WHERE id=? AND org_id=? AND driver_user_id=? AND status='active'`,
      [lat, lng, spd, hdg, id, orgId, uid]);
    if (!r.affectedRows) return error(res, 'Trip not active', 404);
    return success(res, {}, 'ok');
  } catch (e) { return error(res, e.message, 500); }
});

// End a trip
router.post('/trips/:id/end', async (req, res) => {
  try {
    const r = await query(
      `UPDATE client_transport_trips SET status='ended', ended_at=NOW()
       WHERE id=? AND org_id=? AND driver_user_id=? AND status='active'`,
      [req.params.id, req.user.org_id, req.user.user_id]);
    if (r.affectedRows) await audit(req, 'TRANSPORT_TRIP_END', 'transport_trip', Number(req.params.id));
    return success(res, {}, r.affectedRows ? 'Trip ended' : 'No active trip');
  } catch (e) { return error(res, e.message, 500); }
});

// ADMIN / PRINCIPAL live map — every active bus in the org. The comment above
// predates the guard — this returned live GPS + driver phone for every bus to
// any authenticated user with no role check at all. Gated to transport.manage
// (same permission every other management route in this file requires).
router.get('/trips/active', requirePermission('transport.manage'), async (req, res) => {
  try {
    const orgId = req.user.org_id;
    await endStaleTrips(orgId);
    const trips = await query(`
      SELECT t.id, t.route_id, t.vehicle_id, t.driver_name, t.direction,
        t.last_lat, t.last_lng, t.last_speed, t.last_heading, t.last_ping_at, t.started_at,
        r.name AS route_name, r.start_point, r.end_point, r.path_json,
        v.reg_no AS vehicle_reg_no, v.name AS vehicle_name,
        COALESCE(du.phone, d.phone) AS driver_phone
      FROM client_transport_trips t
      LEFT JOIN client_transport_routes r ON r.id=t.route_id
      LEFT JOIN client_transport_vehicles v ON v.id=t.vehicle_id
      LEFT JOIN client_transport_staff d ON d.id=v.driver_id
      LEFT JOIN client_users du ON du.id=t.driver_user_id
      WHERE t.org_id=? AND t.status='active'
      ORDER BY r.name`, [orgId]);
    const now = Date.now();
    for (const t of trips) {
      t.path = safeParse(t.path_json); delete t.path_json;
      t.stale = !t.last_ping_at || (now - new Date(t.last_ping_at).getTime()) > STALE_MS;
      t.stops = await query(
        'SELECT id, stop_name, sequence_no, lat, lng, pickup_time, drop_time FROM client_transport_stops WHERE route_id=? ORDER BY sequence_no, id',
        [t.route_id]);
    }
    return success(res, { trips });
  } catch (e) { return error(res, e.message, 500); }
});

// PARENT / STUDENT — my route's live bus + ETA to my stop
router.get('/my-bus', async (req, res) => {
  try {
    const orgId = req.user.org_id, uid = req.user.user_id;
    // NOTE: no endStaleTrips() here — this is the high-frequency parent poll
    // (could be thousands of families). A stale trip simply shows live=false
    // (“waiting for signal”); admin's live view + the next Start cleans it up.

    // collect the caller's transport assignments (parent → children, student → self)
    let assigns = [];
    const parent = await queryOne('SELECT id FROM client_parents WHERE user_id=? AND org_id=?', [uid, orgId]);
    if (parent) {
      assigns = await query(`
        SELECT st.route_id, st.stop_id, u.first_name AS who
        FROM client_parent_students ps
        JOIN client_students s ON s.id=ps.student_id
        JOIN client_users u ON u.id=s.user_id
        JOIN client_student_transport st ON st.student_id=ps.student_id AND st.status='active'
        WHERE ps.parent_id=? AND ps.org_id=?`, [parent.id, orgId]);
    } else {
      const stu = await queryOne('SELECT id FROM client_students WHERE user_id=? AND org_id=?', [uid, orgId]);
      if (stu) {
        assigns = await query(`
          SELECT st.route_id, st.stop_id, 'You' AS who
          FROM client_student_transport st WHERE st.student_id=? AND st.status='active'`, [stu.id]);
      }
    }

    const now = Date.now();
    const buses = [];
    const seen = new Set();
    for (const a of assigns) {
      if (!a.route_id || seen.has(a.route_id + ':' + a.stop_id)) continue;
      seen.add(a.route_id + ':' + a.stop_id);
      const trip = await queryOne(`
        SELECT t.id, t.last_lat, t.last_lng, t.last_speed, t.last_ping_at, t.direction, t.driver_name,
          r.name AS route_name, r.path_json, v.reg_no AS vehicle_reg_no, COALESCE(du.phone, d.phone) AS driver_phone
        FROM client_transport_trips t
        LEFT JOIN client_transport_routes r ON r.id=t.route_id
        LEFT JOIN client_transport_vehicles v ON v.id=t.vehicle_id
        LEFT JOIN client_transport_staff d ON d.id=v.driver_id
        LEFT JOIN client_users du ON du.id=t.driver_user_id
        WHERE t.route_id=? AND t.org_id=? AND t.status='active'
        ORDER BY t.id DESC LIMIT 1`, [a.route_id, orgId]);
      const myStop = await queryOne('SELECT id, stop_name, lat, lng, sequence_no FROM client_transport_stops WHERE id=?', [a.stop_id]);
      const stops = await query('SELECT id, stop_name, sequence_no, lat, lng FROM client_transport_stops WHERE route_id=? ORDER BY sequence_no, id', [a.route_id]);

      let etaMin = null, distanceM = null, live = false, stale = true;
      if (trip && trip.last_lat != null && trip.last_lng != null) {
        stale = !trip.last_ping_at || (now - new Date(trip.last_ping_at).getTime()) > STALE_MS;
        live = !stale;
        if (myStop && myStop.lat != null && myStop.lng != null) {
          distanceM = Math.round(haversineM(+trip.last_lat, +trip.last_lng, +myStop.lat, +myStop.lng));
          // speed: use reported (m/s) if moving, else assume 20 km/h city bus
          const mps = (trip.last_speed && trip.last_speed > 2) ? trip.last_speed : (20 * 1000 / 3600);
          etaMin = Math.max(1, Math.round(distanceM / mps / 60));
        }
      }
      buses.push({
        who: a.who,
        route_name: trip?.route_name || null,
        vehicle_reg_no: trip?.vehicle_reg_no || null,
        driver_name: trip?.driver_name || null,
        driver_phone: trip?.driver_phone || null,
        direction: trip?.direction || null,
        running: !!trip,
        live, stale,
        last_lat: trip?.last_lat ?? null,
        last_lng: trip?.last_lng ?? null,
        last_ping_at: trip?.last_ping_at ?? null,
        my_stop: myStop || null,
        distance_m: distanceM,
        eta_min: etaMin,
        stops,
        path: safeParse(trip?.path_json),
      });
    }
    return success(res, { buses });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;
