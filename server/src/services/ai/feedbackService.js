const env = require('../../config/env');
const OpenAIProvider = require('./openAIProvider');
const RuleBasedFallbackProvider = require('./ruleBasedFallbackProvider');
const { query } = require('../../db/pool');

class FeedbackService {
  constructor() {
    if (env.OPENAI_API_KEY) {
      this.provider = new OpenAIProvider(env.OPENAI_API_KEY);
    } else {
      this.provider = new RuleBasedFallbackProvider();
    }
  }

  async generateAndSaveFeedback(evaluationId) {
    const evalRes = await query(
      `SELECT e.*, u.name as employee_name, jr.name as job_role_name
       FROM evaluations e
       JOIN users u ON e.employee_id = u.id
       LEFT JOIN job_roles jr ON u.department_id = jr.department_id
       WHERE e.id = $1`,
      [evaluationId]
    );

    if (evalRes.rows.length === 0) {
      const err = new Error('Evaluation not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const evaluation = evalRes.rows[0];
    const scoresRes = await query(
      `SELECT ps.*, ep.name, ep.weightage FROM parameter_scores ps JOIN evaluation_parameters ep ON ps.parameter_id = ep.id WHERE ps.evaluation_id = $1`,
      [evaluationId]
    );

    const parameters = scoresRes.rows.map(r => ({ name: r.name, weightage: r.weightage, score: Number(r.score), reason: r.reason }));
    const context = { employeeName: evaluation.employee_name, jobRole: evaluation.job_role_name || 'General Contributor', overallScore: Number(evaluation.overall_score), parameters };

    let feedbackResult;
    try {
      feedbackResult = await this.provider.generate(context);
    } catch (err) {
      console.warn('Primary AI Provider failed, falling back to RuleBasedFallbackProvider:', err.message);
      const fallback = new RuleBasedFallbackProvider();
      feedbackResult = await fallback.generate(context);
    }

    const existing = await query('SELECT id FROM ai_feedback WHERE evaluation_id = $1', [evaluationId]);
    let saved;
    if (existing.rows.length > 0) {
      saved = await query(
        `UPDATE ai_feedback SET strengths_text = $1, skill_gaps_text = $2, suggestions_text = $3, generated_at = CURRENT_TIMESTAMP WHERE evaluation_id = $4 RETURNING *`,
        [feedbackResult.strengths, feedbackResult.skill_gaps, feedbackResult.suggestions, evaluationId]
      );
    } else {
      saved = await query(
        `INSERT INTO ai_feedback (evaluation_id, strengths_text, skill_gaps_text, suggestions_text) VALUES ($1, $2, $3, $4) RETURNING *`,
        [evaluationId, feedbackResult.strengths, feedbackResult.skill_gaps, feedbackResult.suggestions]
      );
    }
    return saved.rows[0];
  }

  async chatWithCoach(evaluationId, userMessage, history = [], currentUser) {
    let evalId = evaluationId;

    if (!evalId || evalId === 'latest') {
      const targetEmpId = currentUser.role === 'EMPLOYEE' ? currentUser.userId : currentUser.userId;
      const latestRes = await query(
        `SELECT id FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC LIMIT 1`,
        [targetEmpId]
      );
      if (latestRes.rows.length === 0) {
        const fallback = new RuleBasedFallbackProvider();
        const reply = await fallback.chat(
          { employeeName: currentUser.name, jobRole: 'Team Member', overallScore: 85, parameters: [] },
          userMessage,
          history
        );
        return { reply, evaluationId: null };
      }
      evalId = latestRes.rows[0].id;
    }

    const evalRes = await query(
      `SELECT e.*, u.name as employee_name, jr.name as job_role_name
       FROM evaluations e
       JOIN users u ON e.employee_id = u.id
       LEFT JOIN job_roles jr ON u.department_id = jr.department_id
       WHERE e.id = $1`,
      [evalId]
    );

    if (evalRes.rows.length === 0) {
      const err = new Error('Evaluation not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const evaluation = evalRes.rows[0];

    if (currentUser.role === 'EMPLOYEE' && Number(evaluation.employee_id) !== Number(currentUser.userId)) {
      const err = new Error('Access denied to other employee evaluations.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const scoresRes = await query(
      `SELECT ps.*, ep.name, ep.weightage FROM parameter_scores ps JOIN evaluation_parameters ep ON ps.parameter_id = ep.id WHERE ps.evaluation_id = $1`,
      [evalId]
    );

    const parameters = scoresRes.rows.map(r => ({
      name: r.name,
      weightage: Number(r.weightage),
      score: Number(r.score),
      reason: r.reason
    }));

    const context = {
      employeeName: evaluation.employee_name,
      jobRole: evaluation.job_role_name || 'Software Professional',
      overallScore: Number(evaluation.overall_score),
      parameters
    };

    let reply;
    try {
      if (env.OPENAI_API_KEY && this.provider instanceof OpenAIProvider) {
        reply = await this.provider.chat(context, userMessage, history);
      } else {
        const fallback = new RuleBasedFallbackProvider();
        reply = await fallback.chat(context, userMessage, history);
      }
    } catch (err) {
      console.warn('AI Coach provider failed, falling back to RuleBasedFallbackProvider:', err.message);
      const fallback = new RuleBasedFallbackProvider();
      reply = await fallback.chat(context, userMessage, history);
    }

    return {
      reply,
      evaluationId: Number(evalId)
    };
  }
}

module.exports = new FeedbackService();
