import { query } from '../../../config/database.js';
import { INTERVIEW_STATUS } from '../../../config/constants.js';

/**
 * Interview Repository
 * Handles all database operations for interviews
 */
export const interviewRepository = {
  /**
   * Create a new interview
   */
  async create(data) {
    const {
      organization_id,
      applicant_id,
      vacancy_id,
      interview_round,
      interview_type,
      interview_mode,
      interview_date,
      start_time,
      end_time,
      venue,
      meeting_link,
      interviewer_name,
      interviewer_email,
      interviewer_designation,
      rating,
      feedback,
      recommendation,
      status = INTERVIEW_STATUS.SCHEDULED,
      remarks,
      created_by,
    } = data;

    const sql = `
      INSERT INTO client_interviews (
        organization_id,
        applicant_id,
        vacancy_id,
        interview_round,
        interview_type,
        interview_mode,
        interview_date,
        start_time,
        end_time,
        venue,
        meeting_link,
        interviewer_name,
        interviewer_email,
        interviewer_designation,
        rating,
        feedback,
        recommendation,
        status,
        remarks,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id,
      applicant_id,
      vacancy_id,
      interview_round || 1,
      interview_type,
      interview_mode,
      interview_date,
      start_time,
      end_time || null,
      venue || null,
      meeting_link || null,
      interviewer_name,
      interviewer_email || null,
      interviewer_designation || null,
      rating || null,
      feedback || null,
      recommendation || null,
      status,
      remarks || null,
      created_by,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Get interview by ID with organization isolation
   */
  async findById(id, organization_id) {
    const sql = `
      SELECT 
        i.*,
        a.full_name as applicant_name,
        a.email as applicant_email,
        a.phone as applicant_phone,
        v.job_title,
        v.vacancy_code,
        v.department
      FROM client_interviews i
      LEFT JOIN client_applicants a ON i.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON i.vacancy_id = v.id
      WHERE i.id = ?
        AND i.organization_id = ?
        AND i.is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0] || null;
  },

  /**
   * Get all interviews with filters
   */
  async findAll(organization_id, filters = {}) {
    const {
      applicant_id,
      vacancy_id,
      status,
      interview_type,
      interview_mode,
      from_date,
      to_date,
      interviewer_name,
      limit = 50,
      offset = 0,
      sort_by = 'interview_date',
      sort_order = 'DESC',
    } = filters;

    let sql = `
      SELECT 
        i.id,
        i.applicant_id,
        i.vacancy_id,
        i.interview_round,
        i.interview_type,
        i.interview_mode,
        i.interview_date,
        i.start_time,
        i.end_time,
        i.venue,
        i.meeting_link,
        i.interviewer_name,
        i.interviewer_email,
        i.interviewer_designation,
        i.rating,
        i.feedback,
        i.recommendation,
        i.status,
        i.remarks,
        i.created_at,
        i.updated_at,
        a.full_name as applicant_name,
        a.email as applicant_email,
        v.job_title,
        v.vacancy_code
      FROM client_interviews i
      LEFT JOIN client_applicants a ON i.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON i.vacancy_id = v.id
      WHERE i.organization_id = ?
        AND i.is_deleted = 0
    `;

    const params = [organization_id];

    if (applicant_id) {
      sql += ` AND i.applicant_id = ?`;
      params.push(applicant_id);
    }

    if (vacancy_id) {
      sql += ` AND i.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (interview_type) {
      sql += ` AND i.interview_type = ?`;
      params.push(interview_type);
    }

    if (interview_mode) {
      sql += ` AND i.interview_mode = ?`;
      params.push(interview_mode);
    }

    if (interviewer_name) {
      sql += ` AND i.interviewer_name LIKE ?`;
      params.push(`%${interviewer_name}%`);
    }

    if (from_date) {
      sql += ` AND i.interview_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND i.interview_date <= ?`;
      params.push(to_date);
    }

    // Sorting
    const allowedSortColumns = ['interview_date', 'start_time', 'created_at', 'status', 'interview_type'];
    const safeSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'interview_date';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY i.${safeSortBy} ${safeSortOrder}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await query(sql, params);
  },

  /**
   * Get total count of interviews with filters
   */
  async count(organization_id, filters = {}) {
    const {
      applicant_id,
      vacancy_id,
      status,
      interview_type,
      interview_mode,
      from_date,
      to_date,
      interviewer_name,
    } = filters;

    let sql = `
      SELECT COUNT(*) as total
      FROM client_interviews i
      WHERE i.organization_id = ?
        AND i.is_deleted = 0
    `;

    const params = [organization_id];

    if (applicant_id) {
      sql += ` AND i.applicant_id = ?`;
      params.push(applicant_id);
    }

    if (vacancy_id) {
      sql += ` AND i.vacancy_id = ?`;
      params.push(vacancy_id);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (interview_type) {
      sql += ` AND i.interview_type = ?`;
      params.push(interview_type);
    }

    if (interview_mode) {
      sql += ` AND i.interview_mode = ?`;
      params.push(interview_mode);
    }

    if (interviewer_name) {
      sql += ` AND i.interviewer_name LIKE ?`;
      params.push(`%${interviewer_name}%`);
    }

    if (from_date) {
      sql += ` AND i.interview_date >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sql += ` AND i.interview_date <= ?`;
      params.push(to_date);
    }

    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Update an interview
   */
  async update(id, organization_id, data) {
    const fields = [];
    const params = [];

    const fieldMap = {
      applicant_id: 'applicant_id = ?',
      vacancy_id: 'vacancy_id = ?',
      interview_round: 'interview_round = ?',
      interview_type: 'interview_type = ?',
      interview_mode: 'interview_mode = ?',
      interview_date: 'interview_date = ?',
      start_time: 'start_time = ?',
      end_time: 'end_time = ?',
      venue: 'venue = ?',
      meeting_link: 'meeting_link = ?',
      interviewer_name: 'interviewer_name = ?',
      interviewer_email: 'interviewer_email = ?',
      interviewer_designation: 'interviewer_designation = ?',
      rating: 'rating = ?',
      feedback: 'feedback = ?',
      recommendation: 'recommendation = ?',
      status: 'status = ?',
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
      UPDATE client_interviews
      SET ${fields.join(', ')}
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const result = await query(sql, params);
    return result.affectedRows > 0;
  },

  /**
   * Soft delete an interview
   */
  async delete(id, organization_id, deleted_by) {
    const sql = `
      UPDATE client_interviews
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
   * Check if interview exists
   */
  async exists(id, organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_interviews
      WHERE id = ? 
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [id, organization_id]);
    return rows[0].count > 0;
  },

  /**
   * Get upcoming interviews
   */
  async getUpcoming(organization_id, limit = 10) {
    const sql = `
      SELECT 
        i.id,
        i.applicant_id,
        i.interview_date,
        i.start_time,
        i.interview_type,
        i.interview_mode,
        i.interviewer_name,
        a.full_name as applicant_name,
        a.email as applicant_email,
        v.job_title,
        v.vacancy_code
      FROM client_interviews i
      LEFT JOIN client_applicants a ON i.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON i.vacancy_id = v.id
      WHERE i.organization_id = ?
        AND i.is_deleted = 0
        AND i.status = 'Scheduled'
        AND i.interview_date >= CURDATE()
      ORDER BY i.interview_date ASC, i.start_time ASC
      LIMIT ?
    `;

    return await query(sql, [organization_id, limit]);
  },

  /**
   * Get interview by applicant
   */
  async findByApplicant(applicant_id, organization_id) {
    const sql = `
      SELECT 
        i.*,
        v.job_title,
        v.vacancy_code
      FROM client_interviews i
      LEFT JOIN client_job_vacancies v ON i.vacancy_id = v.id
      WHERE i.applicant_id = ?
        AND i.organization_id = ?
        AND i.is_deleted = 0
      ORDER BY i.interview_date DESC, i.start_time DESC
    `;

    return await query(sql, [applicant_id, organization_id]);
  },

  /**
   * Get interview statistics
   */
  async getStats(organization_id) {
    const sql = `
      SELECT 
        COUNT(*) as total_interviews,
        SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'Rescheduled' THEN 1 ELSE 0 END) as rescheduled,
        SUM(CASE WHEN status = 'No Show' THEN 1 ELSE 0 END) as no_show,
        AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating
      FROM client_interviews
      WHERE organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [organization_id]);
    return rows[0] || {
      total_interviews: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
      no_show: 0,
      avg_rating: null,
    };
  },
};

export default interviewRepository;