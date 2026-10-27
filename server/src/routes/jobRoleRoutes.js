const express = require('express');
const router = express.Router();
const jobRoleController = require('../controllers/jobRoleController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/', authenticate, authorize(ROLES.HR, ROLES.MANAGER), jobRoleController.getJobRoles);
router.post('/', authenticate, authorize(ROLES.HR), jobRoleController.createJobRole);

module.exports = router;
