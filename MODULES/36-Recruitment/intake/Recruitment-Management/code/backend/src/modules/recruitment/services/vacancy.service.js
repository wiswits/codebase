import vacancyRepository from '../repositories/vacancy.repository.js';
import { VACANCY_STATUS } from '../../../config/constants.js';
import { audit } from '../../../middleware/auth.mock.js';  // ✅ CHANGED - 3 levels up

export const vacancyService = {
  async create(data, req) {
    const isUnique = await vacancyRepository.isCodeUnique(
      data.vacancy_code,
      data.organization_id
    );

    if (!isUnique) {
      throw new Error(`Vacancy code '${data.vacancy_code}' already exists`);
    }

    const vacancyId = await vacancyRepository.create(data);

    await audit(
      req,
      'vacancy.created',
      'job_vacancy',
      vacancyId,
      { vacancy_code: data.vacancy_code, job_title: data.job_title }
    );

    const vacancy = await vacancyRepository.findById(vacancyId, data.organization_id);
    return vacancy;
  },

  async findById(id, organization_id) {
    const vacancy = await vacancyRepository.findById(id, organization_id);
    if (!vacancy) {
      throw new Error('Vacancy not found');
    }
    return vacancy;
  },

  async findAll(organization_id, filters = {}) {
    const [items, total] = await Promise.all([
      vacancyRepository.findAll(organization_id, filters),
      vacancyRepository.count(organization_id, filters),
    ]);

    return {
      items,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },

  async update(id, organization_id, data, req) {
    const exists = await vacancyRepository.exists(id, organization_id);
    if (!exists) {
      throw new Error('Vacancy not found');
    }

    if (data.vacancy_code) {
      const isUnique = await vacancyRepository.isCodeUnique(
        data.vacancy_code,
        organization_id,
        id
      );
      if (!isUnique) {
        throw new Error(`Vacancy code '${data.vacancy_code}' already exists`);
      }
    }

    const oldVacancy = await vacancyRepository.findById(id, organization_id);
    data.updated_by = req.user.id;
    const updated = await vacancyRepository.update(id, organization_id, data);

    if (!updated) {
      throw new Error('Failed to update vacancy');
    }

    await audit(
      req,
      'vacancy.updated',
      'job_vacancy',
      id,
      { old: oldVacancy, updates: data }
    );

    const vacancy = await vacancyRepository.findById(id, organization_id);
    return vacancy;
  },

  async delete(id, organization_id, req) {
    const exists = await vacancyRepository.exists(id, organization_id);
    if (!exists) {
      throw new Error('Vacancy not found');
    }

    const deleted = await vacancyRepository.delete(id, organization_id, req.user.id);

    if (!deleted) {
      throw new Error('Failed to delete vacancy');
    }

    await audit(
      req,
      'vacancy.deleted',
      'job_vacancy',
      id,
      { reason: 'Vacancy deleted' }
    );

    return true;
  },

  async changeStatus(id, organization_id, status, req) {
    const exists = await vacancyRepository.exists(id, organization_id);
    if (!exists) {
      throw new Error('Vacancy not found');
    }

    if (!Object.values(VACANCY_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const oldVacancy = await vacancyRepository.findById(id, organization_id);
    const updated = await vacancyRepository.update(id, organization_id, {
      status,
      updated_by: req.user.id,
    });

    if (!updated) {
      throw new Error('Failed to update vacancy status');
    }

    await audit(
      req,
      'vacancy.status_changed',
      'job_vacancy',
      id,
      { old_status: oldVacancy.status, new_status: status }
    );

    const vacancy = await vacancyRepository.findById(id, organization_id);
    return vacancy;
  },

  async getStats(organization_id) {
    return await vacancyRepository.getStats(organization_id);
  },

  async getRecent(organization_id, limit = 5) {
    return await vacancyRepository.getRecent(organization_id, limit);
  },

  async validateCode(vacancy_code, organization_id, excludeId = null) {
    return await vacancyRepository.isCodeUnique(vacancy_code, organization_id, excludeId);
  },
};

export default vacancyService;