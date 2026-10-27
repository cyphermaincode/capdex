const jobRoleService = require('../services/jobRoleService');

class JobRoleController {
  async getJobRoles(req, res, next) {
    try {
      const jobRoles = await jobRoleService.getJobRoles(req.query.departmentId, req.user);
      res.status(200).json({ data: jobRoles });
    } catch (err) {
      next(err);
    }
  }

  async createJobRole(req, res, next) {
    try {
      const jobRole = await jobRoleService.createJobRole(req.body);
      res.status(201).json({ data: jobRole });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new JobRoleController();
