const authService = require('../services/authService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.userId || req.user.id);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      res.status(200).json({ data: { message: 'Logged out successfully.' } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
