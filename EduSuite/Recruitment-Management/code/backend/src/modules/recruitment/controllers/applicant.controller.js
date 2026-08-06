import applicantService from '../services/applicant.service.js';
import applicantValidation from '../validators/applicant.validator.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
} from '../../../utils/response.js';

/**
 * Applicant Controller
 * Handles HTTP requests for applicants including file uploads and bulk import
 */
export const applicantController = {
  /**
   * Create a new applicant
   * POST /api/recruitment/applicants
   */
  async create(req, res) {
    try {
      // Validate request body
      const { error, value } = applicantValidation.create.validate(req.body);
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

      const applicant = await applicantService.create(data, req);
      return successResponse(
        res,
        applicant,
        'Applicant created successfully',
        201
      );
    } catch (error) {
      if (error.message.includes('Vacancy not found')) {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Bulk import applicants from CSV
   * POST /api/recruitment/applicants/bulk-import
   */
  async bulkImport(req, res) {
    try {
      // Validate request body
      const { error, value } = applicantValidation.bulkImport.validate(req.body);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const result = await applicantService.bulkImport(
        value.applicants,
        req.user.org_id,
        req
      );

      if (result.failed > 0) {
        return res.status(207).json({
          success: true,
          statusCode: 207,
          message: `Bulk import completed with ${result.successful} successful and ${result.failed} failed`,
          data: result,
        });
      }

      return successResponse(
        res,
        result,
        `Successfully imported ${result.successful} applicants`
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get applicant by ID
   * GET /api/recruitment/applicants/:id
   */
  async findById(req, res) {
    try {
      // Validate params
      const { error, value } = applicantValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const applicant = await applicantService.findById(
        value.id,
        req.user.org_id
      );

      return successResponse(
        res,
        applicant,
        'Applicant retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get all applicants with advanced filters
   * GET /api/recruitment/applicants
   */
  async findAll(req, res) {
    try {
      // Validate query params
      const { error, value } = applicantValidation.queryFilters.validate(req.query);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const result = await applicantService.findAll(
        req.user.org_id,
        value
      );

      return successResponse(
        res,
        result,
        'Applicants retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update an applicant
   * PUT /api/recruitment/applicants/:id
   */
  async update(req, res) {
    try {
      // Validate params
      const { error: paramError, value: paramValue } = 
        applicantValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = 
        applicantValidation.update.validate(req.body);
      if (bodyError) {
        return validationErrorResponse(
          res,
          bodyError.details.map(d => d.message)
        );
      }

      const applicant = await applicantService.update(
        paramValue.id,
        req.user.org_id,
        bodyValue,
        req
      );

      return successResponse(
        res,
        applicant,
        'Applicant updated successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      if (error.message.includes('Vacancy not found')) {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Delete an applicant (soft delete)
   * DELETE /api/recruitment/applicants/:id
   */
  async delete(req, res) {
    try {
      // Validate params
      const { error, value } = applicantValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      await applicantService.delete(
        value.id,
        req.user.org_id,
        req
      );

      return successResponse(
        res,
        null,
        'Applicant deleted successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Change applicant stage
   * PATCH /api/recruitment/applicants/:id/stage
   */
  async changeStage(req, res) {
    try {
      // Validate params
      const { error: paramError, value: paramValue } = 
        applicantValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      // Validate body
      const { error: bodyError, value: bodyValue } = 
        applicantValidation.changeStage.validate(req.body);
      if (bodyError) {
        return validationErrorResponse(
          res,
          bodyError.details.map(d => d.message)
        );
      }

      const applicant = await applicantService.changeStage(
        paramValue.id,
        req.user.org_id,
        bodyValue.stage,
        bodyValue.remarks,
        req
      );

      return successResponse(
        res,
        applicant,
        'Applicant stage updated successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get pipeline statistics
   * GET /api/recruitment/applicants/pipeline/stats
   */
  async getPipelineStats(req, res) {
    try {
      const stats = await applicantService.getPipelineStats(req.user.org_id);
      return successResponse(
        res,
        stats,
        'Pipeline statistics retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get recent applicants
   * GET /api/recruitment/applicants/recent
   */
  async getRecent(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const applicants = await applicantService.getRecent(
        req.user.org_id,
        limit
      );
      return successResponse(
        res,
        applicants,
        'Recent applicants retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get filter options (for frontend dropdowns)
   * GET /api/recruitment/applicants/filter-options
   */
  async getFilterOptions(req, res) {
    try {
      const options = await applicantService.getFilterOptions(req.user.org_id);
      return successResponse(
        res,
        options,
        'Filter options retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get applicants by vacancy
   * GET /api/recruitment/applicants/by-vacancy/:vacancyId
   */
  async findByVacancy(req, res) {
    try {
      const { vacancyId } = req.params;
      if (!vacancyId) {
        return validationErrorResponse(res, ['Vacancy ID is required']);
      }

      const applicants = await applicantService.findByVacancy(
        parseInt(vacancyId),
        req.user.org_id
      );

      return successResponse(
        res,
        applicants,
        'Applicants retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get applicants by stage
   * GET /api/recruitment/applicants/by-stage/:stage
   */
  async findByStage(req, res) {
    try {
      const { stage } = req.params;
      if (!stage) {
        return validationErrorResponse(res, ['Stage is required']);
      }

      const applicants = await applicantService.findByStage(
        stage,
        req.user.org_id
      );

      return successResponse(
        res,
        applicants,
        'Applicants retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Validate email uniqueness
   * GET /api/recruitment/applicants/validate-email
   */
  async validateEmail(req, res) {
    try {
      const { email, excludeId } = req.query;
      if (!email) {
        return validationErrorResponse(res, ['Email is required']);
      }

      const isUnique = await applicantService.validateEmail(
        email,
        req.user.org_id,
        excludeId ? parseInt(excludeId) : null
      );

      return successResponse(
        res,
        { isUnique },
        'Email validation completed'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },
};

export default applicantController;