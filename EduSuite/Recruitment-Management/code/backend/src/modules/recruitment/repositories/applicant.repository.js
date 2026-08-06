import { query, withTransaction } from '../../../config/database.js';
import { APPLICANT_STAGES, APPLICANT_STATUS, APPLICATION_SOURCE } from '../../../config/constants.js';

/**
 * Applicant Repository
 * Handles all database operations for applicants
 */
export const applicantRepository = {
  /**
   * Create a new applicant
   */
  async create(data) {
    const {
      organization_id,
      vacancy_id,
      applicant_code,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      alternate_phone,
      gender,
      date_of_birth,
      current_city,
      current_state,
      current_country,
      address,
      highest_qualification,
      specialization,
      university,
      graduation_year,
      total_experience,
      current_company,
      current_designation,
      current_ctc,
      expected_ctc,
      notice_period,
      resume_file,
      portfolio_url,
      linkedin_url,
      github_url,
      current_stage = APPLICANT_STAGES.APPLIED,
      application_source = APPLICATION_SOURCE.WEBSITE,
      application_date,
      status = APPLICANT_STATUS.ACTIVE,
      recruiter_id,
      notes,
      created_by,
    } = data;

    const sql = `
      INSERT INTO client_applicants (
        organization_id,
        vacancy_id,
        applicant_code,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        alternate_phone,
        gender,
        date_of_birth,
        current_city,
        current_state,
        current_country,
        address,
        highest_qualification,
        specialization,
        university,
        graduation_year,
        total_experience,
        current_company,
        current_designation,
        current_ctc,
        expected_ctc,
        notice_period,
        resume_file,
        portfolio_url,
        linkedin_url,
        github_url,
        current_stage,
        application_source,
        application_date,
        status,
        recruiter_id,
        notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id,
      vacancy_id,
      applicant_code,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      alternate_phone,
      gender,
      date_of_birth,
      current_city,
      current_state,
      current_country,
      address,
      highest_qualification,
      specialization,
      university,
      graduation_year,
      total_experience,
      current_company,
      current_designation,
      current_ctc,
      expected_ctc,
      notice_period,
      resume_file,
      portfolio_url,
      linkedin_url,
      github_url,
      current_stage,
      application_source,
      application_date,
      status,
      recruiter_id,
      notes,
      created_by,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Bulk create applicants
   */
  async bulkCreate(applicants) {
    if (!applicants || applicants.length === 0) {
      return 0;
    }

    const sql = `
      INSERT INTO client_applicants (
        organization_id,
        vacancy_id,
        applicant_code,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        alternate_phone,
        gender,
        date_of_birth,
        current_city,
        current_state,
        current_country,
        address,
        highest_qualification,
        specialization,
        university,
        graduation_year,
        total_experience,
        current_company,
        current_designation,
        current_ctc,
        expected_ctc,
        notice_period,
        resume_file,
        portfolio_url,
        linkedin_url,
        github_url,
        current_stage,
        application_source,
        application_date,
        status,
        recruiter_id,
        notes,
        created_by
      ) VALUES ?
    `;

    const values = applicants.map(a => [
      a.organization_id,
      a.vacancy_id,
      a.applicant_code,
      a.first_name,
      a.last_name,
      a.full_name,
      a.email,
      a.phone,
      a.alternate_phone || null,
      a.gender || null,
      a.date_of_birth || null,
      a.current_city || null,
      a.current_state || null,
      a.current_country || null,
      a.address || null,
      a.highest_qualification || null,
      a.specialization || null,
      a.university || null,
      a.graduation_year || null,
      a.total_experience || 0,
      a.current_company || null,
      a.current_designation || null,
      a.current_ctc || null,
      a.expected_ctc || null,
      a.notice_period || null,
      a.resume_file || null,
      a.portfolio_url || null,
      a.linkedin_url || null,
      a.github_url || null,
      a.current_stage || APPLICANT_STAGES.APPLIED,
      a.application_source || APPLICATION_SOURCE.WEBSITE,
      a.application_date || new Date().toISOString().split('T')[0],
      a.status || APPLICANT_STATUS.ACTIVE,
      a.recruiter_id || null,
      a.notes || null,
      a.created_by,
    ]);

    const result = await query(sql, [values]);
    return result.affectedRows;
  },

  /**
   * Get applicant by ID with organization isolation
   */
  async findById(id, organization_id) {
    const sql = `
      SELECT 
        a.*,
        v.job_title,
        v.department,
        v.vacancy_code
      FROM client_applicants a
      LEFT JOIN client_job_vacancies v ON a.vacancy_id = v.id
      WHERE a.id = ? 
        AND a.organization_id = ?
        AND a.is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0] || null;
  },

  /**
   * Get all applicants with advanced filters
   */
  async findAll(organization_id, filters = {}) {
    const {
      search,
      vacancy_id,
      current_stage,
      status,
      application_source,
      gender,
      min_experience,
      max_experience,
      min_ctc,
      max_ctc,
      city,
      state,
      country,
      highest_qualification,
      from_date,
      to_date,
      recruiter_id,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = filters;

    let sql = `
      SELECT 
        a.id,
        a.organization_id,
        a.vacancy_id,
        a.applicant_code,
        a.first_name,
        a.last_name,
        a.full_name,
        a.email,
        a.phone,
        a.gender,
        a.current_city,
        a.current_state,
        a.current_country,
        a.highest_qualification,
        a.total_experience,
        a.current_company,
        a.current_designation,
        a.current_ctc,
        a.expected_ctc,
        a.notice_period,
        a.current_stage,
        a.application_source,
        a.application_date,
        a.status,
        a.recruiter_id,
        a.notes,
        a.created_at,
        a.updated_at,
        v.job_title,
        v.department,
        v.vacancy_code
      FROM client_applicants a
      LEFT JOIN client_job_vacancies v ON a.vacancy_id = v.id
      WHERE a.organization_id = ?
        AND a.is_deleted = 0
    `;

    const params = [organization_id];

    // Advanced search
    if (search) {
      sql += ` AND (
        a.full_name LIKE ? OR 
        a.email LIKE ? OR 
        a.phone LIKE ? OR 
        a.applicant_code LIKE ? OR
        a.current_company LIKE ? OR
        a.current_designation LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Exact filters
    if (vacancy_id) {
      sql += ` AND a.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (current_stage) {
      sql += ` AND a.current_stage = ?`;
      params.push(current_stage);
    }

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    if (application_source) {
      sql += ` AND a.application_source = ?`;
      params.push(application_source);
    }

    if (gender) {
      sql += ` AND a.gender = ?`;
      params.push(gender);
    }

    if (recruiter_id) {
      sql += ` AND a.recruiter_id = ?`;
      params.push(recruiter_id);
    }

    // Range filters
    if (min_experience !== undefined) {
      sql += ` AND a.total_experience >= ?`;
      params.push(min_experience);
    }

    if (max_experience !== undefined) {
      sql += ` AND a.total_experience <= ?`;
      params.push(max_experience);
    }

    if (min_ctc !== undefined) {
      sql += ` AND a.expected_ctc >= ?`;
      params.push(min_ctc);
    }

    if (max_ctc !== undefined) {
      sql += ` AND a.expected_ctc <= ?`;
      params.push(max_ctc);
    }

    if (city) {
      sql += ` AND a.current_city = ?`;
      params.push(city);
    }

    if (state) {
      sql += ` AND a.current_state = ?`;
      params.push(state);
    }

    if (country) {
      sql += ` AND a.current_country = ?`;
      params.push(country);
    }

    if (highest_qualification) {
      sql += ` AND a.highest_qualification = ?`;
      params.push(highest_qualification);
    }

    if (from_date) {
      sql += ` AND a.application_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND a.application_date <= ?`;
      params.push(to_date);
    }

    // Sorting
    const allowedSortColumns = [
      'created_at', 'updated_at', 'full_name', 'email', 
      'current_stage', 'application_date', 'total_experience'
    ];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY a.${safeSortBy} ${safeSortOrder}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await query(sql, params);
    return rows;
  },

  /**
   * Get total count of applicants with filters
   */
  async count(organization_id, filters = {}) {
    const {
      search,
      vacancy_id,
      current_stage,
      status,
      application_source,
      gender,
      min_experience,
      max_experience,
      min_ctc,
      max_ctc,
      city,
      state,
      country,
      highest_qualification,
      from_date,
      to_date,
      recruiter_id,
    } = filters;

    let sql = `
      SELECT COUNT(*) as total
      FROM client_applicants a
      WHERE a.organization_id = ?
        AND a.is_deleted = 0
    `;

    const params = [organization_id];

    if (search) {
      sql += ` AND (
        a.full_name LIKE ? OR 
        a.email LIKE ? OR 
        a.phone LIKE ? OR 
        a.applicant_code LIKE ? OR
        a.current_company LIKE ? OR
        a.current_designation LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (vacancy_id) {
      sql += ` AND a.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (current_stage) {
      sql += ` AND a.current_stage = ?`;
      params.push(current_stage);
    }

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    if (application_source) {
      sql += ` AND a.application_source = ?`;
      params.push(application_source);
    }

    if (gender) {
      sql += ` AND a.gender = ?`;
      params.push(gender);
    }

    if (recruiter_id) {
      sql += ` AND a.recruiter_id = ?`;
      params.push(recruiter_id);
    }

    if (min_experience !== undefined) {
      sql += ` AND a.total_experience >= ?`;
      params.push(min_experience);
    }

    if (max_experience !== undefined) {
      sql += ` AND a.total_experience <= ?`;
      params.push(max_experience);
    }

    if (min_ctc !== undefined) {
      sql += ` AND a.expected_ctc >= ?`;
      params.push(min_ctc);
    }

    if (max_ctc !== undefined) {
      sql += ` AND a.expected_ctc <= ?`;
      params.push(max_ctc);
    }

    if (city) {
      sql += ` AND a.current_city = ?`;
      params.push(city);
    }

    if (state) {
      sql += ` AND a.current_state = ?`;
      params.push(state);
    }

    if (country) {
      sql += ` AND a.current_country = ?`;
      params.push(country);
    }

    if (highest_qualification) {
      sql += ` AND a.highest_qualification = ?`;
      params.push(highest_qualification);
    }

    if (from_date) {
      sql += ` AND a.application_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND a.application_date <= ?`;
      params.push(to_date);
    }

    if (recruiter_id) {
      sql += ` AND a.recruiter_id = ?`;
      params.push(recruiter_id);
    }

    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Update an applicant
   */
  async update(id, organization_id, data) {
    const fields = [];
    const params = [];

    const fieldMap = {
      vacancy_id: 'vacancy_id = ?',
      first_name: 'first_name = ?',
      last_name: 'last_name = ?',
      full_name: 'full_name = ?',
      email: 'email = ?',
      phone: 'phone = ?',
      alternate_phone: 'alternate_phone = ?',
      gender: 'gender = ?',
      date_of_birth: 'date_of_birth = ?',
      current_city: 'current_city = ?',
      current_state: 'current_state = ?',
      current_country: 'current_country = ?',
      address: 'address = ?',
      highest_qualification: 'highest_qualification = ?',
      specialization: 'specialization = ?',
      university: 'university = ?',
      graduation_year: 'graduation_year = ?',
      total_experience: 'total_experience = ?',
      current_company: 'current_company = ?',
      current_designation: 'current_designation = ?',
      current_ctc: 'current_ctc = ?',
      expected_ctc: 'expected_ctc = ?',
      notice_period: 'notice_period = ?',
      resume_file: 'resume_file = ?',
      portfolio_url: 'portfolio_url = ?',
      linkedin_url: 'linkedin_url = ?',
      github_url: 'github_url = ?',
      current_stage: 'current_stage = ?',
      application_source: 'application_source = ?',
      application_date: 'application_date = ?',
      status: 'status = ?',
      recruiter_id: 'recruiter_id = ?',
      notes: 'notes = ?',
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
      UPDATE client_applicants
      SET ${fields.join(', ')}
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const result = await query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Soft delete an applicant
   */
  async delete(id, organization_id, deleted_by) {
    const sql = `
      UPDATE client_applicants
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
   * Check if applicant exists
   */
  async exists(id, organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_applicants
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0].count > 0;
  },

  /**
   * Check if email is unique
   */
  async isEmailUnique(email, organization_id, excludeId = null) {
    let sql = `
      SELECT COUNT(*) as count
      FROM client_applicants
      WHERE email = ?
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const params = [email, organization_id];

    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }

    const rows = await query(sql, params);
    return rows[0].count === 0;
  },

  /**
   * Get applicants by vacancy
   */
  async findByVacancy(vacancy_id, organization_id) {
    const sql = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        current_stage,
        total_experience,
        created_at
      FROM client_applicants
      WHERE vacancy_id = ?
        AND organization_id = ?
        AND is_deleted = 0
      ORDER BY created_at DESC
    `;

    return await query(sql, [vacancy_id, organization_id]);
  },

  /**
   * Get applicants by stage
   */
  async findByStage(stage, organization_id) {
    const sql = `
      SELECT 
        id,
        full_name,
        email,
        phone,
        vacancy_id,
        created_at
      FROM client_applicants
      WHERE current_stage = ?
        AND organization_id = ?
        AND is_deleted = 0
      ORDER BY created_at DESC
    `;

    return await query(sql, [stage, organization_id]);
  },

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(organization_id) {
    const stages = [
      APPLICANT_STAGES.APPLIED,
      APPLICANT_STAGES.SCREENING,
      APPLICANT_STAGES.SHORTLISTED,
      APPLICANT_STAGES.INTERVIEW_SCHEDULED,
      APPLICANT_STAGES.INTERVIEWED,
      APPLICANT_STAGES.SELECTED,
      APPLICANT_STAGES.OFFERED,
      APPLICANT_STAGES.HIRED,
      APPLICANT_STAGES.REJECTED,
    ];

    const stageCounts = {};
    
    for (const stage of stages) {
      const sql = `
        SELECT COUNT(*) as count
        FROM client_applicants
        WHERE current_stage = ?
          AND organization_id = ?
          AND is_deleted = 0
      `;
      const rows = await query(sql, [stage, organization_id]);
      stageCounts[stage] = rows[0].count;
    }

    // Get total applicants
    const totalSql = `
      SELECT COUNT(*) as total
      FROM client_applicants
      WHERE organization_id = ?
        AND is_deleted = 0
    `;
    const totalRows = await query(totalSql, [organization_id]);
    stageCounts.total_applicants = totalRows[0].total;

    return stageCounts;
  },

  /**
   * Get recent applicants
   */
  async getRecent(organization_id, limit = 10) {
    const sql = `
      SELECT 
        a.id,
        a.full_name,
        a.email,
        a.phone,
        a.current_stage,
        a.application_date,
        v.job_title,
        v.vacancy_code
      FROM client_applicants a
      LEFT JOIN client_job_vacancies v ON a.vacancy_id = v.id
      WHERE a.organization_id = ?
        AND a.is_deleted = 0
      ORDER BY a.created_at DESC
      LIMIT ?
    `;

    return await query(sql, [organization_id, limit]);
  },

  /**
   * Generate unique applicant code
   */
  async generateCode(organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_applicants
      WHERE organization_id = ?
    `;

    const rows = await query(sql, [organization_id]);
    const count = rows[0].count + 1;
    return `APP-${String(count).padStart(3, '0')}`;
  },

  /**
   * Get filter options (for frontend dropdowns)
   */
  async getFilterOptions(organization_id) {
    const options = {};

    // Get distinct cities
    const citySql = `
      SELECT DISTINCT current_city as value
      FROM client_applicants
      WHERE organization_id = ?
        AND is_deleted = 0
        AND current_city IS NOT NULL
      ORDER BY current_city
    `;
    options.cities = await query(citySql, [organization_id]);

    // Get distinct states
    const stateSql = `
      SELECT DISTINCT current_state as value
      FROM client_applicants
      WHERE organization_id = ?
        AND is_deleted = 0
        AND current_state IS NOT NULL
      ORDER BY current_state
    `;
    options.states = await query(stateSql, [organization_id]);

    // Get distinct qualifications
    const qualSql = `
      SELECT DISTINCT highest_qualification as value
      FROM client_applicants
      WHERE organization_id = ?
        AND is_deleted = 0
        AND highest_qualification IS NOT NULL
      ORDER BY highest_qualification
    `;
    options.qualifications = await query(qualSql, [organization_id]);

    return options;
  },
};

export default applicantRepository;