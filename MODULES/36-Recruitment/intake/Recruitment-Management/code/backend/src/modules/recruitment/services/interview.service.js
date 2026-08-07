import interviewRepository from '../repositories/interview.repository.js';
import applicantRepository from '../repositories/applicant.repository.js';
import vacancyRepository from '../repositories/vacancy.repository.js';
import { APPLICANT_STAGES } from '../../../config/constants.js';
import { audit } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED

export const interviewService = {
  async create(data, req) {
    const applicantExists = await applicantRepository.exists(
      data.applicant_id,
      data.organization_id
    );
    if (!applicantExists) {
      throw new Error('Applicant not found');
    }

    const vacancyExists = await vacancyRepository.exists(
      data.vacancy_id,
      data.organization_id
    );
    if (!vacancyExists) {
      throw new Error('Vacancy not found');
    }

    const interviewId = await interviewRepository.create({
      ...data,
      created_by: req.user.id,
    });

    await applicantRepository.update(data.applicant_id, data.organization_id, {
      current_stage: APPLICANT_STAGES.INTERVIEW_SCHEDULED,
      updated_by: req.user.id,
    });

    await audit(
      req,
      'interview.scheduled',
      'interview',
      interviewId,
      {
        applicant_id: data.applicant_id,
        vacancy_id: data.vacancy_id,
        interview_date: data.interview_date,
        interviewer: data.interviewer_name,
      }
    );

    const interview = await interviewRepository.findById(interviewId, data.organization_id);
    return interview;
  },

  async findById(id, organization_id) {
    const interview = await interviewRepository.findById(id, organization_id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    return interview;
  },

  async findAll(organization_id, filters = {}) {
    const [items, total] = await Promise.all([
      interviewRepository.findAll(organization_id, filters),
      interviewRepository.count(organization_id, filters),
    ]);

    return {
      items,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },

  async update(id, organization_id, data, req) {
    const existing = await interviewRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Interview not found');
    }

    if (data.applicant_id && data.applicant_id !== existing.applicant_id) {
      const applicantExists = await applicantRepository.exists(
        data.applicant_id,
        organization_id
      );
      if (!applicantExists) {
        throw new Error('Applicant not found');
      }
    }

    if (data.vacancy_id && data.vacancy_id !== existing.vacancy_id) {
      const vacancyExists = await vacancyRepository.exists(
        data.vacancy_id,
        organization_id
      );
      if (!vacancyExists) {
        throw new Error('Vacancy not found');
      }
    }

    data.updated_by = req.user.id;
    const updated = await interviewRepository.update(id, organization_id, data);

    if (!updated) {
      throw new Error('Failed to update interview');
    }

    await audit(
      req,
      'interview.updated',
      'interview',
      id,
      { old: existing, updates: data }
    );

    const interview = await interviewRepository.findById(id, organization_id);
    return interview;
  },

  async delete(id, organization_id, req) {
    const existing = await interviewRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Interview not found');
    }

    const deleted = await interviewRepository.delete(id, organization_id, req.user.id);

    if (!deleted) {
      throw new Error('Failed to delete interview');
    }

    await audit(
      req,
      'interview.deleted',
      'interview',
      id,
      { applicant_id: existing.applicant_id, interview_date: existing.interview_date }
    );

    return true;
  },

  async updateStatus(id, organization_id, status, feedback, rating, recommendation, req) {
    const existing = await interviewRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Interview not found');
    }

    const updated = await interviewRepository.update(id, organization_id, {
      status,
      feedback: feedback || existing.feedback,
      rating: rating !== undefined ? rating : existing.rating,
      recommendation: recommendation || existing.recommendation,
      updated_by: req.user.id,
    });

    if (!updated) {
      throw new Error('Failed to update interview status');
    }

    if (status === 'Completed') {
      await applicantRepository.update(existing.applicant_id, organization_id, {
        current_stage: APPLICANT_STAGES.INTERVIEWED,
        updated_by: req.user.id,
      });
    }

    await audit(
      req,
      'interview.status_updated',
      'interview',
      id,
      {
        old_status: existing.status,
        new_status: status,
        feedback,
        rating,
        recommendation,
      }
    );

    const interview = await interviewRepository.findById(id, organization_id);
    return interview;
  },

  async getUpcoming(organization_id, limit = 10) {
    return await interviewRepository.getUpcoming(organization_id, limit);
  },

  async findByApplicant(applicant_id, organization_id) {
    const applicantExists = await applicantRepository.exists(
      applicant_id,
      organization_id
    );
    if (!applicantExists) {
      throw new Error('Applicant not found');
    }
    return await interviewRepository.findByApplicant(applicant_id, organization_id);
  },

  async getStats(organization_id) {
    return await interviewRepository.getStats(organization_id);
  },
};

export default interviewService;