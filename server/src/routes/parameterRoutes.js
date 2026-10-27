const express = require('express');
const router = express.Router();
const parameterController = require('../controllers/parameterController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/', authenticate, authorize(ROLES.HR, ROLES.MANAGER), parameterController.getParameters);
router.post('/', authenticate, authorize(ROLES.HR), parameterController.createParameter);
router.put('/:id', authenticate, authorize(ROLES.HR), parameterController.updateParameter);
router.post('/:id/change-request', authenticate, authorize(ROLES.MANAGER), parameterController.submitChangeRequest);

module.exports = router;
