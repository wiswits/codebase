import { query } from '../../../config/database.js';
import { APPLICANT_STAGES } from '../../../config/constants.js';

/**
 * Stage Repository
 * Handles all database operations for applicant stage history
 */
export const stageRepository = {
  /**
   * Create a stage history entry
   */
  async create(data) {
    const {
      organization_id,
      applicant_id,
      vacancy_id,
      from_stage,
      to_stage,
      changed_by,
      remarks,
      created_by,
    } = data;

    const sql = `
      INSERT INTO client_applicant_stages (
        organization_id,
        applicant_id,
        vacancy_id,
        from_stage,
        to_stage,
        changed_by,
        remarks,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id,
      applicant_id,
      vacancy_id,
      from_stage || null,
      to_stage,
      changed_by,
      remarks || null,
      created_by,
    ];

    const result = await query(sql, params);
    return result.insertId;
  },

  /**
   * Get stage history by applicant ID
   */
  async findByApplicant(applicant_id, organization_id) {
    const sql = `
      SELECT 
        s.id,
        s.applicant_id,
        s.vacancy_id,
        s.from_stage,
        s.to_stage,
        s.changed_by,
        s.remarks,
        s.changed_at,
        s.created_at,
        u.full_name as changed_by_name,
        v.job_title,
        v.vacancy_code
      FROM client_applicant_stages s
      LEFT JOIN client_applicants a ON s.applicant_id = a.id
      LEFT JOIN client_job_vacancies v ON s.vacancy_id = v.id
      LEFT JOIN users u ON s.changed_by = u.id
      WHERE s.applicant_id = ?
        AND s.organization_id = ?
        AND s.is_deleted = 0
      ORDER BY s.changed_at DESC
    `;

    return await query(sql, [applicant_id, organization_id]);
  },

  /**
   * Get stage history by vacancy
   */
  async findByVacancy(vacancy_id, organization_id) {
    const sql = `
      SELECT 
        s.id,
        s.applicant_id,
        s.from_stage,
        s.to_stage,
        s.changed_by,
        s.remarks,
        s.changed_at,
        a.full_name as applicant_name,
        a.email as applicant_email
      FROM client_applicant_stages s
      LEFT JOIN client_applicants a ON s.applicant_id = a.id
      WHERE s.vacancy_id = ?
        AND s.organization_id = ?
        AND s.is_deleted = 0
      ORDER BY s.changed_at DESC
    `;

    return await query(sql, [vacancy_id, organization_id]);
  },

  /**
   * Get stage transitions for a specific date range
   */
  async getTransitions(organization_id, from_date, to_date) {
    const sql = `
      SELECT 
        s.from_stage,
        s.to_stage,
        COUNT(*) as count,
        DATE(s.changed_at) as transition_date
      FROM client_applicant_stages s
      WHERE s.organization_id = ?
        AND s.is_deleted = 0
        AND s.changed_at >= ?
        AND s.changed_at <= ?
      GROUP BY s.from_stage, s.to_stage, DATE(s.changed_at)
      ORDER BY transition_date DESC, count DESC
    `;

    return await query(sql, [organization_id, from_date, to_date]);
  },

  /**
   * Get applicant's current stage with history
   */
  async getApplicantStageHistory(applicant_id, organization_id) {
    const sql = `
      SELECT 
        s.from_stage,
        s.to_stage,
        s.changed_by,
        s.remarks,
        s.changed_at,
        DATEDIFF(
          LEAD(s.changed_at) OVER (ORDER BY s.changed_at), 
          s.changed_at
        ) as days_in_stage
      FROM client_applicant_stages s
      WHERE s.applicant_id = ?
        AND s.organization_id = ?
        AND s.is_deleted = 0
      ORDER BY s.changed_at ASC
    `;

    return await query(sql, [applicant_id, organization_id]);
  },

  /**
   * Get stage statistics
   */
  async getStageStats(organization_id) {
    const stages = Object.values(APPLICANT_STAGES);
    const stats = {};

    for (const stage of stages) {
      const sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN DAY(changed_at) = DAY(CURRENT_DATE) THEN 1 ELSE 0 END) as today,
          SUM(CASE WHEN WEEK(changed_at) = WEEK(CURRENT_DATE) THEN 1 ELSE 0 END) as this_week,
          SUM(CASE WHEN MONTH(changed_at) = MONTH(CURRENT_DATE) THEN 1 ELSE 0 END) as this_month
        FROM client_applicant_stages
        WHERE organization_id = ?
          AND to_stage = ?
          AND is_deleted = 0
      `;
      
      const rows = await query(sql, [organization_id, stage]);
      stats[stage] = rows[0] || { total: 0, today: 0, this_week: 0, this_month: 0 };
    }

    return stats;
  },

  /**
   * Get average time spent in each stage
   */
  async getAverageStageDuration(organization_id) {
    const sql = `
      SELECT 
        from_stage,
        to_stage,
        AVG(TIMESTAMPDIFF(HOUR, changed_at, 
          LEAD(changed_at) OVER (PARTITION BY applicant_id ORDER BY changed_at)
        )) as avg_hours
      FROM client_applicant_stages
      WHERE organization_id = ?
        AND is_deleted = 0
      GROUP BY from_stage, to_stage
      HAVING avg_hours IS NOT NULL
      ORDER BY avg_hours DESC
    `;

    return await query(sql, [organization_id]);
  },

  /**
   * Check if applicant has stage history
   */
  async hasHistory(applicant_id, organization_id) {
    const sql = `
      SELECT COUNT(*) as count
      FROM client_applicant_stages
      WHERE applicant_id = ?
        AND organization_id = ?
        AND is_deleted = 0
    `;

    const rows = await query(sql, [applicant_id, organization_id]);
    return rows[0].count > 0;
  },

  /**
   * Get stage transition flow (for analytics)
   */
  async getTransitionFlow(organization_id) {
    const sql = `
      SELECT 
        from_stage,
        to_stage,
        COUNT(*) as transition_count,
        AVG(TIMESTAMPDIFF(HOUR, changed_at, 
          LEAD(changed_at) OVER (PARTITION BY applicant_id ORDER BY changed_at)
        )) as avg_hours_in_from_stage
      FROM client_applicant_stages
      WHERE organization_id = ?
        AND is_deleted = 0
        AND from_stage IS NOT NULL
      GROUP BY from_stage, to_stage
      ORDER BY transition_count DESC
    `;

    return await query(sql, [organization_id]);
  },
};

export default stageRepository;