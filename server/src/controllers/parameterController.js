const parameterService = require('../services/parameterService');

class ParameterController {
  async getParameters(req, res, next) {
    try {
      const parameters = await parameterService.getParameters(req.query.jobRoleId, req.user);
      res.status(200).json({ data: parameters });
    } catch (err) {
      next(err);
    }
  }

  async createParameter(req, res, next) {
    try {
      const { jobRoleId, name, weightage } = req.body;
      const parameter = await parameterService.createParameter({
        jobRoleId,
        name,
        weightage,
        userId: req.user.userId
      });
      res.status(201).json({ data: parameter });
    } catch (err) {
      next(err);
    }
  }

  async updateParameter(req, res, next) {
    try {
      const parameter = await parameterService.updateParameter(req.params.id, req.body);
      res.status(200).json({ data: parameter });
    } catch (err) {
      next(err);
    }
  }

  async submitChangeRequest(req, res, next) {
    try {
      const { request_text } = req.body;
      const request = await parameterService.submitChangeRequest(
        req.params.id,
        req.user.userId,
        request_text
      );
      res.status(201).json({ data: request });
    } catch (err) {
      next(err);
    }
  }

  async getChangeRequests(req, res, next) {
    try {
      const requests = await parameterService.getChangeRequests(req.user);
      res.status(200).json({ data: requests });
    } catch (err) {
      next(err);
    }
  }

  async updateChangeRequest(req, res, next) {
    try {
      const { status } = req.body;
      const request = await parameterService.updateChangeRequest(req.params.id, status);
      res.status(200).json({ data: request });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ParameterController();
