const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const employeeController = require('../controllers/employee.controller');
const projectController = require('../controllers/project.controller');
const allocationController = require('../controllers/allocation.controller');
const capacityController = require('../controllers/capacity.controller');
const benchController = require('../controllers/bench.controller');
const reportController = require('../controllers/report.controller');
const analyticsController = require('../controllers/analytics.controller');

const { validateEmployee, validateProject, validateAllocation } = require('../validators/utilization.validator');

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard', dashboardController.getDashboard);
router.get('/dashboard/summary', dashboardController.getSummary);

// ============================================
// EMPLOYEES
// ============================================
router.get('/employees', employeeController.getAll);
router.get('/employees/:id', employeeController.getById);
router.post('/employees', validateEmployee, employeeController.create);
router.patch('/employees/:id', validateEmployee, employeeController.update);
router.delete('/employees/:id', employeeController.remove);

// ============================================
// PROJECTS
// ============================================
router.get('/projects', projectController.getAll);
router.get('/projects/:id', projectController.getById);
router.post('/projects', validateProject, projectController.create);
router.patch('/projects/:id', validateProject, projectController.update);
router.delete('/projects/:id', projectController.remove);

// ============================================
// ALLOCATIONS
// ============================================
router.get('/allocations', allocationController.getAll);
router.get('/allocations/:id', allocationController.getById);
router.post('/allocations', validateAllocation, allocationController.create);
router.patch('/allocations/:id', validateAllocation, allocationController.update);
router.delete('/allocations/:id', allocationController.remove);

// ============================================
// CAPACITY
// ============================================
router.get('/capacity', capacityController.getAll);
router.get('/capacity/:id', capacityController.getById);
router.post('/capacity', capacityController.create);
router.patch('/capacity/:id', capacityController.update);

// ============================================
// BENCH
// ============================================
router.get('/bench', benchController.getAll);
router.get('/bench/:id', benchController.getById);

// ============================================
// REPORTS
// ============================================
router.get('/reports', reportController.getAll);
router.get('/reports/monthly', reportController.getMonthly);
router.get('/reports/team', reportController.getTeam);
router.get('/reports/department', reportController.getDepartment);

// ============================================
// ANALYTICS
// ============================================
router.get('/analytics', analyticsController.getOverview);
router.get('/analytics/overview', analyticsController.getOverview);
router.get('/analytics/trends', analyticsController.getTrends);

module.exports = router;