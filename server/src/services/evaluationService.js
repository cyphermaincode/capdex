const { query } = require('../db/pool');
const feedbackService = require('./ai/feedbackService');

function formatDateStr(d) {
  if (!d) return null;
  if (typeof d === 'string') {
    return d.includes('T') ? d.split('T')[0] : d;
  }
  if (d instanceof Date) {
    return d.toISOString().split('T')[0];
  }
  return String(d);
}

class EvaluationService {
  async createEvaluation({ employee_id, cycle_date, scores }, evaluatedBy) {
    if (!employee_id || !scores || !Array.isArray(scores) || scores.length === 0) {
      const err = new Error('employee_id, cycle_date, and parameter scores array are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    for (const item of scores) {
      if (!item.parameter_id) {
        const err = new Error('parameter_id is required for every score entry.');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        throw err;
      }
      if (item.score === undefined || isNaN(Number(item.score)) || Number(item.score) < 0 || Number(item.score) > 10) {
        const err = new Error('Score must be a number between 0 and 10.');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        throw err;
      }
      if (!item.reason || !item.reason.trim()) {
        const err = new Error('A mandatory written justification/reason is required for every parameter score.');
        err.status = 400;
        err.code = 'MANDATORY_REASON_MISSING';
        throw err;
      }
    }

    const empRes = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [employee_id, 'EMPLOYEE']);
    if (empRes.rows.length === 0) {
      const err = new Error('Employee not found or specified user is not an employee.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const paramIds = scores.map(s => Number(s.parameter_id));
    const placeholders = paramIds.map((_, i) => `$${i + 1}`).join(',');
    const paramsRes = await query(
      `SELECT id, weightage, name FROM evaluation_parameters WHERE id IN (${placeholders})`,
      paramIds
    );
    const paramMap = {};
    paramsRes.rows.forEach(p => { paramMap[Number(p.id)] = p; });

    let weightedSum = 0;
    let totalWeight = 0;

    scores.forEach(s => {
      const p = paramMap[Number(s.parameter_id)];
      if (p) {
        weightedSum += Number(s.score) * Number(p.weightage);
        totalWeight += Number(p.weightage);
      }
    });

    const overallScore = totalWeight > 0 ? Number(((weightedSum / totalWeight) * 10).toFixed(2)) : 0;
    const rawCycle = cycle_date || new Date().toISOString().split('T')[0];
    const cycle = formatDateStr(rawCycle);

    const evalRes = await query(
      `INSERT INTO evaluations (employee_id, evaluated_by, cycle_date, overall_score, status)
       VALUES ($1, $2, $3, $4, 'SUBMITTED') RETURNING *`,
      [employee_id, evaluatedBy, cycle, overallScore]
    );

    const evaluation = evalRes.rows[0];
    await query(`UPDATE users SET appraisal_date = $1 WHERE id = $2`, [cycle, employee_id]);

    for (const item of scores) {
      await query(
        `INSERT INTO parameter_scores (evaluation_id, parameter_id, score, reason)
         VALUES ($1, $2, $3, $4)`,
        [evaluation.id, Number(item.parameter_id), Number(item.score), item.reason.trim()]
      );
    }

    let feedback = null;
    try {
      feedback = await feedbackService.generateAndSaveFeedback(evaluation.id);
    } catch (fbErr) {
      console.error('AIFeedback Generation failed:', fbErr);
    }

    const promStatus = overallScore >= 85 ? 'ELIGIBLE' : overallScore >= 75 ? 'NEEDS_TRAINING' : 'NOT_READY';
    const existingProm = await query('SELECT id FROM promotion_readiness WHERE employee_id = $1', [employee_id]);
    if (existingProm.rows.length > 0) {
      await query(
        `UPDATE promotion_readiness SET score = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $3`,
        [overallScore, promStatus, employee_id]
      );
    } else {
      await query(
        `INSERT INTO promotion_readiness (employee_id, score, status) VALUES ($1, $2, $3)`,
        [employee_id, overallScore, promStatus]
      );
    }

    return {
      ...evaluation,
      cycle_date: formatDateStr(evaluation.cycle_date),
      feedback
    };
  }

  async getEvaluationById(id, currentUser) {
    const evalRes = await query(`SELECT * FROM evaluations WHERE id = $1`, [id]);
    if (evalRes.rows.length === 0) {
      const err = new Error('Evaluation not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const evaluation = evalRes.rows[0];

    const empRes = await query(`SELECT * FROM users WHERE id = $1`, [evaluation.employee_id]);
    const empUser = empRes.rows[0] || {};

    if (currentUser.role === 'EMPLOYEE' && Number(empUser.id) !== Number(currentUser.userId || currentUser.id)) {
      const err = new Error('Access denied to this evaluation.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (currentUser.role === 'MANAGER' && Number(empUser.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied to evaluations outside your team.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    let deptName = 'N/A';
    if (empUser.department_id) {
      const deptRes = await query(`SELECT name FROM departments WHERE id = $1`, [empUser.department_id]);
      if (deptRes.rows.length > 0) deptName = deptRes.rows[0].name;
    }

    const evalUserRes = await query(`SELECT name FROM users WHERE id = $1`, [evaluation.evaluated_by]);

    const scoresRes = await query(
      `SELECT ps.*, ep.name as parameter_name, ep.weightage
       FROM parameter_scores ps
       JOIN evaluation_parameters ep ON ps.parameter_id = ep.id
       WHERE ps.evaluation_id = $1
       ORDER BY ep.id ASC`,
      [id]
    );

    const feedbackRes = await query(
      `SELECT * FROM ai_feedback WHERE evaluation_id = $1`,
      [id]
    );

    const commentsRes = await query(
      `SELECT mc.*, u.name as manager_name
       FROM manager_comments mc
       JOIN users u ON mc.manager_id = u.id
       WHERE mc.evaluation_id = $1
       ORDER BY mc.created_at ASC`,
      [id]
    );

    return {
      ...evaluation,
      cycle_date: formatDateStr(evaluation.cycle_date),
      employee_name: empUser.name,
      employee_email: empUser.email,
      department_id: empUser.department_id,
      department_name: deptName,
      evaluator_name: evalUserRes.rows[0]?.name || 'HR Administrator',
      scores: scoresRes.rows,
      feedback: feedbackRes.rows[0] || null,
      manager_comments: commentsRes.rows
    };
  }

  async getEvaluations(filters = {}, currentUser) {
    let sql = `SELECT * FROM evaluations WHERE 1=1`;
    const params = [];

    if (currentUser.role === 'EMPLOYEE') {
      params.push(currentUser.userId || currentUser.id);
      sql += ` AND employee_id = $${params.length}`;
    } else if (filters.employeeId) {
      params.push(filters.employeeId);
      sql += ` AND employee_id = $${params.length}`;
    }

    sql += ` ORDER BY cycle_date DESC, id DESC`;
    const res = await query(sql, params);
    const evals = res.rows;

    const enriched = [];
    for (const ev of evals) {
      const uRes = await query(`SELECT id, name, email, department_id FROM users WHERE id = $1`, [ev.employee_id]);
      const emp = uRes.rows[0] || {};

      if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
        continue;
      }
      if (filters.departmentId && Number(emp.department_id) !== Number(filters.departmentId)) {
        continue;
      }

      let deptName = 'N/A';
      if (emp.department_id) {
        const dRes = await query(`SELECT name FROM departments WHERE id = $1`, [emp.department_id]);
        if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
      }

      const fbRes = await query(`SELECT strengths_text, skill_gaps_text FROM ai_feedback WHERE evaluation_id = $1`, [ev.id]);

      enriched.push({
        ...ev,
        cycle_date: formatDateStr(ev.cycle_date),
        employee_name: emp.name,
        employee_email: emp.email,
        department_id: emp.department_id,
        department_name: deptName,
        strengths_text: fbRes.rows[0]?.strengths_text || null,
        skill_gaps_text: fbRes.rows[0]?.skill_gaps_text || null
      });
    }

    return enriched;
  }

  async getTeamEvaluations(currentUser) {
    return this.getEvaluations({ departmentId: currentUser.departmentId }, currentUser);
  }

  async acknowledgeEvaluation(id, employeeId) {
    const evalRes = await query('SELECT * FROM evaluations WHERE id = $1', [id]);
    if (evalRes.rows.length === 0) {
      const err = new Error('Evaluation not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (Number(evalRes.rows[0].employee_id) !== Number(employeeId)) {
      const err = new Error('You can only acknowledge your own evaluations.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const res = await query(
      `UPDATE evaluations SET status = 'ACKNOWLEDGED' WHERE id = $1 RETURNING *`,
      [id]
    );

    return {
      ...res.rows[0],
      cycle_date: formatDateStr(res.rows[0].cycle_date)
    };
  }

  async addManagerComment(evaluationId, managerId, commentText, managerDeptId) {
    if (!commentText || !commentText.trim()) {
      const err = new Error('Comment text is required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const evalRes = await query('SELECT * FROM evaluations WHERE id = $1', [evaluationId]);
    if (evalRes.rows.length === 0) {
      const err = new Error('Evaluation not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const empRes = await query('SELECT department_id FROM users WHERE id = $1', [evalRes.rows[0].employee_id]);
    if (Number(empRes.rows[0]?.department_id) !== Number(managerDeptId)) {
      const err = new Error('Managers can only comment on evaluations for their own team.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const res = await query(
      `INSERT INTO manager_comments (evaluation_id, manager_id, comment_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [evaluationId, managerId, commentText.trim()]
    );

    return res.rows[0];
  }

  async updateEvaluationDate(id, cycleDate, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can modify appraisal dates.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    if (!cycleDate) {
      const err = new Error('Appraisal cycle_date is required.');
      err.status = 400; err.code = 'BAD_REQUEST'; throw err;
    }

    const cleanDate = formatDateStr(cycleDate);

    const res = await query(
      `UPDATE evaluations
       SET cycle_date = $1
       WHERE id = $2 RETURNING *`,
      [cleanDate, id]
    );

    if (res.rows.length === 0) {
      const err = new Error('Evaluation record not found.');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const evaluation = res.rows[0];
    await query(`UPDATE users SET appraisal_date = $1 WHERE id = $2`, [cleanDate, evaluation.employee_id]);

    return {
      ...evaluation,
      cycle_date: cleanDate
    };
  }

  async updateEmployeeAppraisalDate(employeeId, cycleDate, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can modify appraisal dates.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    if (!cycleDate) {
      const err = new Error('Appraisal cycle_date is required.');
      err.status = 400; err.code = 'BAD_REQUEST'; throw err;
    }

    const cleanDate = formatDateStr(cycleDate);

    // 1. Update user record appraisal_date
    await query(`UPDATE users SET appraisal_date = $1 WHERE id = $2`, [cleanDate, employeeId]);

    // 2. Update any existing evaluations for this employee
    const evals = (await query(
      `SELECT id FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC`,
      [employeeId]
    )).rows;

    if (evals.length > 0) {
      await query(
        `UPDATE evaluations SET cycle_date = $1 WHERE employee_id = $2`,
        [cleanDate, employeeId]
      );
    }

    const user = (await query(`SELECT id, name, appraisal_date FROM users WHERE id = $1`, [employeeId])).rows[0];
    return {
      employeeId,
      cycle_date: cleanDate,
      appraisal_date: cleanDate,
      user
    };
  }
}

module.exports = new EvaluationService();
