import vacancyService from '../services/vacancy.service.js';
import vacancyValidation from '../validators/vacancy.validator.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  forbiddenResponse 
} from '../../../utils/response.js';

/**
 * Vacancy Controller
 * Handles HTTP requests for job vacancies
 */
export const vacancyController = {
  /**
   * Create a new vacancy
   * POST /api/recruitment/vacancies
   */
  async create(req, res) {
    try {
      // Validate request body
      const { error, value } = vacancyValidation.create.validate(req.body);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      // Add organization and user context
      const data = {
        ...value,
        organization_id: req.user.org_id,
        created_by: req.user.id,
      };

      const vacancy = await vacancyService.create(data, req);
      return successResponse(
        res,
        vacancy,
        'Vacancy created successfully',
        201
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get vacancy by ID
   * GET /api/recruitment/vacancies/:id
   */
  async findById(req, res) {
    try {
      // Validate params
      const { error, value } = vacancyValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const vacancy = await vacancyService.findById(
        value.id,
        req.user.org_id
      );

      return successResponse(
        res,
        vacancy,
        'Vacancy retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get all vacancies with filters
   * GET /api/recruitment/vacancies
   */
  async findAll(req, res) {
    try {
      // Validate query params
      const { error, value } = vacancyValidation.queryFilters.validate(req.query);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const result = await vacancyService.findAll(
        req.user.org_id,
        value
      );

      return successResponse(
        res,
        result,
        'Vacancies retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update a vacancy
   * PUT /api/recruitment/vacancies/:id
   */
  async update(req, res) {
    try {
      // Validate params
      const { error: paramError, value: paramValue } = 
        vacancyValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = 
        vacancyValidation.update.validate(req.body);
      if (bodyError) {
        return validationErrorResponse(
          res,
          bodyError.details.map(d => d.message)
        );
      }

      const vacancy = await vacancyService.update(
        paramValue.id,
        req.user.org_id,
        bodyValue,
        req
      );

      return successResponse(
        res,
        vacancy,
        'Vacancy updated successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Delete a vacancy (soft delete)
   * DELETE /api/recruitment/vacancies/:id
   */
  async delete(req, res) {
    try {
      // Validate params
      const { error, value } = vacancyValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      await vacancyService.delete(
        value.id,
        req.user.org_id,
        req
      );

      return successResponse(
        res,
        null,
        'Vacancy deleted successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Change vacancy status
   * PATCH /api/recruitment/vacancies/:id/status
   */
  async changeStatus(req, res) {
    try {
      // Validate params
      const { error: paramError, value: paramValue } = 
        vacancyValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      // Validate status
      const { status } = req.body;
      if (!status) {
        return validationErrorResponse(res, ['Status is required']);
      }

      const vacancy = await vacancyService.changeStatus(
        paramValue.id,
        req.user.org_id,
        status,
        req
      );

      return successResponse(
        res,
        vacancy,
        'Vacancy status updated successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get dashboard statistics
   * GET /api/recruitment/dashboard
   */
  async getStats(req, res) {
    try {
      const stats = await vacancyService.getStats(req.user.org_id);
      return successResponse(
        res,
        stats,
        'Dashboard statistics retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get recent vacancies
   * GET /api/recruitment/vacancies/recent
   */
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const vacancies = await vacancyService.getRecent(
        req.user.org_id,
        limit
      );
      return successResponse(
        res,
        vacancies,
        'Recent vacancies retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Validate vacancy code
   * GET /api/recruitment/vacancies/validate-code
   */
  async validateCode(req, res) {
    try {
      const { code, excludeId } = req.query;
      if (!code) {
        return validationErrorResponse(res, ['Vacancy code is required']);
      }

      const isUnique = await vacancyService.validateCode(
        code,
        req.user.org_id,
        excludeId ? parseInt(excludeId) : null
      );

      return successResponse(
        res,
        { isUnique },
        'Vacancy code validation completed'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },
};

export default vacancyController;