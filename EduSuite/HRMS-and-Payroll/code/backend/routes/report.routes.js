// backend/routes/report.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================================
// 1. EMPLOYEE REPORT
// ============================================================
router.get('/employees', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, employee_code, first_name, last_name, email, phone, 
              designation, department, DATE_FORMAT(date_of_joining, '%Y-%m-%d') as date_of_joining
       FROM employees WHERE deleted_at IS NULL`
    );
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'Employee Master Report',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 2. LEAVE LEDGER REPORT
// ============================================================
router.get('/leave-ledger', async (req, res) => {
  const { from_date, to_date } = req.query;
  try {
    let query = `
      SELECT lr.id, 
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.employee_code,
             lt.name as leave_type,
             lr.from_date, lr.to_date, lr.days, lr.status, lr.reason,
             DATE_FORMAT(lr.created_at, '%Y-%m-%d') as created_date
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.deleted_at IS NULL
    `;
    const params = [];

    if (from_date) {
      query += ` AND lr.created_at >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND lr.created_at <= ?`;
      params.push(to_date);
    }

    query += ` ORDER BY lr.created_at DESC`;

    const [rows] = await db.query(query, params);
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'Leave Ledger Report',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 3. CPD COMPLIANCE REPORT
// ============================================================
router.get('/cpd-compliance', async (req, res) => {
  const { fy } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.employee_code, 
              CONCAT(e.first_name, ' ', e.last_name) as employee_name,
              COALESCE(SUM(CASE WHEN c.status = 'VERIFIED' THEN c.hours ELSE 0 END), 0) as verified_hours,
              COALESCE(SUM(CASE WHEN c.status = 'SUBMITTED' THEN c.hours ELSE 0 END), 0) as pending_hours,
              COUNT(c.id) as total_activities,
              CASE 
                WHEN COALESCE(SUM(CASE WHEN c.status = 'VERIFIED' THEN c.hours ELSE 0 END), 0) >= 50 THEN '✅ Compliant'
                WHEN COALESCE(SUM(CASE WHEN c.status = 'VERIFIED' THEN c.hours ELSE 0 END), 0) >= 25 THEN '⚠️ In Progress'
                ELSE '❌ Not Compliant'
              END as compliance_status
       FROM employees e
       LEFT JOIN cpd_records c ON c.employee_id = e.id AND c.fy = ? AND c.deleted_at IS NULL
       WHERE e.deleted_at IS NULL
       GROUP BY e.id, e.employee_code, e.first_name, e.last_name
       ORDER BY verified_hours DESC`,
      [fy || '2026-27']
    );
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'CPD Compliance Report',
        fy: fy || '2026-27',
        target_hours: 50,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 4. APPRAISAL REPORT
// ============================================================
router.get('/appraisals', async (req, res) => {
  const { cycle_id } = req.query;
  try {
    let query = `
      SELECT a.id, 
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.employee_code,
             ac.name as cycle_name,
             a.self_rating, a.manager_rating, a.final_rating, a.status,
             DATE_FORMAT(a.created_at, '%Y-%m-%d') as created_date
      FROM appraisals a
      JOIN employees e ON e.id = a.employee_id
      JOIN appraisal_cycles ac ON ac.id = a.cycle_id
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (cycle_id) {
      query += ` AND a.cycle_id = ?`;
      params.push(cycle_id);
    }

    query += ` ORDER BY a.created_at DESC`;

    const [rows] = await db.query(query, params);
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'Appraisal Report',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 5. EXIT REPORT
// ============================================================
router.get('/exits', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, 
              CONCAT(emp.first_name, ' ', emp.last_name) as employee_name,
              emp.employee_code,
              DATE_FORMAT(e.resignation_date, '%Y-%m-%d') as resignation_date,
              DATE_FORMAT(e.last_working_day, '%Y-%m-%d') as last_working_day,
              e.exit_type, e.status, e.reason,
              DATE_FORMAT(e.created_at, '%Y-%m-%d') as created_date
       FROM exits e
       JOIN employees emp ON emp.id = e.employee_id
       WHERE e.deleted_at IS NULL
       ORDER BY e.created_at DESC`
    );
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'Exit Report',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// ============================================================
// 6. PAYROLL REGISTER REPORT
// ============================================================
router.get('/payroll-register', async (req, res) => {
  const { period_month, period_year } = req.query;
  try {
    let query = `
      SELECT pr.id, 
             CONCAT(e.first_name, ' ', e.last_name) as employee_name,
             e.employee_code,
             pr.period_month, pr.period_year, pr.status,
             pr.total_gross, pr.total_deductions, pr.total_net,
             DATE_FORMAT(pr.created_at, '%Y-%m-%d') as created_date
      FROM payroll_runs pr
      JOIN employees e ON e.id = pr.employee_id
      WHERE pr.deleted_at IS NULL
    `;
    const params = [];

    if (period_month) {
      query += ` AND pr.period_month = ?`;
      params.push(period_month);
    }
    if (period_year) {
      query += ` AND pr.period_year = ?`;
      params.push(period_year);
    }

    query += ` ORDER BY pr.created_at DESC`;

    const [rows] = await db.query(query, params);
    res.json({
      data: rows,
      meta: {
        total: rows.length,
        report_type: 'Payroll Register Report',
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;