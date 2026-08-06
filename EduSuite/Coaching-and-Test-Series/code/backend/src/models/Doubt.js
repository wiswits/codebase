// ============================================
// DOUBT MODEL
// ============================================

const { query } = require('../config/database');
const { DOUBT_STATUS, SLA } = require('../utils/constants');

class Doubt {
    constructor(data = {}) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.subject = data.subject;
        this.title = data.title;
        this.description = data.description;
        this.file_url = data.file_url;
        this.question_id = data.question_id;
        this.status = data.status || DOUBT_STATUS.PENDING;
        this.assigned_to = data.assigned_to;
        this.assigned_at = data.assigned_at;
        this.resolved_by = data.resolved_by;
        this.resolved_at = data.resolved_at;
        this.acknowledged_at = data.acknowledged_at;
        this.sla_acknowledge_deadline = data.sla_acknowledge_deadline;
        this.sla_resolve_deadline = data.sla_resolve_deadline;
        this.sla_breached = data.sla_breached || false;
        this.upvotes = data.upvotes || 0;
        this.downvotes = data.downvotes || 0;
        this.parent_doubt_id = data.parent_doubt_id;
        this.resolution_rating = data.resolution_rating;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // ============================================
    // STATIC METHODS
    // ============================================
    static async findById(id) {
        const result = await query(
            `SELECT d.*, 
                    s.student_code,
                    u.first_name || ' ' || u.last_name as student_name,
                    f2.first_name || ' ' || f2.last_name as assigned_to_name
             FROM doubts d
             JOIN students s ON d.student_id = s.id
             JOIN users u ON s.user_id = u.id
             LEFT JOIN faculty f ON d.assigned_to = f.id
             LEFT JOIN users f2 ON f.user_id = f2.id
             WHERE d.id = $1`,
            [id]
        );
        return result.rows[0] ? new Doubt(result.rows[0]) : null;
    }

    static async findAll(options = {}) {
        const { limit = 50, offset = 0, status, student_id, assigned_to } = options;
        let queryText = `
            SELECT d.*, 
                   s.student_code,
                   u.first_name || ' ' || u.last_name as student_name,
                   f2.first_name || ' ' || f2.last_name as assigned_to_name
            FROM doubts d
            JOIN students s ON d.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN faculty f ON d.assigned_to = f.id
            LEFT JOIN users f2 ON f.user_id = f2.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` AND d.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (student_id) {
            queryText += ` AND d.student_id = $${paramIndex}`;
            params.push(student_id);
            paramIndex++;
        }

        if (assigned_to) {
            queryText += ` AND d.assigned_to = $${paramIndex}`;
            params.push(assigned_to);
            paramIndex++;
        }

        queryText += ` ORDER BY d.sla_resolve_deadline ASC, d.created_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Doubt(row));
    }

    static async getQueue(options = {}) {
        const { status, assigned_to, limit = 50, offset = 0 } = options;
        let queryText = `
            SELECT d.*, 
                   s.student_code,
                   u.first_name || ' ' || u.last_name as student_name,
                   u.email as student_email,
                   f2.first_name || ' ' || f2.last_name as assigned_to_name
            FROM doubts d
            JOIN students s ON d.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN faculty f ON d.assigned_to = f.id
            LEFT JOIN users f2 ON f.user_id = f2.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` AND d.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (assigned_to) {
            queryText += ` AND d.assigned_to = $${paramIndex}`;
            params.push(assigned_to);
            paramIndex++;
        }

        queryText += ` ORDER BY d.sla_resolve_deadline ASC, d.created_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows.map(row => new Doubt(row));
    }

    // ============================================
    // INSTANCE METHODS
    // ============================================
    async save() {
        if (this.id) {
            const result = await query(
                `UPDATE doubts SET
                    subject = $1,
                    title = $2,
                    description = $3,
                    file_url = $4,
                    question_id = $5,
                    status = $6,
                    assigned_to = $7,
                    assigned_at = $8,
                    resolved_by = $9,
                    resolved_at = $10,
                    acknowledged_at = $11,
                    sla_breached = $12,
                    upvotes = $13,
                    downvotes = $14,
                    resolution_rating = $15,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $16
                 RETURNING *`,
                [this.subject, this.title, this.description,
                 this.file_url, this.question_id, this.status,
                 this.assigned_to, this.assigned_at,
                 this.resolved_by, this.resolved_at,
                 this.acknowledged_at, this.sla_breached,
                 this.upvotes, this.downvotes,
                 this.resolution_rating, this.id]
            );
            if (result.rows.length === 0) return null;
            Object.assign(this, result.rows[0]);
            return this;
        } else {
            const slaAcknowledge = new Date();
            slaAcknowledge.setHours(slaAcknowledge.getHours() + SLA.ACKNOWLEDGE);
            const slaResolve = new Date();
            slaResolve.setHours(slaResolve.getHours() + SLA.RESOLVE);

            const result = await query(
                `INSERT INTO doubts (
                    student_id, subject, title, description, file_url, question_id,
                    status, sla_acknowledge_deadline, sla_resolve_deadline,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
                RETURNING *`,
                [this.student_id, this.subject, this.title,
                 this.description, this.file_url, this.question_id,
                 this.status || DOUBT_STATUS.PENDING,
                 slaAcknowledge, slaResolve]
            );
            Object.assign(this, result.rows[0]);
            return this;
        }
    }

    async assignTo(facultyId) {
        this.assigned_to = facultyId;
        this.assigned_at = new Date();
        this.acknowledged_at = new Date();
        this.status = DOUBT_STATUS.ASSIGNED;
        return await this.save();
    }

    async resolve(facultyId) {
        this.resolved_by = facultyId;
        this.resolved_at = new Date();
        this.status = DOUBT_STATUS.RESOLVED;
        return await this.save();
    }

    async rate(rating) {
        this.resolution_rating = rating;
        return await this.save();
    }

    async upvote() {
        this.upvotes += 1;
        return await this.save();
    }

    async downvote() {
        this.downvotes += 1;
        return await this.save();
    }

    async checkSLA() {
        const now = new Date();
        if (this.sla_resolve_deadline && this.sla_resolve_deadline < now && this.status !== DOUBT_STATUS.RESOLVED) {
            this.sla_breached = true;
            await this.save();
            return true;
        }
        return false;
    }

    async getReplies() {
        const result = await query(
            `SELECT dr.*, u.first_name, u.last_name, u.role
             FROM doubt_replies dr
             JOIN users u ON dr.user_id = u.id
             WHERE dr.doubt_id = $1
             ORDER BY dr.created_at ASC`,
            [this.id]
        );
        return result.rows;
    }

    async addReply(userId, message, fileUrl = null, isFaculty = false) {
        const result = await query(
            `INSERT INTO doubt_replies (doubt_id, user_id, message, file_url, is_faculty_response)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [this.id, userId, message, fileUrl, isFaculty]
        );
        return result.rows[0];
    }

    // ============================================
    // HELPERS
    // ============================================
    toJSON() {
        return { ...this };
    }
}

module.exports = Doubt;