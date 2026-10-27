const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/export', authenticate, authorize(ROLES.HR, ROLES.MANAGER), reportController.exportReport);

module.exports = router;
