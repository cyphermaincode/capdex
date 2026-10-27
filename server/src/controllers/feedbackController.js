const feedbackService = require('../services/ai/feedbackService');
const evaluationService = require('../services/evaluationService');

class FeedbackController {
  async getFeedback(req, res, next) {
    try {
      const evaluation = await evaluationService.getEvaluationById(req.params.id, req.user);
      res.status(200).json({ data: evaluation.feedback });
    } catch (err) {
      next(err);
    }
  }

  async regenerateFeedback(req, res, next) {
    try {
      await evaluationService.getEvaluationById(req.params.id, req.user);
      const feedback = await feedbackService.generateAndSaveFeedback(req.params.id);
      res.status(200).json({ data: feedback });
    } catch (err) {
      next(err);
    }
  }

  async chatWithCoach(req, res, next) {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        const err = new Error('Message is required');
        err.status = 400; err.code = 'BAD_REQUEST'; throw err;
      }
      const evaluationId = req.params.id || req.body.evaluationId || 'latest';
      const result = await feedbackService.chatWithCoach(evaluationId, message.trim(), history || [], req.user);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeedbackController();
