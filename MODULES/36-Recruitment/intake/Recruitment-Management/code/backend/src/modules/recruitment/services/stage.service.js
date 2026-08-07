import stageRepository from '../repositories/stage.repository.js';
import applicantRepository from '../repositories/applicant.repository.js';
import vacancyRepository from '../repositories/vacancy.repository.js';
import { audit } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED

export const stageService = {
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

    const stageId = await stageRepository.create({
      ...data,
      changed_by: req.user.id,
      created_by: req.user.id,
    });

    await audit(
      req,
      'stage.created',
      'applicant_stage',
      stageId,
      {
        applicant_id: data.applicant_id,
        from_stage: data.from_stage,
        to_stage: data.to_stage,
      }
    );

    return stageId;
  },

  async findByApplicant(applicant_id, organization_id) {
    const applicantExists = await applicantRepository.exists(
      applicant_id,
      organization_id
    );
    if (!applicantExists) {
      throw new Error('Applicant not found');
    }
    return await stageRepository.findByApplicant(applicant_id, organization_id);
  },

  async findByVacancy(vacancy_id, organization_id) {
    const vacancyExists = await vacancyRepository.exists(
      vacancy_id,
      organization_id
    );
    if (!vacancyExists) {
      throw new Error('Vacancy not found');
    }
    return await stageRepository.findByVacancy(vacancy_id, organization_id);
  },

  async getStageStats(organization_id) {
    return await stageRepository.getStageStats(organization_id);
  },

  async getAverageStageDuration(organization_id) {
    return await stageRepository.getAverageStageDuration(organization_id);
  },

  async getTransitionFlow(organization_id) {
    return await stageRepository.getTransitionFlow(organization_id);
  },

  async getApplicantStageHistory(applicant_id, organization_id) {
    const applicantExists = await applicantRepository.exists(
      applicant_id,
      organization_id
    );
    if (!applicantExists) {
      throw new Error('Applicant not found');
    }
    return await stageRepository.getApplicantStageHistory(applicant_id, organization_id);
  },

  async getTransitions(organization_id, from_date, to_date, req) {
    await audit(
      req,
      'stage.report_viewed',
      'stage_transition',
      null,
      { from_date, to_date }
    );
    return await stageRepository.getTransitions(organization_id, from_date, to_date);
  },
};

export default stageService;