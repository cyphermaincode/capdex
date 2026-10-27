const growthGoalService = require('../services/growthGoalService');

class GrowthGoalController {
  async getGoals(req, res, next) {
    try {
      const goals = await growthGoalService.getGoals(req.query.employeeId, req.user);
      res.status(200).json({ data: goals });
    } catch (err) {
      next(err);
    }
  }

  async createGoal(req, res, next) {
    try {
      const goal = await growthGoalService.createGoal(req.body, req.user.userId);
      res.status(201).json({ data: goal });
    } catch (err) {
      next(err);
    }
  }

  async updateGoal(req, res, next) {
    try {
      const goal = await growthGoalService.updateGoal(req.params.id, req.body, req.user.userId);
      res.status(200).json({ data: goal });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GrowthGoalController();
