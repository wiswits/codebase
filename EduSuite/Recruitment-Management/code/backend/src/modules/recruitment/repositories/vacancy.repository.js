import { query, withTransaction } from '../../../config/database.js';
import { VACANCY_STATUS } from '../../../config/constants.js';

/**
 * Vacancy Repository
 * Handles all database operations for job vacancies
 */
export const vacancyRepository = {
  /**
   * Create a new vacancy
   */
  async create(data) {
    const {
      organization_id,
      vacancy_code,
      job_title,
      department,
      designation,
      employment_type,
      work_mode,
      location,
      number_of_openings,
      experience_required,
      salary_min,
      salary_max,
      currency,
      job_description,
      required_skills,
      preferred_skills,
      education_required,
      application_start_date,
      application_end_date,
      expected_joining_date,
      hiring_manager_id,
      recruiter_id,
      status = VACANCY_STATUS.DRAFT,
      remarks,
      created_by,
    } = data;

    const sql = `
      INSERT INTO client_job_vacancies (
        organization_id,
        vacancy_code,
        job_title,
        department,
        designation,
        employment_type,
        work_mode,
        location,
        number_of_openings,
        experience_required,
        salary_min,
        salary_max,
        currency,
        job_description,
        required_skills,
        preferred_skills,
        education_required,
        application_start_date,
        application_end_date,
        expected_joining_date,
        hiring_manager_id,
        recruiter_id,
        status,
        remarks,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id,
      vacancy_code,
      job_title,
      department,
      designation,
      employment_type,
      work_mode,
      location,
      number_of_openings,
      experience_required,
      salary_min,
      salary_max,
      currency,
      job_description,
      required_skills,
      preferred_skills,
      education_required,
      application_start_date,
      application_end_date,
      expected_joining_date,
      hiring_manager_id,
      recruiter_id,
      status,
      remarks,
      created_by,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Get vacancy by ID with organization isolation
   */
  async findById(id, organization_id) {
    const sql = `
      SELECT 
        id,
        organization_id,
        vacancy_code,
        job_title,
        department,
        designation,
        employment_type,
        work_mode,
        location,
        number_of_openings,
        experience_required,
        salary_min,
        salary_max,
        currency,
        job_description,
        required_skills,
        preferred_skills,
        education_required,
        application_start_date,
        application_end_date,
        expected_joining_date,
        hiring_manager_id,
        recruiter_id,
        status,
        remarks,
        created_by,
        updated_by,
        created_at,
        updated_at,
        is_deleted
      FROM client_job_vacancies
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0] || null;
  },

  /**
   * Get all vacancies with filters
   */
  async findAll(organization_id, filters = {}) {
    const {
      search,
      status,
      department,
      employment_type,
      work_mode,
      from_date,
      to_date,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    let sql = `
      SELECT 
        id,
        organization_id,
        vacancy_code,
        job_title,
        department,
        designation,
        employment_type,
        work_mode,
        location,
        number_of_openings,
        experience_required,
        salary_min,
        salary_max,
        currency,
        status,
        application_start_date,
        application_end_date,
        expected_joining_date,
        hiring_manager_id,
        recruiter_id,
        created_by,
        created_at,
        updated_at
      FROM client_job_vacancies
      WHERE organization_id = ?
        AND is_deleted = 0
    `;

    const params = [organization_id];

    // Apply filters
    if (search) {
      sql += ` AND (job_title LIKE ? OR department LIKE ? OR vacancy_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (department) {
      sql += ` AND department = ?`;
      params.push(department);
    }

    if (employment_type) {
      sql += ` AND employment_type = ?`;
      params.push(employment_type);
    }

    if (work_mode) {
      sql += ` AND work_mode = ?`;
      params.push(work_mode);
    }

    if (from_date) {
      sql += ` AND application_start_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND application_end_date <= ?`;
      params.push(to_date);
    }

    // Sorting
    const allowedSortColumns = ['created_at', 'updated_at', 'job_title', 'status', 'application_start_date'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await query(sql, params);
    return rows;
  },

  /**
   * Get total count of vacancies with filters
   */
  async count(organization_id, filters = {}) {
    const {
      search,
      status,
      department,
      employment_type,
      work_mode,
      from_date,
      to_date,
    } = filters;

    let sql = `
      SELECT COUNT(*) as total
      FROM client_job_vacancies
      WHERE organization_id = ?
        AND is_deleted = 0
    `;

    const params = [organization_id];

    if (search) {
      sql += ` AND (job_title LIKE ? OR department LIKE ? OR vacancy_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (department) {
      sql += ` AND department = ?`;
      params.push(department);
    }

    if (employment_type) {
      sql += ` AND employment_type = ?`;
      params.push(employment_type);
    }

    if (work_mode) {
      sql += ` AND work_mode = ?`;
      params.push(work_mode);
    }

    if (from_date) {
      sql += ` AND application_start_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND application_end_date <= ?`;
      params.push(to_date);
    }

    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Update a vacancy
   */
  async update(id, organization_id, data) {
    const {
      vacancy_code,
      job_title,
      department,
      designation,
      employment_type,
      work_mode,
      location,
      number_of_openings,
      experience_required,
      salary_min,
      salary_max,
      currency,
      job_description,
      required_skills,
      preferred_skills,
      education_required,
      application_start_date,
      application_end_date,
      expected_joining_date,
      hiring_manager_id,
      recruiter_id,
      status,
      remarks,
      updated_by,
    } = data;

    const sql = `
      UPDATE client_job_vacancies
      SET 
        vacancy_code = COALESCE(?, vacancy_code),
        job_title = COALESCE(?, job_title),
        department = COALESCE(?, department),
        designation = COALESCE(?, designation),
        employment_type = COALESCE(?, employment_type),
        work_mode = COALESCE(?, work_mode),
        location = COALESCE(?, location),
        number_of_openings = COALESCE(?, number_of_openings),
        experience_required = COALESCE(?, experience_required),
        salary_min = COALESCE(?, salary_min),
        salary_max = COALESCE(?, salary_max),
        currency = COALESCE(?, currency),
        job_description = COALESCE(?, job_description),
        required_skills = COALESCE(?, required_skills),
        preferred_skills = COALESCE(?, preferred_skills),
        education_required = COALESCE(?, education_required),
        application_start_date = COALESCE(?, application_start_date),
        application_end_date = COALESCE(?, application_end_date),
        expected_joining_date = COALESCE(?, expected_joining_date),
        hiring_manager_id = COALESCE(?, hiring_manager_id),
        recruiter_id = COALESCE(?, recruiter_id),
        status = COALESCE(?, status),
        remarks = COALESCE(?, remarks),
        updated_by = ?
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const params = [
      vacancy_code,
      job_title,
      department,
      designation,
      employment_type,
      work_mode,
      location,
      number_of_openings,
      experience_required,
      salary_min,
      salary_max,
      currency,
      job_description,
      required_skills,
      preferred_skills,
      education_required,
      application_start_date,
      application_end_date,
      expected_joining_date,
      hiring_manager_id,
      recruiter_id,
      status,
      remarks,
      updated_by,
      id,
      organization_id,
    ];

    const result = await query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Soft delete a vacancy
   */
  async delete(id, organization_id, deleted_by) {
    const sql = `
      UPDATE client_job_vacancies
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
   * Check if vacancy exists
   */
  async exists(id, organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_job_vacancies
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0].count > 0;
  },

  /**
   * Check if vacancy code is unique
   */
  async isCodeUnique(vacancy_code, organization_id, excludeId = null) {
    let sql = `
      SELECT COUNT(*) as count
      FROM client_job_vacancies
      WHERE vacancy_code = ?
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const params = [vacancy_code, organization_id];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const rows = await query(sql, params);
    return rows[0].count === 0;
  },

  /**
   * Get vacancy by code
   */
  async findByCode(vacancy_code, organization_id) {
    const sql = `
      SELECT 
        id,
        organization_id,
        vacancy_code,
        job_title,
        department,
        status,
        created_at
      FROM client_job_vacancies
      WHERE vacancy_code = ?
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [vacancy_code, organization_id]);
    return rows[0] || null;
  },

  /**
   * Get dashboard statistics
   */
  async getStats(organization_id) {
    const sql = `
      SELECT 
        COUNT(*) as total_vacancies,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_vacancies,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_vacancies,
        SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold_vacancies,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_vacancies,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_vacancies,
        SUM(number_of_openings) as total_openings
      FROM client_job_vacancies
      WHERE organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [organization_id]);
    return rows[0] || {
      total_vacancies: 0,
      open_vacancies: 0,
      draft_vacancies: 0,
      on_hold_vacancies: 0,
      closed_vacancies: 0,
      cancelled_vacancies: 0,
      total_openings: 0,
    };
  },

  /**
   * Get recent vacancies
   */
  async getRecent(organization_id, limit = 5) {
    const sql = `
      SELECT 
        id,
        vacancy_code,
        job_title,
        department,
        status,
        number_of_openings,
        created_at
      FROM client_job_vacancies
      WHERE organization_id = ?
        AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ?
    `;

    return await query(sql, [organization_id, limit]);
  },
};

export default vacancyRepository;