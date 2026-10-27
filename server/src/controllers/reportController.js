const reportService = require('../services/reportService');

class ReportController {
  async exportReport(req, res, next) {
    try {
      const scope = req.query.scope || 'team';
      const csv = await reportService.exportCSV(scope, req.user);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=capdex_${scope}_report_${Date.now()}.csv`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
