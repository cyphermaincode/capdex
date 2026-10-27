const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

router.get('/', authenticate, userController.getUsers);
router.post('/', authenticate, authorize(ROLES.HR), userController.createUser);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, authorize(ROLES.HR), userController.deactivateUser);

module.exports = router;
