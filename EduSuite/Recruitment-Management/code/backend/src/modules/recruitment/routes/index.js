import express from 'express';
import vacancyRoutes from './vacancy.routes.js';
import applicantRoutes from './applicant.routes.js';
import stageRoutes from './stage.routes.js';
import interviewRoutes from './interview.routes.js';
import offerRoutes from './offer.routes.js';
import { authenticate } from '../../../middleware/auth.mock.js';

const router = express.Router();

router.use('/vacancies', vacancyRoutes);
router.use('/applicants', applicantRoutes);
router.use('/stages', stageRoutes);
router.use('/interviews', interviewRoutes);
router.use('/offers', offerRoutes);

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const vacancyService = (await import('../services/vacancy.service.js')).default;
    const applicantService = (await import('../services/applicant.service.js')).default;
    const interviewService = (await import('../services/interview.service.js')).default;
    const offerService = (await import('../services/offer.service.js')).default;

    const [vacancyStats, pipelineStats, interviewStats, offerStats] = await Promise.all([
      vacancyService.getStats(req.user.org_id),
      applicantService.getPipelineStats(req.user.org_id),
      interviewService.getStats(req.user.org_id),
      offerService.getStats(req.user.org_id),
    ]);

    res.json({
      success: true,
      statusCode: 200,
      message: 'Dashboard stats retrieved',
      data: {
        vacancies: {
          total: Number(vacancyStats.total_vacancies) || 0,
          open: Number(vacancyStats.open_vacancies) || 0,
          draft: Number(vacancyStats.draft_vacancies) || 0,
          on_hold: Number(vacancyStats.on_hold_vacancies) || 0,
          closed: Number(vacancyStats.closed_vacancies) || 0,
          cancelled: Number(vacancyStats.cancelled_vacancies) || 0,
          total_openings: Number(vacancyStats.total_openings) || 0,
        },
        applicants: {
          total: pipelineStats.total_applicants || 0,
          by_stage: pipelineStats,
        },
        interviews: {
          ...interviewStats,
          total: Number(interviewStats.total_interviews) || 0,
        },
        offers: {
          ...offerStats,
          total: Number(offerStats.total_offers) || 0,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
    });
  }
});

export default router;