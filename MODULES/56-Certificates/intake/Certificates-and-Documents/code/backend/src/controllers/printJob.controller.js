const PrintJobModel = require('../models/PrintJob.model');
const DocumentModel = require('../models/Document.model');
const { auditLog } = require('../services/audit.service');
const { logger } = require('../utils/logger');

class PrintJobController {
  static async createPrintJob(req, res) {
    try {
      const { documentIds, jobType, priority, printerName } = req.body;
      const { userId, orgId } = req.user;

      if (!documentIds || !documentIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Document IDs are required'
        });
      }

      const jobId = await PrintJobModel.create({
        orgId,
        documentIds,
        jobType,
        priority,
        printerName,
        createdBy: userId
      });

      const job = await PrintJobModel.findById(jobId, orgId);

      await auditLog({
        orgId,
        userId,
        action: 'CREATE_PRINT_JOB',
        resourceType: 'print_job',
        resourceId: jobId,
        newValue: { documentCount: documentIds.length, jobType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error('Create print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPrintJobs(req, res) {
    try {
      const { orgId } = req.user;
      const { status, limit = 50, offset = 0 } = req.query;

      const jobs = await PrintJobModel.getPrintJobsByOrg(orgId, {
        status
      }, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: jobs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Get print jobs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPrintQueue(req, res) {
    try {
      const { orgId } = req.user;
      const jobs = await PrintJobModel.getPrintQueue(orgId);

      res.json({
        success: true,
        data: jobs
      });

    } catch (error) {
      logger.error('Get print queue error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPrintJob(req, res) {
    try {
      const { jobId } = req.params;
      const { orgId } = req.user;

      const job = await PrintJobModel.findById(jobId, orgId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Print job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error('Get print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async startPrintJob(req, res) {
    try {
      const { jobId } = req.params;
      const { userId, orgId } = req.user;

      const started = await PrintJobModel.startJob(jobId, orgId);
      if (!started) {
        return res.status(400).json({
          success: false,
          error: 'Cannot start this job'
        });
      }

      await auditLog({
        orgId,
        userId,
        action: 'START_PRINT',
        resourceType: 'print_job',
        resourceId: jobId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const job = await PrintJobModel.findById(jobId, orgId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error('Start print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async completePrintJob(req, res) {
    try {
      const { jobId } = req.params;
      const { userId, orgId } = req.user;

      const completed = await PrintJobModel.completeJob(jobId, orgId);
      if (!completed) {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete this job'
        });
      }

      const job = await PrintJobModel.findById(jobId, orgId);
      if (job && job.document_ids) {
        const docIds = JSON.parse(job.document_ids);
        for (const docId of docIds) {
          await DocumentModel.updateStatus(docId, orgId, 'printed');
        }
      }

      await auditLog({
        orgId,
        userId,
        action: 'COMPLETE_PRINT',
        resourceType: 'print_job',
        resourceId: jobId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const updatedJob = await PrintJobModel.findById(jobId, orgId);

      res.json({
        success: true,
        data: updatedJob
      });

    } catch (error) {
      logger.error('Complete print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async failPrintJob(req, res) {
    try {
      const { jobId } = req.params;
      const { errorMessage } = req.body;
      const { userId, orgId } = req.user;

      const failed = await PrintJobModel.failJob(jobId, orgId, errorMessage);
      if (!failed) {
        return res.status(400).json({
          success: false,
          error: 'Cannot fail this job'
        });
      }

      await auditLog({
        orgId,
        userId,
        action: 'FAIL_PRINT',
        resourceType: 'print_job',
        resourceId: jobId,
        newValue: { errorMessage },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const job = await PrintJobModel.findById(jobId, orgId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error('Fail print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async cancelPrintJob(req, res) {
    try {
      const { jobId } = req.params;
      const { userId, orgId } = req.user;

      const cancelled = await PrintJobModel.cancelJob(jobId, orgId);
      if (!cancelled) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel this job'
        });
      }

      await auditLog({
        orgId,
        userId,
        action: 'CANCEL_PRINT',
        resourceType: 'print_job',
        resourceId: jobId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const job = await PrintJobModel.findById(jobId, orgId);

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      logger.error('Cancel print job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getPrintStats(req, res) {
    try {
      const { orgId } = req.user;
      const stats = await PrintJobModel.getPrintStats(orgId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Get print stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = PrintJobController;