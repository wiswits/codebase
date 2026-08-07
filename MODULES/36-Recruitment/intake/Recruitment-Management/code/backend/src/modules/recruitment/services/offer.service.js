import offerRepository from '../repositories/offer.repository.js';
import applicantRepository from '../repositories/applicant.repository.js';
import vacancyRepository from '../repositories/vacancy.repository.js';
import { APPLICANT_STAGES, OFFER_STATUS } from '../../../config/constants.js';
import { audit } from '../../../middleware/auth.mock.js';  // ✅ CORRECTED

export const offerService = {
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

    if (!data.offer_reference) {
      data.offer_reference = await offerRepository.generateReference(data.organization_id);
    }

    const offerId = await offerRepository.create({
      ...data,
      created_by: req.user.id,
    });

    await applicantRepository.update(data.applicant_id, data.organization_id, {
      current_stage: APPLICANT_STAGES.OFFERED,
      updated_by: req.user.id,
    });

    await audit(
      req,
      'offer.created',
      'offer_letter',
      offerId,
      {
        applicant_id: data.applicant_id,
        vacancy_id: data.vacancy_id,
        offer_reference: data.offer_reference,
        salary: data.salary,
      }
    );

    const offer = await offerRepository.findById(offerId, data.organization_id);
    return offer;
  },

  async findById(id, organization_id) {
    const offer = await offerRepository.findById(id, organization_id);
    if (!offer) {
      throw new Error('Offer not found');
    }
    return offer;
  },

  async findAll(organization_id, filters = {}) {
    const [items, total] = await Promise.all([
      offerRepository.findAll(organization_id, filters),
      offerRepository.count(organization_id, filters),
    ]);

    return {
      items,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  },

  async update(id, organization_id, data, req) {
    const existing = await offerRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Offer not found');
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
    const updated = await offerRepository.update(id, organization_id, data);

    if (!updated) {
      throw new Error('Failed to update offer');
    }

    await audit(
      req,
      'offer.updated',
      'offer_letter',
      id,
      { old: existing, updates: data }
    );

    const offer = await offerRepository.findById(id, organization_id);
    return offer;
  },

  async delete(id, organization_id, req) {
    const existing = await offerRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Offer not found');
    }

    const deleted = await offerRepository.delete(id, organization_id, req.user.id);

    if (!deleted) {
      throw new Error('Failed to delete offer');
    }

    await audit(
      req,
      'offer.deleted',
      'offer_letter',
      id,
      { offer_reference: existing.offer_reference }
    );

    return true;
  },

  async updateStatus(id, organization_id, status, accepted_on, req) {
    const existing = await offerRepository.findById(id, organization_id);
    if (!existing) {
      throw new Error('Offer not found');
    }

    if (!Object.values(OFFER_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updateData = {
      status,
      updated_by: req.user.id,
    };

    if (status === OFFER_STATUS.ACCEPTED) {
      updateData.accepted_on = accepted_on || new Date().toISOString().split('T')[0];
      
      await applicantRepository.update(existing.applicant_id, organization_id, {
        current_stage: APPLICANT_STAGES.HIRED,
        status: 'Hired',
        updated_by: req.user.id,
      });
    }

    if (status === OFFER_STATUS.REJECTED) {
      await applicantRepository.update(existing.applicant_id, organization_id, {
        current_stage: APPLICANT_STAGES.REJECTED,
        status: 'Rejected',
        updated_by: req.user.id,
      });
    }

    const updated = await offerRepository.update(id, organization_id, updateData);

    if (!updated) {
      throw new Error('Failed to update offer status');
    }

    await audit(
      req,
      'offer.status_updated',
      'offer_letter',
      id,
      {
        old_status: existing.status,
        new_status: status,
        accepted_on: updateData.accepted_on || null,
      }
    );

    const offer = await offerRepository.findById(id, organization_id);
    return offer;
  },

  async findByApplicant(applicant_id, organization_id) {
    const applicantExists = await applicantRepository.exists(
      applicant_id,
      organization_id
    );
    if (!applicantExists) {
      throw new Error('Applicant not found');
    }
    return await offerRepository.findByApplicant(applicant_id, organization_id);
  },

  async getStats(organization_id) {
    return await offerRepository.getStats(organization_id);
  },

  async findByStatus(status, organization_id) {
    if (!Object.values(OFFER_STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    return await offerRepository.findByStatus(status, organization_id);
  },

  async validateReference(offer_reference, organization_id, excludeId = null) {
    return true;
  },
};

export default offerService;