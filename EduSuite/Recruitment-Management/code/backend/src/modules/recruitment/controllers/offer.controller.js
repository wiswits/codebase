import offerService from '../services/offer.service.js';
import offerValidation from '../validators/offer.validator.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
} from '../../../utils/response.js';

/**
 * Offer Controller
 * Handles HTTP requests for offer letters
 */
export const offerController = {
  /**
   * Create a new offer
   * POST /api/recruitment/offers
   */
  async create(req, res) {
    try {
      const { error, value } = offerValidation.create.validate(req.body);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const data = {
        ...value,
        organization_id: req.user.org_id,
        created_by: req.user.id,
      };

      const offer = await offerService.create(data, req);
      return successResponse(
        res,
        offer,
        'Offer created successfully',
        201
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get offer by ID
   * GET /api/recruitment/offers/:id
   */
  async findById(req, res) {
    try {
      const { error, value } = offerValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const offer = await offerService.findById(
        value.id,
        req.user.org_id
      );

      return successResponse(
        res,
        offer,
        'Offer retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Offer not found') {
        return notFoundResponse(res, 'Offer');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get all offers with filters
   * GET /api/recruitment/offers
   */
  async findAll(req, res) {
    try {
      const { error, value } = offerValidation.queryFilters.validate(req.query);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const result = await offerService.findAll(
        req.user.org_id,
        value
      );

      return successResponse(
        res,
        result,
        'Offers retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update an offer
   * PUT /api/recruitment/offers/:id
   */
  async update(req, res) {
    try {
      const { error: paramError, value: paramValue } = 
        offerValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      const { error: bodyError, value: bodyValue } = 
        offerValidation.update.validate(req.body);
      if (bodyError) {
        return validationErrorResponse(
          res,
          bodyError.details.map(d => d.message)
        );
      }

      const offer = await offerService.update(
        paramValue.id,
        req.user.org_id,
        bodyValue,
        req
      );

      return successResponse(
        res,
        offer,
        'Offer updated successfully'
      );
    } catch (error) {
      if (error.message === 'Offer not found') {
        return notFoundResponse(res, 'Offer');
      }
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Delete an offer (soft delete)
   * DELETE /api/recruitment/offers/:id
   */
  async delete(req, res) {
    try {
      const { error, value } = offerValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      await offerService.delete(
        value.id,
        req.user.org_id,
        req
      );

      return successResponse(
        res,
        null,
        'Offer deleted successfully'
      );
    } catch (error) {
      if (error.message === 'Offer not found') {
        return notFoundResponse(res, 'Offer');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update offer status
   * PATCH /api/recruitment/offers/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { error: paramError, value: paramValue } = 
        offerValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      const { status, accepted_on } = req.body;
      if (!status) {
        return validationErrorResponse(res, ['Status is required']);
      }

      const offer = await offerService.updateStatus(
        paramValue.id,
        req.user.org_id,
        status,
        accepted_on,
        req
      );

      return successResponse(
        res,
        offer,
        'Offer status updated successfully'
      );
    } catch (error) {
      if (error.message === 'Offer not found') {
        return notFoundResponse(res, 'Offer');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get offers by applicant
   * GET /api/recruitment/offers/applicant/:applicantId
   */
  async findByApplicant(req, res) {
    try {
      const { applicantId } = req.params;
      if (!applicantId) {
        return validationErrorResponse(res, ['Applicant ID is required']);
      }

      const offers = await offerService.findByApplicant(
        parseInt(applicantId),
        req.user.org_id
      );

      return successResponse(
        res,
        offers,
        'Offers retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get offer statistics
   * GET /api/recruitment/offers/stats
   */
  async getStats(req, res) {
    try {
      const stats = await offerService.getStats(req.user.org_id);
      return successResponse(
        res,
        stats,
        'Offer statistics retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get offers by status
   * GET /api/recruitment/offers/by-status/:status
   */
  async findByStatus(req, res) {
    try {
      const { status } = req.params;
      if (!status) {
        return validationErrorResponse(res, ['Status is required']);
      }

      const offers = await offerService.findByStatus(
        status,
        req.user.org_id
      );

      return successResponse(
        res,
        offers,
        'Offers retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },
};

export default offerController;