const departmentService = require('../services/departmentService');

class DepartmentController {
  async getDepartments(req, res, next) {
    try {
      const departments = await departmentService.getDepartments(req.user);
      res.status(200).json({ data: departments });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentById(req, res, next) {
    try {
      const department = await departmentService.getDepartmentById(req.params.id, req.user);
      res.status(200).json({ data: department });
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const department = await departmentService.createDepartment(req.body);
      res.status(201).json({ data: department });
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const department = await departmentService.updateDepartment(req.params.id, req.body);
      res.status(200).json({ data: department });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentController();
