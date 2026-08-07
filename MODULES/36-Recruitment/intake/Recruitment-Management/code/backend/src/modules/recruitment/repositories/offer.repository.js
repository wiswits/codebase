import { query } from '../../../config/database.js';
import { OFFER_STATUS } from '../../../config/constants.js';

/**
 * Offer Repository
 * Handles all database operations for offer letters
 */
export const offerRepository = {
  /**
   * Create a new offer
   */
  async create(data) {
    const {
      organization_id,
      applicant_id,
      vacancy_id,
      offer_reference,
      offer_date,
      joining_date,
      designation,
      department,
      employment_type,
      work_mode,
      work_location,
      salary,
      bonus,
      probation_months,
      reporting_manager,
      offer_document,
      status = OFFER_STATUS.DRAFT,
      remarks,
      created_by,
    } = data;

    const sql = `
      INSERT INTO client_offer_letters (
        organization_id,
        applicant_id,
        vacancy_id,
        offer_reference,
        offer_date,
        joining_date,
        designation,
        department,
        employment_type,
        work_mode,
        work_location,
        salary,
        bonus,
        probation_months,
        reporting_manager,
        offer_document,
        status,
        remarks,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id,
      applicant_id,
      vacancy_id,
      offer_reference,
      offer_date,
      joining_date || null,
      designation,
      department || null,
      employment_type,
      work_mode,
      work_location || null,
      salary,
      bonus || null,
      probation_months || null,
      reporting_manager || null,
      offer_document || null,
      status,
      remarks || null,
      created_by,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Get offer by ID with organization isolation
   */
  async findById(id, organization_id) {
    const sql = `
      SELECT 
        o.*,
        a.full_name as applicant_name,
        a.email as applicant_email,
        a.phone as applicant_phone,
        v.job_title,
        v.vacancy_code,
        v.department as vacancy_department
      FROM client_offer_letters o
      LEFT JOIN client_applicants a ON o.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON o.vacancy_id = v.id
      WHERE o.id = ?
        AND o.organization_id = ?
        AND o.is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0] || null;
  },

  /**
   * Get all offers with filters
   */
  async findAll(organization_id, filters = {}) {
    const {
      applicant_id,
      vacancy_id,
      status,
      from_date,
      to_date,
      search,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    let sql = `
      SELECT 
        o.id,
        o.applicant_id,
        o.vacancy_id,
        o.offer_reference,
        o.offer_date,
        o.joining_date,
        o.designation,
        o.department,
        o.employment_type,
        o.work_mode,
        o.work_location,
        o.salary,
        o.bonus,
        o.probation_months,
        o.reporting_manager,
        o.status,
        o.remarks,
        o.created_at,
        o.updated_at,
        a.full_name as applicant_name,
        a.email as applicant_email,
        v.job_title,
        v.vacancy_code
      FROM client_offer_letters o
      LEFT JOIN client_applicants a ON o.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON o.vacancy_id = v.id
      WHERE o.organization_id = ?
        AND o.is_deleted = 0
    `;

    const params = [organization_id];

    if (applicant_id) {
      sql += ` AND o.applicant_id = ?`;
      params.push(applicant_id);
    }

    if (vacancy_id) {
      sql += ` AND o.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (from_date) {
      sql += ` AND o.offer_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND o.offer_date <= ?`;
      params.push(to_date);
    }

    if (search) {
      sql += ` AND (
        o.offer_reference LIKE ? OR 
        a.full_name LIKE ? OR 
        o.designation LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Sorting
    const allowedSortColumns = ['created_at', 'updated_at', 'offer_date', 'joining_date', 'status'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY o.${safeSortBy} ${safeSortOrder}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await query(sql, params);
  },

  /**
   * Get total count of offers with filters
   */
  async count(organization_id, filters = {}) {
    const {
      applicant_id,
      vacancy_id,
      status,
      from_date,
      to_date,
      search,
    } = filters;

    let sql = `
      SELECT COUNT(*) as total
      FROM client_offer_letters o
      LEFT JOIN client_applicants a ON o.applicant_id = a.id
      WHERE o.organization_id = ?
        AND o.is_deleted = 0
    `;

    const params = [organization_id];

    if (applicant_id) {
      sql += ` AND o.applicant_id = ?`;
      params.push(applicant_id);
    }

    if (vacancy_id) {
      sql += ` AND o.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (from_date) {
      sql += ` AND o.offer_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND o.offer_date <= ?`;
      params.push(to_date);
    }

    if (search) {
      sql += ` AND (
        o.offer_reference LIKE ? OR 
        a.full_name LIKE ? OR 
        o.designation LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Update an offer
   */
  async update(id, organization_id, data) {
    const fields = [];
    const params = [];

    const fieldMap = {
      applicant_id: 'applicant_id = ?',
      vacancy_id: 'vacancy_id = ?',
      offer_reference: 'offer_reference = ?',
      offer_date: 'offer_date = ?',
      joining_date: 'joining_date = ?',
      designation: 'designation = ?',
      department: 'department = ?',
      employment_type: 'employment_type = ?',
      work_mode: 'work_mode = ?',
      work_location: 'work_location = ?',
      salary: 'salary = ?',
      bonus: 'bonus = ?',
      probation_months: 'probation_months = ?',
      reporting_manager: 'reporting_manager = ?',
      offer_document: 'offer_document = ?',
      status: 'status = ?',
      accepted_on: 'accepted_on = ?',
      remarks: 'remarks = ?',
      updated_by: 'updated_by = ?',
    };

    for (const [key, value] of Object.entries(data)) {
      if (key in fieldMap && value !== undefined) {
        fields.push(fieldMap[key]);
        params.push(value);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    params.push(id, organization_id);

    const sql = `
      UPDATE client_offer_letters
      SET ${fields.join(', ')}
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const result = await query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Soft delete an offer
   */
  async delete(id, organization_id, deleted_by) {
    const sql = `
      UPDATE client_offer_letters
      SET 
        is_deleted = 1,
        deleted_by = ?,
        deleted_at = NOW()
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const result = await query(sql, [deleted_by, id, organization_id]);
    return result.affectedRows > 0;
  },

  /**
   * Check if offer exists
   */
  async exists(id, organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_offer_letters
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0].count > 0;
  },

  /**
   * Get offers by applicant
   */
  async findByApplicant(applicant_id, organization_id) {
    const sql = `
      SELECT 
        o.*,
        v.job_title,
        v.vacancy_code
      FROM client_offer_letters o
      LEFT JOIN client_job_vacancies v ON o.vacancy_id = v.id
      WHERE o.applicant_id = ?
        AND o.organization_id = ?
        AND o.is_deleted = 0
      ORDER BY o.created_at DESC
    `;

    return await query(sql, [applicant_id, organization_id]);
  },

  /**
   * Get offer statistics
   */
  async getStats(organization_id) {
    const sql = `
      SELECT 
        COUNT(*) as total_offers,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn,
        SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) as expired,
        AVG(salary) as avg_salary
      FROM client_offer_letters
      WHERE organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [organization_id]);
    return rows[0] || {
      total_offers: 0,
      draft: 0,
      pending: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      expired: 0,
      avg_salary: null,
    };
  },

  /**
   * Generate unique offer reference
   */
  async generateReference(organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_offer_letters
      WHERE organization_id = ?
    `;

    const rows = await query(sql, [organization_id]);
    const count = rows[0].count + 1;
    return `OFF-${String(count).padStart(3, '0')}`;
  },

  /**
   * Get offers by status
   */
  async findByStatus(status, organization_id) {
    const sql = `
      SELECT 
        o.*,
        a.full_name as applicant_name,
        a.email as applicant_email,
        v.job_title,
        v.vacancy_code
      FROM client_offer_letters o
      LEFT JOIN client_applicants a ON o.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON o.vacancy_id = v.id
      WHERE o.status = ?
        AND o.organization_id = ?
        AND o.is_deleted = 0
      ORDER BY o.created_at DESC
    `;

    return await query(sql, [status, organization_id]);
  },
};

export default offerRepository;