const { query } = require('../db/pool');

class AnalyticsService {
  async getOrganizationAnalytics() {
    const totalEmployeesRes = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'EMPLOYEE' AND is_active = TRUE`);
    const evaluatedRes = await query(`SELECT COUNT(DISTINCT employee_id) as count FROM evaluations`);
    const avgScoreRes = await query(`SELECT AVG(overall_score) as avg_score FROM evaluations`);
    
    const depts = (await query('SELECT * FROM departments ORDER BY id ASC')).rows;
    const deptPerformance = [];
    for (const d of depts) {
      const usersInDept = (await query('SELECT id FROM users WHERE department_id = $1 AND role = $2', [d.id, 'EMPLOYEE'])).rows;
      const empIds = usersInDept.map(u => u.id);
      let avgScore = 0;
      let evalCount = 0;
      if (empIds.length > 0) {
        const placeholders = empIds.map((_, i) => `$${i + 1}`).join(',');
        const evs = (await query(`SELECT overall_score, employee_id FROM evaluations WHERE employee_id IN (${placeholders})`, empIds)).rows;
        if (evs.length > 0) {
          const sum = evs.reduce((acc, curr) => acc + Number(curr.overall_score), 0);
          avgScore = Number((sum / evs.length).toFixed(2));
          evalCount = new Set(evs.map(e => e.employee_id)).size;
        }
      }
      deptPerformance.push({
        id: d.id,
        name: d.name,
        avgScore,
        evaluatedCount: evalCount
      });
    }

    const distRes = await query(`
      SELECT
        COUNT(CASE WHEN overall_score < 70 THEN 1 END) as under_70,
        COUNT(CASE WHEN overall_score >= 70 AND overall_score < 80 THEN 1 END) as range_70_79,
        COUNT(CASE WHEN overall_score >= 80 AND overall_score < 90 THEN 1 END) as range_80_89,
        COUNT(CASE WHEN overall_score >= 90 THEN 1 END) as range_90_100
      FROM evaluations
    `);

    const trendRes = await query(`
      SELECT cycle_date, AVG(overall_score) as avg_score, COUNT(*) as count
      FROM evaluations
      GROUP BY cycle_date
      ORDER BY cycle_date ASC
    `);

    return {
      totalEmployees: Number(totalEmployeesRes.rows[0]?.count || 0),
      evaluatedEmployees: Number(evaluatedRes.rows[0]?.count || 0),
      organizationAverageScore: Number(Number(avgScoreRes.rows[0]?.avg_score || 0).toFixed(2)),
      departmentPerformance: deptPerformance,
      scoreDistribution: {
        under_70: Number(distRes.rows[0]?.under_70 || 0),
        range_70_79: Number(distRes.rows[0]?.range_70_79 || 0),
        range_80_89: Number(distRes.rows[0]?.range_80_89 || 0),
        range_90_100: Number(distRes.rows[0]?.range_90_100 || 0)
      },
      trend: trendRes.rows.map(t => ({
        cycleDate: t.cycle_date,
        avgScore: Number(Number(t.avg_score || 0).toFixed(2)),
        count: Number(t.count)
      }))
    };
  }

  async getTeamAnalytics(departmentId) {
    const totalTeamRes = await query(
      `SELECT COUNT(*) as count FROM users WHERE department_id = $1 AND role = 'EMPLOYEE' AND is_active = TRUE`,
      [departmentId]
    );

    const teamUsers = (await query(`SELECT id, name, email FROM users WHERE department_id = $1 AND role = 'EMPLOYEE'`, [departmentId])).rows;
    const teamUserIds = teamUsers.map(u => u.id);

    let teamAverageScore = 0;
    const topPerformers = [];
    const needsImprovement = [];
    const parameterTotals = {};
    const parameterCounts = {};

    if (teamUserIds.length > 0) {
      const placeholders = teamUserIds.map((_, i) => `$${i + 1}`).join(',');
      const evals = (await query(`SELECT * FROM evaluations WHERE employee_id IN (${placeholders})`, teamUserIds)).rows;
      if (evals.length > 0) {
        const sum = evals.reduce((acc, curr) => acc + Number(curr.overall_score), 0);
        teamAverageScore = Number((sum / evals.length).toFixed(2));
      }

      for (const u of teamUsers) {
        const userEvals = evals.filter(e => Number(e.employee_id) === Number(u.id));
        if (userEvals.length > 0) {
          const maxScore = Math.max(...userEvals.map(e => Number(e.overall_score)));
          if (maxScore >= 85) {
            topPerformers.push({ id: u.id, name: u.name, email: u.email, top_score: maxScore });
          }
          if (maxScore < 80) {
            needsImprovement.push({ id: u.id, name: u.name, email: u.email, latest_score: maxScore });
          }
        }
      }

      if (evals.length > 0) {
        const evalIds = evals.map(e => e.id);
        const ePlaceholders = evalIds.map((_, i) => `$${i + 1}`).join(',');
        const pScores = (await query(`SELECT ps.*, ep.name FROM parameter_scores ps JOIN evaluation_parameters ep ON ps.parameter_id = ep.id WHERE ps.evaluation_id IN (${ePlaceholders})`, evalIds)).rows;
        pScores.forEach(ps => {
          parameterTotals[ps.name] = (parameterTotals[ps.name] || 0) + Number(ps.score);
          parameterCounts[ps.name] = (parameterCounts[ps.name] || 0) + 1;
        });
      }
    }

    const parameterAverages = Object.keys(parameterTotals).map(name => ({
      name,
      avgScore: Number((parameterTotals[name] / parameterCounts[name]).toFixed(2))
    }));

    return {
      teamTotalEmployees: Number(totalTeamRes.rows[0]?.count || 0),
      teamAverageScore,
      topPerformers,
      needsImprovement,
      parameterAverages
    };
  }

  async getPromotionReadiness(currentUser, threshold = 75) {
    const res = await query(`SELECT * FROM promotion_readiness ORDER BY score DESC`);
    const records = res.rows;
    const enriched = [];

    for (const pr of records) {
      const uRes = await query(`SELECT id, name, email, department_id, title, is_on_pip, pip_status, pip_reason, pip_target_date, demotion_status, demoted_title, demotion_reason, is_laid_off, layoff_status, layoff_reason FROM users WHERE id = $1`, [pr.employee_id]);
      const emp = uRes.rows[0];
      if (!emp) continue;

      if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
        continue;
      }

      let deptName = 'N/A';
      if (emp.department_id) {
        const dRes = await query(`SELECT name FROM departments WHERE id = $1`, [emp.department_id]);
        if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
      }

      let updaterName = null;
      if (pr.updated_by) {
        const upRes = await query(`SELECT name FROM users WHERE id = $1`, [pr.updated_by]);
        if (upRes.rows.length > 0) updaterName = upRes.rows[0].name;
      }

      let nominatorName = null;
      if (pr.nominated_by) {
        const nomRes = await query(`SELECT name FROM users WHERE id = $1`, [pr.nominated_by]);
        if (nomRes.rows.length > 0) nominatorName = nomRes.rows[0].name;
      }

      enriched.push({
        ...pr,
        score: Number(pr.score),
        employee_name: emp.name,
        employee_email: emp.email,
        employee_title: emp.title || null,
        department_id: emp.department_id,
        department_name: deptName,
        target_role_name: pr.target_role_name || null,
        nominated_by_name: nominatorName || updaterName,
        hr_comment: pr.hr_comment || null,
        is_acknowledged_by_employee: Boolean(pr.is_acknowledged_by_employee),
        promoted_at: pr.promoted_at || null,
        updated_by_name: updaterName,
        is_above_threshold: Number(pr.score) >= Number(threshold),
        is_on_pip: Boolean(emp.is_on_pip),
        pip_status: emp.pip_status || 'NONE',
        pip_reason: emp.pip_reason || null,
        pip_target_date: emp.pip_target_date || null,
        demotion_status: emp.demotion_status || 'NONE',
        demoted_title: emp.demoted_title || null,
        demotion_reason: emp.demotion_reason || null,
        is_laid_off: Boolean(emp.is_laid_off),
        layoff_status: emp.layoff_status || 'NONE',
        layoff_reason: emp.layoff_reason || null
      });
    }

    return enriched;
  }

  async nominatePromotion(employeeId, data, currentUser) {
    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied. You can only nominate employees in your department.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const evals = (await query(`SELECT overall_score FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC LIMIT 1`, [employeeId])).rows;
    const currentScore = evals[0] ? Number(evals[0].overall_score) : 85.0;

    const existing = await query(`SELECT * FROM promotion_readiness WHERE employee_id = $1`, [employeeId]);

    let res;
    if (existing.rows.length > 0) {
      res = await query(
        `UPDATE promotion_readiness
         SET status = 'NOMINATED',
             recommendation_text = $1,
             target_role_name = $2,
             nominated_by = $3,
             updated_by = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $4 RETURNING *`,
        [data.recommendation_text, data.target_role_name || 'Senior Specialist', currentUser.userId, employeeId]
      );
    } else {
      res = await query(
        `INSERT INTO promotion_readiness (employee_id, score, status, recommendation_text, target_role_name, nominated_by, updated_by)
         VALUES ($1, $2, 'NOMINATED', $3, $4, $5, $5) RETURNING *`,
        [employeeId, currentScore, data.recommendation_text, data.target_role_name || 'Senior Specialist', currentUser.userId]
      );
    }

    return res.rows[0];
  }

  async approvePromotion(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can formally approve and promote employees.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    const targetTitle = data.new_role_title || data.target_role_name || 'Lead Specialist';
    const hrComment = data.hr_comment || 'Promotion approved by HR Executive Committee.';

    const promoRes = await query(
      `UPDATE promotion_readiness
       SET status = 'PROMOTED',
           target_role_name = $1,
           hr_comment = $2,
           is_acknowledged_by_employee = FALSE,
           promoted_at = CURRENT_TIMESTAMP,
           updated_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $4 RETURNING *`,
      [targetTitle, hrComment, currentUser.userId, employeeId]
    );

    // Update user profile title in users table
    await query(
      `UPDATE users SET title = $1 WHERE id = $2`,
      [targetTitle, employeeId]
    );

    return promoRes.rows[0];
  }

  async rejectPromotion(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can decide promotion outcomes.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const promoRes = await query(
      `UPDATE promotion_readiness
       SET status = 'NEEDS_TRAINING',
           hr_comment = $1,
           updated_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $3 RETURNING *`,
      [data.hr_comment || 'Candidate requires further tenure and development before senior promotion.', currentUser.userId, employeeId]
    );

    return promoRes.rows[0];
  }

  async getEmployeePromotionNotification(employeeId) {
    const res = await query(
      `SELECT pr.*, u.name as employee_name, u.email as employee_email, u.title as employee_title,
              d.name as department_name, nom.name as manager_name
       FROM promotion_readiness pr
       JOIN users u ON pr.employee_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN users nom ON pr.nominated_by = nom.id
       WHERE pr.employee_id = $1 AND pr.status = 'PROMOTED'`,
      [employeeId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const rec = res.rows[0];
    return {
      id: rec.id,
      employeeId: rec.employee_id,
      employeeName: rec.employee_name,
      targetRoleName: rec.target_role_name || rec.employee_title || 'Senior Role',
      recommendationText: rec.recommendation_text,
      managerName: rec.manager_name || 'Department Manager',
      hrComment: rec.hr_comment || 'Promotion officially approved by HR Executive Committee.',
      promotedAt: rec.promoted_at,
      isAcknowledged: Boolean(rec.is_acknowledged_by_employee)
    };
  }

  async acknowledgePromotion(employeeId, currentUser) {
    if (currentUser.role === 'EMPLOYEE' && Number(currentUser.userId) !== Number(employeeId)) {
      const err = new Error('Access denied.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const res = await query(
      `UPDATE promotion_readiness
       SET is_acknowledged_by_employee = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE employee_id = $1 RETURNING *`,
      [employeeId]
    );

    return res.rows[0];
  }

  async updatePromotionReadiness(employeeId, data, currentUser) {
    const existing = await query(
      `SELECT pr.*, u.department_id FROM promotion_readiness pr JOIN users u ON pr.employee_id = u.id WHERE pr.employee_id = $1`,
      [employeeId]
    );

    if (existing.rows.length === 0) {
      const err = new Error('Promotion readiness record not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const record = existing.rows[0];

    if (currentUser.role === 'MANAGER') {
      if (Number(record.department_id) !== Number(currentUser.departmentId)) {
        const err = new Error('Managers can only submit recommendations for employees in their department.');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      const res = await query(
        `UPDATE promotion_readiness
         SET status = 'NOMINATED',
             recommendation_text = $1,
             target_role_name = $2,
             nominated_by = $3,
             updated_by = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $4 RETURNING *`,
        [data.recommendation_text, data.target_role_name || 'Senior Level', currentUser.userId, employeeId]
      );
      return res.rows[0];
    }

    if (currentUser.role === 'HR') {
      const res = await query(
        `UPDATE promotion_readiness
         SET status = COALESCE($1, status),
             recommendation_text = COALESCE($2, recommendation_text),
             target_role_name = COALESCE($3, target_role_name),
             hr_comment = COALESCE($4, hr_comment),
             updated_by = $5, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $6 RETURNING *`,
        [data.status, data.recommendation_text, data.target_role_name, data.hr_comment, currentUser.userId, employeeId]
      );
      return res.rows[0];
    }

    const err = new Error('Unauthorized');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  async getTalentDecisionAnalysis(employeeId, currentUser) {
    const uRes = await query(
      `SELECT u.*, d.name as department_name, jr.name as job_role_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN job_roles jr ON u.department_id = jr.department_id
       WHERE u.id = $1`,
      [employeeId]
    );

    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found.');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }

    const employee = uRes.rows[0];

    if (currentUser.role === 'MANAGER' && Number(employee.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied. You can only analyze team members in your department.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const evals = (await query(
      `SELECT * FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC`,
      [employeeId]
    )).rows;

    const latestEval = evals[0];
    const overallScore = latestEval ? Number(latestEval.overall_score) : 0;

    const teamAnalytics = await this.getTeamAnalytics(employee.department_id);
    const teamAvg = teamAnalytics.teamAverageScore || 75.0;

    let parameterScores = [];
    if (latestEval) {
      const psRes = await query(
        `SELECT ps.*, ep.name as parameter_name, ep.weightage
         FROM parameter_scores ps
         JOIN evaluation_parameters ep ON ps.parameter_id = ep.id
         WHERE ps.evaluation_id = $1`,
        [latestEval.id]
      );
      parameterScores = psRes.rows.map(r => ({
        parameterName: r.parameter_name,
        weightage: Number(r.weightage),
        score: Number(r.score),
        reason: r.reason
      }));
    }

    const strongParams = parameterScores.filter(p => p.score >= 8.0);
    const weakParams = parameterScores.filter(p => p.score < 8.0);
    const lowestParam = parameterScores.length > 0 ? [...parameterScores].sort((a, b) => a.score - b.score)[0] : null;
    const highestParam = parameterScores.length > 0 ? [...parameterScores].sort((a, b) => b.score - a.score)[0] : null;

    const delta = Number((overallScore - teamAvg).toFixed(1));

    let decision = 'RETAIN_AND_COACH';
    let decisionTitle = 'Retain & Coach (Targeted 90-Day Developmental Plan)';
    let decisionBadge = 'RETAIN_AND_COACH';
    let summary = '';
    let managerActionPlan = [];

    if (overallScore >= 85.0) {
      decision = 'PROMOTE';
      decisionTitle = 'Strongly Recommended for Promotion';
      decisionBadge = 'PROMOTE';
      summary = `${employee.name} demonstrates exceptional performance (${overallScore}%), performing +${delta > 0 ? delta : 0}% above the team average of ${teamAvg}%. Verified mastery in ${highestParam?.parameterName || 'core competencies'} and consistent high velocity make this contributor ready for next-level responsibilities and title progression.`;
      managerActionPlan = [
        `1. Formalize promotion nomination in the Promotion Nominations portal.`,
        `2. Draft senior level scope expansion plan and assign mentorship responsibilities.`,
        `3. Submit compensation and title advancement recommendation to HR executive committee.`
      ];
    } else if (overallScore >= 70.0) {
      decision = 'RETAIN_AND_COACH';
      decisionTitle = 'Retain in Current Band & Coach (Developing Trajectory)';
      decisionBadge = 'RETAIN_AND_COACH';
      summary = `${employee.name} maintains solid baseline contributions (${overallScore}%), comparing ${delta >= 0 ? '+' + delta : delta}% relative to the team average (${teamAvg}%). While foundational execution is reliable, specific skill gaps in ${lowestParam?.parameterName || 'secondary areas'} require targeted coaching before advancement.`;
      managerActionPlan = [
        `1. Schedule bi-weekly coaching check-ins focused on ${lowestParam?.parameterName || 'key growth areas'}.`,
        `2. Log targeted growth goals aligned with HR appraisal note: "${lowestParam?.reason || 'Expand domain depth'}".`,
        `3. Re-evaluate performance trajectory in the next quarterly appraisal cycle.`
      ];
    } else {
      decision = 'PIP_OR_LAYOFF_RISK';
      decisionTitle = 'Performance Improvement Plan (PIP) / Layoff Risk';
      decisionBadge = 'PIP_OR_LAYOFF_RISK';
      summary = `${employee.name} is currently underperforming with an overall score of ${overallScore}%, lagging -${Math.abs(delta)}% below the team average of ${teamAvg}%. Critical deficiencies across ${lowestParam?.parameterName || 'core competencies'} (${lowestParam?.score || 0}/10: "${lowestParam?.reason || 'Below band standards'}") represent a severe delivery bottleneck.`;
      managerActionPlan = [
        `1. Coordinate immediately with HR to initiate a formal 30-day Performance Improvement Plan (PIP).`,
        `2. Define 3 non-negotiable weekly deliverables with clear pass/fail criteria.`,
        `3. Schedule weekly progress checkpoints; if standards are unmet by day 30, proceed with role restructuring or offboarding.`
      ];
    }

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      departmentId: employee.department_id,
      departmentName: employee.department_name,
      jobRole: employee.job_role_name || 'Team Contributor',
      evaluationId: latestEval ? latestEval.id : null,
      overallScore,
      teamAverage: teamAvg,
      scoreDelta: delta,
      decision,
      decisionTitle,
      decisionBadge,
      summary,
      keyStrengths: strongParams.map(p => `${p.parameterName} (${p.score}/10: "${p.reason}")`),
      criticalGaps: weakParams.map(p => `${p.parameterName} (${p.score}/10: "${p.reason}")`),
      managerActionPlan,
      parameterScores,
      evaluationsCount: evals.length
    };
  }

  async proposeLayoff(employeeId, data, currentUser) {
    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found.');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied. You can only submit proposals for members in your department.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const reason = (data.reason || 'Performance standards and competency milestones unaddressed.').trim();

    const res = await query(
      `UPDATE users
       SET layoff_status = 'PENDING_APPROVAL',
           layoff_reason = $1,
           layoff_proposed_by = $2
       WHERE id = $3 RETURNING id, name, email, department_id, layoff_status, layoff_reason`,
      [reason, currentUser.userId, employeeId]
    );

    return res.rows[0];
  }

  async getPendingLayoffs(currentUser) {
    if (currentUser.role !== 'HR' && currentUser.role !== 'MANAGER') {
      const err = new Error('Unauthorized');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    let sql = `
      SELECT u.id, u.name, u.email, u.title, u.department_id, u.is_laid_off, u.layoff_status,
             u.layoff_reason, u.layoff_hr_notes, u.layoff_approved_at, u.layoff_proposed_by,
             d.name as department_name, nom.name as proposed_by_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users nom ON u.layoff_proposed_by = nom.id
      WHERE u.layoff_status != 'NONE' OR u.is_laid_off = TRUE
      ORDER BY u.id DESC
    `;

    const res = await query(sql);
    const list = [];
    for (const r of res.rows) {
      if (currentUser.role === 'MANAGER' && Number(r.department_id) !== Number(currentUser.departmentId)) {
        continue;
      }
      const evals = (await query(`SELECT overall_score FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC LIMIT 1`, [r.id])).rows;
      list.push({
        ...r,
        latest_score: evals[0] ? Number(evals[0].overall_score) : null
      });
    }
    return list;
  }

  async approveLayoff(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can authorize employment separations.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found.');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    const officialReason = (data.official_reason || emp.layoff_reason || 'Performance & delivery benchmarks unmet; restructuring of role deliverables.').trim();
    const hrNotes = (data.hr_notes || 'Formal severance package, benefits continuation documentation, and exit guidelines will be sent to your registered personal email address shortly.').trim();

    const res = await query(
      `UPDATE users
       SET is_laid_off = TRUE,
           is_active = FALSE,
           layoff_status = 'APPROVED',
           layoff_reason = $1,
           layoff_hr_notes = $2,
           layoff_approved_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING id, name, email, department_id, is_laid_off, is_active, layoff_status, layoff_reason, layoff_hr_notes, layoff_approved_at`,
      [officialReason, hrNotes, employeeId]
    );

    return res.rows[0];
  }

  async declineLayoff(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can decide separation requests.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const res = await query(
      `UPDATE users
       SET layoff_status = 'DECLINED',
           layoff_hr_notes = $1
       WHERE id = $2 RETURNING id, name, email, department_id, layoff_status, layoff_hr_notes`,
      [data.hr_notes || 'Request declined by HR. Contributor to be supported via a formal 30-day PIP before consideration of separation.', employeeId]
    );

    return res.rows[0];
  }

  async assignPIP(employeeId, data, currentUser) {
    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied. You can only assign PIP to members of your department.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const reason = (data.reason || 'Appraisal score under 70%. Target milestones and core competency benchmarks required.').trim();
    const targetDate = data.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await query(
      `UPDATE users
       SET is_on_pip = TRUE,
           pip_status = 'ACTIVE',
           pip_reason = $1,
           pip_target_date = $2,
           pip_assigned_by = $3,
           pip_assigned_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING id, name, email, is_on_pip, pip_status, pip_reason, pip_target_date`,
      [reason, targetDate, currentUser.userId, employeeId]
    );

    await query(
      `INSERT INTO growth_goals (employee_id, goal_text, target_date, status)
       VALUES ($1, $2, $3, 'OPEN')`,
      [employeeId, `30-Day PIP Milestone: ${reason}`, targetDate]
    );

    return res.rows[0];
  }

  async resolvePIP(employeeId, data, currentUser) {
    const res = await query(
      `UPDATE users
       SET is_on_pip = FALSE,
           pip_status = 'RESOLVED'
       WHERE id = $1 RETURNING id, name, is_on_pip, pip_status`,
      [employeeId]
    );
    return res.rows[0];
  }

  async proposeDemotion(employeeId, data, currentUser) {
    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    if (currentUser.role === 'MANAGER' && Number(emp.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied. You can only submit proposals for members of your department.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const targetTitle = (data.demoted_title || (emp.title ? `Associate ${emp.title.replace(/^Senior\s+|^Lead\s+/i, '')}` : 'Associate Specialist')).trim();
    const reason = (data.reason || 'Appraisal score and sprint deliverables consistently underperform band requirements.').trim();

    const res = await query(
      `UPDATE users
       SET demotion_status = 'PROPOSED',
           demoted_title = $1,
           demotion_reason = $2,
           demotion_proposed_by = $3
       WHERE id = $4 RETURNING id, name, email, demotion_status, demoted_title, demotion_reason`,
      [targetTitle, reason, currentUser.userId, employeeId]
    );

    return res.rows[0];
  }

  async approveDemotion(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can authorize title adjustments.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const uRes = await query(`SELECT * FROM users WHERE id = $1`, [employeeId]);
    if (uRes.rows.length === 0) {
      const err = new Error('Employee not found');
      err.status = 404; err.code = 'NOT_FOUND'; throw err;
    }
    const emp = uRes.rows[0];

    const confirmedTitle = (data.confirmed_title || emp.demoted_title || 'Associate Specialist').trim();
    const hrNotes = (data.hr_notes || 'Role title and band adjusted following managerial appraisal recommendations.').trim();

    const res = await query(
      `UPDATE users
       SET title = $1,
           demotion_status = 'APPROVED',
           demotion_hr_notes = $2
       WHERE id = $3 RETURNING id, name, email, title, demotion_status, demotion_hr_notes`,
      [confirmedTitle, hrNotes, employeeId]
    );

    return res.rows[0];
  }

  async declineDemotion(employeeId, data, currentUser) {
    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR Administrators can decide title proposals.');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const res = await query(
      `UPDATE users
       SET demotion_status = 'DECLINED',
           demotion_hr_notes = $1
       WHERE id = $2 RETURNING id, name, email, demotion_status, demotion_hr_notes`,
      [data.hr_notes || 'Demotion proposal declined by HR. Contributor to remain on structured coaching review.', employeeId]
    );

    return res.rows[0];
  }

  async getPendingTalentActions(currentUser) {
    if (currentUser.role !== 'HR' && currentUser.role !== 'MANAGER') {
      const err = new Error('Unauthorized');
      err.status = 403; err.code = 'FORBIDDEN'; throw err;
    }

    const sql = `
      SELECT u.id, u.name, u.email, u.title, u.department_id, u.is_laid_off, u.layoff_status,
             u.layoff_reason, u.layoff_hr_notes, u.layoff_approved_at, u.layoff_proposed_by,
             u.is_on_pip, u.pip_status, u.pip_reason, u.pip_target_date,
             u.demotion_status, u.demoted_title, u.demotion_reason, u.demotion_hr_notes,
             d.name as department_name, nom.name as proposed_by_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users nom ON COALESCE(u.layoff_proposed_by, u.demotion_proposed_by, u.pip_assigned_by) = nom.id
      WHERE u.layoff_status != 'NONE' OR u.demotion_status != 'NONE' OR u.is_on_pip = TRUE OR u.is_laid_off = TRUE
      ORDER BY u.id DESC
    `;

    const res = await query(sql);
    const list = [];
    for (const r of res.rows) {
      if (currentUser.role === 'MANAGER' && Number(r.department_id) !== Number(currentUser.departmentId)) {
        continue;
      }
      const evals = (await query(`SELECT overall_score FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC LIMIT 1`, [r.id])).rows;
      list.push({
        ...r,
        latest_score: evals[0] ? Number(evals[0].overall_score) : null
      });
    }
    return list;
  }
}

module.exports = new AnalyticsService();
