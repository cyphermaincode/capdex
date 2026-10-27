const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.post('/', authenticate, authorize(ROLES.HR), evaluationController.createEvaluation);
router.get('/', authenticate, evaluationController.getEvaluations);
router.get('/team', authenticate, authorize(ROLES.MANAGER), evaluationController.getTeamEvaluations);
router.post('/chat', authenticate, feedbackController.chatWithCoach);
router.get('/:id', authenticate, evaluationController.getEvaluationById);
router.patch('/:id/acknowledge', authenticate, authorize(ROLES.EMPLOYEE), evaluationController.acknowledgeEvaluation);
router.post('/:id/comments', authenticate, authorize(ROLES.MANAGER), evaluationController.addManagerComment);

// Appraisal Date Modification Routes (HR Only)
router.patch('/:id/cycle-date', authenticate, authorize(ROLES.HR), evaluationController.updateEvaluationDate);
router.patch('/employee/:employeeId/cycle-date', authenticate, authorize(ROLES.HR), evaluationController.updateEmployeeAppraisalDate);

// AI Feedback & Interactive Coach nested routes
router.get('/:id/feedback', authenticate, feedbackController.getFeedback);
router.post('/:id/feedback/regenerate', authenticate, authorize(ROLES.EMPLOYEE, ROLES.HR), feedbackController.regenerateFeedback);
router.post('/:id/chat', authenticate, feedbackController.chatWithCoach);

module.exports = router;
