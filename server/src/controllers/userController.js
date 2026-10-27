const userService = require('../services/userService');

class UserController {
  async getUsers(req, res, next) {
    try {
      const users = await userService.getUsers(req.query, req.user);
      res.status(200).json({ data: users });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      const result = await userService.deactivateUser(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
