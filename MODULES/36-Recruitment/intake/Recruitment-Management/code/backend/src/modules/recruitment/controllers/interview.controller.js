import interviewService from '../services/interview.service.js';
import interviewValidation from '../validators/interview.validator.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
} from '../../../utils/response.js';

/**
 * Interview Controller
 * Handles HTTP requests for interviews
 */
export const interviewController = {
  /**
   * Schedule a new interview
   * POST /api/recruitment/interviews
   */
  async create(req, res) {
    try {
      const { error, value } = interviewValidation.create.validate(req.body);
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

      const interview = await interviewService.create(data, req);
      return successResponse(
        res,
        interview,
        'Interview scheduled successfully',
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
   * Get interview by ID
   * GET /api/recruitment/interviews/:id
   */
  async findById(req, res) {
    try {
      const { error, value } = interviewValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const interview = await interviewService.findById(
        value.id,
        req.user.org_id
      );

      return successResponse(
        res,
        interview,
        'Interview retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Interview not found') {
        return notFoundResponse(res, 'Interview');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get all interviews with filters
   * GET /api/recruitment/interviews
   */
  async findAll(req, res) {
    try {
      const { error, value } = interviewValidation.queryFilters.validate(req.query);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const result = await interviewService.findAll(
        req.user.org_id,
        value
      );

      return successResponse(
        res,
        result,
        'Interviews retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update an interview
   * PUT /api/recruitment/interviews/:id
   */
  async update(req, res) {
    try {
      const { error: paramError, value: paramValue } = 
        interviewValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      const { error: bodyError, value: bodyValue } = 
        interviewValidation.update.validate(req.body);
      if (bodyError) {
        return validationErrorResponse(
          res,
          bodyError.details.map(d => d.message)
        );
      }

      const interview = await interviewService.update(
        paramValue.id,
        req.user.org_id,
        bodyValue,
        req
      );

      return successResponse(
        res,
        interview,
        'Interview updated successfully'
      );
    } catch (error) {
      if (error.message === 'Interview not found') {
        return notFoundResponse(res, 'Interview');
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
   * Delete an interview (soft delete)
   * DELETE /api/recruitment/interviews/:id
   */
  async delete(req, res) {
    try {
      const { error, value } = interviewValidation.idParam.validate(req.params);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      await interviewService.delete(
        value.id,
        req.user.org_id,
        req
      );

      return successResponse(
        res,
        null,
        'Interview deleted successfully'
      );
    } catch (error) {
      if (error.message === 'Interview not found') {
        return notFoundResponse(res, 'Interview');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Update interview status
   * PATCH /api/recruitment/interviews/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { error: paramError, value: paramValue } = 
        interviewValidation.idParam.validate(req.params);
      if (paramError) {
        return validationErrorResponse(
          res,
          paramError.details.map(d => d.message)
        );
      }

      const { status, feedback, rating, recommendation } = req.body;
      if (!status) {
        return validationErrorResponse(res, ['Status is required']);
      }

      const interview = await interviewService.updateStatus(
        paramValue.id,
        req.user.org_id,
        status,
        feedback,
        rating,
        recommendation,
        req
      );

      return successResponse(
        res,
        interview,
        'Interview status updated successfully'
      );
    } catch (error) {
      if (error.message === 'Interview not found') {
        return notFoundResponse(res, 'Interview');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get upcoming interviews
   * GET /api/recruitment/interviews/upcoming
   */
  async getUpcoming(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const interviews = await interviewService.getUpcoming(
        req.user.org_id,
        limit
      );

      return successResponse(
        res,
        interviews,
        'Upcoming interviews retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get interviews by applicant
   * GET /api/recruitment/interviews/applicant/:applicantId
   */
  async findByApplicant(req, res) {
    try {
      const { applicantId } = req.params;
      if (!applicantId) {
        return validationErrorResponse(res, ['Applicant ID is required']);
      }

      const interviews = await interviewService.findByApplicant(
        parseInt(applicantId),
        req.user.org_id
      );

      return successResponse(
        res,
        interviews,
        'Interviews retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get interview statistics
   * GET /api/recruitment/interviews/stats
   */
  async getStats(req, res) {
    try {
      const stats = await interviewService.getStats(req.user.org_id);
      return successResponse(
        res,
        stats,
        'Interview statistics retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },
};

export default interviewController;