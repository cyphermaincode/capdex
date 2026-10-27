const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/', authenticate, authorize(ROLES.HR, ROLES.MANAGER), departmentController.getDepartments);
router.get('/:id', authenticate, authorize(ROLES.HR, ROLES.MANAGER), departmentController.getDepartmentById);
router.post('/', authenticate, authorize(ROLES.HR), departmentController.createDepartment);
router.put('/:id', authenticate, authorize(ROLES.HR), departmentController.updateDepartment);

module.exports = router;
