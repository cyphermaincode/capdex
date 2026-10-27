const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const departmentRoutes = require('./departmentRoutes');
const jobRoleRoutes = require('./jobRoleRoutes');
const parameterRoutes = require('./parameterRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const growthGoalRoutes = require('./growthGoalRoutes');
const reportRoutes = require('./reportRoutes');

const parameterController = require('../controllers/parameterController');
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

// Mount resource routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/job-roles', jobRoleRoutes);
router.use('/parameters', parameterRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/growth-goals', growthGoalRoutes);
router.use('/reports', reportRoutes);

// Direct top-level endpoint aliases required by Section 8 of PRD:
// 1. PATCH /api/change-requests/:id (HR) & GET /api/change-requests
router.get('/change-requests', authenticate, authorize(ROLES.HR, ROLES.MANAGER), parameterController.getChangeRequests);
router.patch('/change-requests/:id', authenticate, authorize(ROLES.HR), parameterController.updateChangeRequest);

// 2. PATCH /api/promotion-readiness/:employeeId (HR / Manager)
router.patch('/promotion-readiness/:employeeId', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.updatePromotionReadiness);

module.exports = router;
