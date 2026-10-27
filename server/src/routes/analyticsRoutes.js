const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/organization', authenticate, authorize(ROLES.HR), analyticsController.getOrganizationAnalytics);
router.get('/team', authenticate, authorize(ROLES.MANAGER), analyticsController.getTeamAnalytics);
router.get('/promotion-readiness', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.getPromotionReadiness);
router.patch('/promotion-readiness/:employeeId', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.updatePromotionReadiness);
router.get('/talent-decision/:employeeId', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.getTalentDecisionAnalysis);

// Promotion Pipeline Routes
router.post('/nominate-promotion/:employeeId', authenticate, authorize(ROLES.MANAGER, ROLES.HR), analyticsController.nominatePromotion);
router.post('/approve-promotion/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.approvePromotion);
router.post('/reject-promotion/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.rejectPromotion);
router.get('/promotion-notification', authenticate, analyticsController.getEmployeePromotionNotification);
router.post('/acknowledge-promotion', authenticate, analyticsController.acknowledgePromotion);

// PIP Pipeline Routes
router.post('/assign-pip/:employeeId', authenticate, authorize(ROLES.MANAGER, ROLES.HR), analyticsController.assignPIP);
router.post('/resolve-pip/:employeeId', authenticate, authorize(ROLES.MANAGER, ROLES.HR), analyticsController.resolvePIP);

// Demotion Pipeline Routes
router.post('/propose-demotion/:employeeId', authenticate, authorize(ROLES.MANAGER, ROLES.HR), analyticsController.proposeDemotion);
router.post('/approve-demotion/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.approveDemotion);
router.post('/decline-demotion/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.declineDemotion);

// Layoff / Separation Pipeline Routes
router.post('/propose-layoff/:employeeId', authenticate, authorize(ROLES.MANAGER, ROLES.HR), analyticsController.proposeLayoff);
router.get('/pending-layoffs', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.getPendingLayoffs);
router.get('/pending-talent-actions', authenticate, authorize(ROLES.HR, ROLES.MANAGER), analyticsController.getPendingTalentActions);
router.post('/approve-layoff/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.approveLayoff);
router.post('/decline-layoff/:employeeId', authenticate, authorize(ROLES.HR), analyticsController.declineLayoff);

module.exports = router;
