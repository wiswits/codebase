import stageService from '../services/stage.service.js';
import stageValidation from '../validators/stage.validator.js';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
} from '../../../utils/response.js';

/**
 * Stage Controller
 * Handles HTTP requests for applicant stage history
 */
export const stageController = {
  /**
   * Create stage history entry
   * POST /api/recruitment/stages
   */
  async create(req, res) {
    try {
      const { error, value } = stageValidation.create.validate(req.body);
      if (error) {
        return validationErrorResponse(
          res,
          error.details.map(d => d.message)
        );
      }

      const data = {
        ...value,
        organization_id: req.user.org_id,
      };

      const stageId = await stageService.create(data, req);
      
      return successResponse(
        res,
        { id: stageId },
        'Stage history created successfully',
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
   * Get stage history by applicant
   * GET /api/recruitment/stages/applicant/:applicantId
   */
  async findByApplicant(req, res) {
    try {
      const { applicantId } = req.params;
      if (!applicantId) {
        return validationErrorResponse(res, ['Applicant ID is required']);
      }

      const stages = await stageService.findByApplicant(
        parseInt(applicantId),
        req.user.org_id
      );

      return successResponse(
        res,
        stages,
        'Stage history retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get stage history by vacancy
   * GET /api/recruitment/stages/vacancy/:vacancyId
   */
  async findByVacancy(req, res) {
    try {
      const { vacancyId } = req.params;
      if (!vacancyId) {
        return validationErrorResponse(res, ['Vacancy ID is required']);
      }

      const stages = await stageService.findByVacancy(
        parseInt(vacancyId),
        req.user.org_id
      );

      return successResponse(
        res,
        stages,
        'Stage history retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Vacancy not found') {
        return notFoundResponse(res, 'Vacancy');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get stage statistics
   * GET /api/recruitment/stages/stats
   */
  async getStageStats(req, res) {
    try {
      const stats = await stageService.getStageStats(req.user.org_id);
      return successResponse(
        res,
        stats,
        'Stage statistics retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get average stage duration
   * GET /api/recruitment/stages/average-duration
   */
  async getAverageDuration(req, res) {
    try {
      const durations = await stageService.getAverageStageDuration(req.user.org_id);
      return successResponse(
        res,
        durations,
        'Average stage duration retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get transition flow
   * GET /api/recruitment/stages/transition-flow
   */
  async getTransitionFlow(req, res) {
    try {
      const flow = await stageService.getTransitionFlow(req.user.org_id);
      return successResponse(
        res,
        flow,
        'Transition flow retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get applicant stage history with durations
   * GET /api/recruitment/stages/applicant/:applicantId/history
   */
  async getApplicantHistory(req, res) {
    try {
      const { applicantId } = req.params;
      if (!applicantId) {
        return validationErrorResponse(res, ['Applicant ID is required']);
      }

      const history = await stageService.getApplicantStageHistory(
        parseInt(applicantId),
        req.user.org_id
      );

      return successResponse(
        res,
        history,
        'Applicant stage history retrieved successfully'
      );
    } catch (error) {
      if (error.message === 'Applicant not found') {
        return notFoundResponse(res, 'Applicant');
      }
      return errorResponse(res, error.message, 400);
    }
  },

  /**
   * Get stage transitions for date range
   * GET /api/recruitment/stages/transitions
   */
  async getTransitions(req, res) {
    try {
      const { from_date, to_date } = req.query;
      if (!from_date || !to_date) {
        return validationErrorResponse(res, ['From date and to date are required']);
      }

      const transitions = await stageService.getTransitions(
        req.user.org_id,
        from_date,
        to_date,
        req
      );

      return successResponse(
        res,
        transitions,
        'Stage transitions retrieved successfully'
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  },
};

export default stageController;