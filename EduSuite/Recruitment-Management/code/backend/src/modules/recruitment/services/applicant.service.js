import applicantRepository from '../repositories/applicant.repository.js';
import vacancyRepository from '../repositories/vacancy.repository.js';
import stageRepository from '../repositories/stage.repository.js';
import { APPLICANT_STAGES, APPLICANT_STATUS } from '../../../config/constants.js';
import { audit } from '../../../middleware/auth.mock.js';  

export const applicantService = {
  async create(data, req) {
    const vacancyExists = await vacancyRepository.exists(
      data.vacancy_id,
      data.organization_id
    );
    if (!vacancyExists) {
      throw new Error('Vacancy not found');
    }

    const isEmailUnique = await applicantRepository.isEmailUnique(
      data.email,
      data.organization_id
    );
    if (!isEmailUnique) {
      throw new Error(`Email '${data.email}' is already registered`);
    }

    if (!data.applicant_code) {
      data.applicant_code = await applicantRepository.generateCode(
        data.organization_id
      );
    }

    if (!data.full_name) {
      data.full_name = `${data.first_name} ${data.last_name || ''}`.trim();
    }

    if (!data.application_date) {
      data.application_date = new Date().toISOString().split('T')[0];
    }

    const applicantId = await applicantRepository.create(data);

    await stageRepository.create({
      organization_id: data.organization_id,
      applicant_id: applicantId,
      vacancy_id: data.vacancy_id,
      from_stage: null,
      to_stage: data.current_stage || APPLICANT_STAGES.APPLIED,
      changed_by: req.user.id,
      remarks: 'Applicant created',
      created_by: req.user.id,
    });

    await audit(
      req,
      'applicant.created',
      'applicant',
      applicantId,
      { 
        applicant_code: data.applicant_code,
        email: data.email,
        full_name: data.full_name,
        stage: data.current_stage
      }
    );

    const applicant = await applicantRepository.findById(applicantId, data.organization_id);
    return applicant;
  },

  async bulkImport(applicantsData, organization_id, req) {
    const results = {
      total: applicantsData.length,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
    };

    const validatedApplicants = [];
    const validationErrors = [];

    for (let i = 0; i < applicantsData.length; i++) {
      const applicant = applicantsData[i];
      try {
        const vacancyExists = await vacancyRepository.exists(
          applicant.vacancy_id,
          organization_id
        );
        if (!vacancyExists) {
          validationErrors.push({
            row: i + 1,
            email: applicant.email || `Row ${i + 1}`,
            error: `Vacancy ID ${applicant.vacancy_id} not found`,
          });
          continue;
        }

        const isEmailUnique = await applicantRepository.isEmailUnique(
          applicant.email,
          organization_id
        );
        if (!isEmailUnique) {
          validationErrors.push({
            row: i + 1,
            email: applicant.email,
            error: 'Email already exists',
          });
          continue;
        }

        const applicantCode = await applicantRepository.generateCode(organization_id);
        const fullName = `${applicant.first_name} ${applicant.last_name || ''}`.trim();

        validatedApplicants.push({
          ...applicant,
          organization_id,
          applicant_code: applicantCode,
          full_name: fullName,
          application_date: applicant.application_date || new Date().toISOString().split('T')[0],
          current_stage: applicant.current_stage || APPLICANT_STAGES.APPLIED,
          status: APPLICANT_STATUS.ACTIVE,
          created_by: req.user.id,
        });
      } catch (error) {
        validationErrors.push({
          row: i + 1,
          email: applicant.email || `Row ${i + 1}`,
          error: error.message,
        });
      }
    }

    if (validationErrors.length > 0) {
      results.failed = validationErrors.length;
      results.errors = validationErrors;
      return results;
    }

    const insertedCount = await applicantRepository.bulkCreate(validatedApplicants);

    for (const applicant of validatedApplicants) {
      const created = await applicantRepository.findAll(organization_id, {
        email: applicant.email,
        limit: 1,
      });

      if (created.length > 0) {
        await stageRepository.create({
          organization_id,
          applicant_id: created[0].id,
          vacancy_id: applicant.vacancy_id,
          from_stage: null,
          to_stage: applicant.current_stage,
          changed_by: req.user.id,
          remarks: 'Bulk import',
          created_by: req.user.id,
        });

        await audit(
          req,
          'applicant.bulk_imported',
          'applicant',
          created[0].id,
          {
            applicant_code: applicant.applicant_code,
            email: applicant.email,
            full_name: applicant.full_name,
          }
        );
      }
    }

    results.successful = insertedCount;
    results.failed = applicantsData.length - insertedCount;
    results.created = validatedApplicants.map(a => ({
      email: a.email,
      name: a.full_name,
      applicant_code: a.applicant_code,
    }));

    return results;
  },

  async findById(id, organization_id) {
    const applicant = await applicantRepository.findById(id, organization_id);
    if (!applicant) {
      throw new Error('Applicant not found');
    }
    return applicant;
  },

  async findAll(organization_id, filters = {}) {
    const [items, total] = await Promise.all([
      applicantRepository.findAll(organization_id, filters),
      applicantRepository.count(organization_id, filters),
    ]);

    return {
      items,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },

  async update(id, organization_id, data, req) {
    const existing = await applicantRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Applicant not found');
    }

    if (data.email && data.email !== existing.email) {
      const isEmailUnique = await applicantRepository.isEmailUnique(
        data.email,
        organization_id,
        id
      );
      if (!isEmailUnique) {
        throw new Error(`Email '${data.email}' is already registered`);
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

    if (data.current_stage && data.current_stage !== existing.current_stage) {
      await stageRepository.create({
        organization_id,
        applicant_id: id,
        vacancy_id: existing.vacancy_id,
        from_stage: existing.current_stage,
        to_stage: data.current_stage,
        changed_by: req.user.id,
        remarks: data.remarks || 'Stage updated',
        created_by: req.user.id,
      });
    }

    data.updated_by = req.user.id;
    const updated = await applicantRepository.update(id, organization_id, data);

    if (!updated) {
      throw new Error('Failed to update applicant');
    }

    await audit(
      req,
      'applicant.updated',
      'applicant',
      id,
      { old: existing, updates: data }
    );

    const applicant = await applicantRepository.findById(id, organization_id);
    return applicant;
  },

  async delete(id, organization_id, req) {
    const existing = await applicantRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Applicant not found');
    }

    const deleted = await applicantRepository.delete(id, organization_id, req.user.id);

    if (!deleted) {
      throw new Error('Failed to delete applicant');
    }

    await audit(
      req,
      'applicant.deleted',
      'applicant',
      id,
      { email: existing.email, full_name: existing.full_name }
    );

    return true;
  },

  async changeStage(id, organization_id, stage, remarks, req) {
    const existing = await applicantRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Applicant not found');
    }

    if (!Object.values(APPLICANT_STAGES).includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    await stageRepository.create({
      organization_id,
      applicant_id: id,
      vacancy_id: existing.vacancy_id,
      from_stage: existing.current_stage,
      to_stage: stage,
      changed_by: req.user.id,
      remarks: remarks || 'Stage changed',
      created_by: req.user.id,
    });

    const updated = await applicantRepository.update(id, organization_id, {
      current_stage: stage,
      updated_by: req.user.id,
    });

    if (!updated) {
      throw new Error('Failed to update applicant stage');
    }

    await audit(
      req,
      'applicant.stage_changed',
      'applicant',
      id,
      { from_stage: existing.current_stage, to_stage: stage, remarks }
    );

    const applicant = await applicantRepository.findById(id, organization_id);
    return applicant;
  },

  async getPipelineStats(organization_id) {
    return await applicantRepository.getPipelineStats(organization_id);
  },

  async getRecent(organization_id, limit = 10) {
    return await applicantRepository.getRecent(organization_id, limit);
  },

  async getFilterOptions(organization_id) {
    return await applicantRepository.getFilterOptions(organization_id);
  },

  async findByVacancy(vacancy_id, organization_id) {
    const vacancyExists = await vacancyRepository.exists(vacancy_id, organization_id);
    if (!vacancyExists) {
      throw new Error('Vacancy not found');
    }
    return await applicantRepository.findByVacancy(vacancy_id, organization_id);
  },

  async findByStage(stage, organization_id) {
    if (!Object.values(APPLICANT_STAGES).includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }
    return await applicantRepository.findByStage(stage, organization_id);
  },

  async validateEmail(email, organization_id, excludeId = null) {
    return await applicantRepository.isEmailUnique(email, organization_id, excludeId);
  },
};

export default applicantService;