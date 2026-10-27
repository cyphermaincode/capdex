const evaluationService = require('../services/evaluationService');

class EvaluationController {
  async createEvaluation(req, res, next) {
    try {
      const evaluation = await evaluationService.createEvaluation(req.body, req.user.userId);
      res.status(201).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }

  async getEvaluationById(req, res, next) {
    try {
      const evaluation = await evaluationService.getEvaluationById(req.params.id, req.user);
      res.status(200).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }

  async getEvaluations(req, res, next) {
    try {
      const evaluations = await evaluationService.getEvaluations(req.query, req.user);
      res.status(200).json({ data: evaluations });
    } catch (err) {
      next(err);
    }
  }

  async getTeamEvaluations(req, res, next) {
    try {
      const evaluations = await evaluationService.getTeamEvaluations(req.user);
      res.status(200).json({ data: evaluations });
    } catch (err) {
      next(err);
    }
  }

  async acknowledgeEvaluation(req, res, next) {
    try {
      const evaluation = await evaluationService.acknowledgeEvaluation(req.params.id, req.user.userId);
      res.status(200).json({ data: evaluation });
    } catch (err) {
      next(err);
    }
  }

  async addManagerComment(req, res, next) {
    try {
      const { comment_text } = req.body;
      const comment = await evaluationService.addManagerComment(
        req.params.id,
        req.user.userId,
        comment_text,
        req.user.departmentId
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  }

  async updateEvaluationDate(req, res, next) {
    try {
      const { cycle_date } = req.body;
      const updated = await evaluationService.updateEvaluationDate(req.params.id, cycle_date, req.user);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateEmployeeAppraisalDate(req, res, next) {
    try {
      const { cycle_date } = req.body;
      const updated = await evaluationService.updateEmployeeAppraisalDate(req.params.employeeId, cycle_date, req.user);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EvaluationController();
