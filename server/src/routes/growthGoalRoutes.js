const express = require('express');
const router = express.Router();
const growthGoalController = require('../controllers/growthGoalController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/', authenticate, growthGoalController.getGoals);
router.post('/', authenticate, authorize(ROLES.EMPLOYEE), growthGoalController.createGoal);
router.patch('/:id', authenticate, authorize(ROLES.EMPLOYEE), growthGoalController.updateGoal);

module.exports = router;
