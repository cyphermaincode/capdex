const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getOrganizationAnalytics(req, res, next) {
    try {
      const analytics = await analyticsService.getOrganizationAnalytics();
      res.status(200).json({ data: analytics });
    } catch (err) {
      next(err);
    }
  }

  async getTeamAnalytics(req, res, next) {
    try {
      const analytics = await analyticsService.getTeamAnalytics(req.user.departmentId);
      res.status(200).json({ data: analytics });
    } catch (err) {
      next(err);
    }
  }

  async getPromotionReadiness(req, res, next) {
    try {
      const rankings = await analyticsService.getPromotionReadiness(req.user, req.query.threshold);
      res.status(200).json({ data: rankings });
    } catch (err) {
      next(err);
    }
  }

  async nominatePromotion(req, res, next) {
    try {
      const result = await analyticsService.nominatePromotion(
        req.params.employeeId,
        req.body,
        req.user
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async approvePromotion(req, res, next) {
    try {
      const result = await analyticsService.approvePromotion(
        req.params.employeeId,
        req.body,
        req.user
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async rejectPromotion(req, res, next) {
    try {
      const result = await analyticsService.rejectPromotion(
        req.params.employeeId,
        req.body,
        req.user
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEmployeePromotionNotification(req, res, next) {
    try {
      const targetEmpId = req.query.employeeId || req.user.userId;
      const notification = await analyticsService.getEmployeePromotionNotification(targetEmpId);
      res.status(200).json({ data: notification });
    } catch (err) {
      next(err);
    }
  }

  async acknowledgePromotion(req, res, next) {
    try {
      const targetEmpId = req.body.employeeId || req.user.userId;
      const result = await analyticsService.acknowledgePromotion(targetEmpId, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updatePromotionReadiness(req, res, next) {
    try {
      const result = await analyticsService.updatePromotionReadiness(
        req.params.employeeId,
        req.body,
        req.user
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getTalentDecisionAnalysis(req, res, next) {
    try {
      const analysis = await analyticsService.getTalentDecisionAnalysis(req.params.employeeId, req.user);
      res.status(200).json({ data: analysis });
    } catch (err) {
      next(err);
    }
  }

  async proposeLayoff(req, res, next) {
    try {
      const result = await analyticsService.proposeLayoff(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPendingLayoffs(req, res, next) {
    try {
      const list = await analyticsService.getPendingLayoffs(req.user);
      res.status(200).json({ data: list });
    } catch (err) {
      next(err);
    }
  }

  async approveLayoff(req, res, next) {
    try {
      const result = await analyticsService.approveLayoff(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async declineLayoff(req, res, next) {
    try {
      const result = await analyticsService.declineLayoff(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async assignPIP(req, res, next) {
    try {
      const result = await analyticsService.assignPIP(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async resolvePIP(req, res, next) {
    try {
      const result = await analyticsService.resolvePIP(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async proposeDemotion(req, res, next) {
    try {
      const result = await analyticsService.proposeDemotion(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async approveDemotion(req, res, next) {
    try {
      const result = await analyticsService.approveDemotion(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async declineDemotion(req, res, next) {
    try {
      const result = await analyticsService.declineDemotion(req.params.employeeId, req.body, req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPendingTalentActions(req, res, next) {
    try {
      const list = await analyticsService.getPendingTalentActions(req.user);
      res.status(200).json({ data: list });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
