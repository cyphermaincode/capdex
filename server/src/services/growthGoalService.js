const { query } = require('../db/pool');

class GrowthGoalService {
  async getGoals(employeeId, currentUser) {
    let sql = `
      SELECT gg.*, u.name as employee_name, u.department_id
      FROM growth_goals gg
      JOIN users u ON gg.employee_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (currentUser.role === 'EMPLOYEE') {
      sql += ` AND gg.employee_id = $1`;
      params.push(currentUser.userId);
    } else if (currentUser.role === 'MANAGER') {
      params.push(currentUser.departmentId);
      sql += ` AND u.department_id = $${params.length}`;
      if (employeeId) {
        params.push(employeeId);
        sql += ` AND gg.employee_id = $${params.length}`;
      }
    } else if (currentUser.role === 'HR') {
      if (employeeId) {
        params.push(employeeId);
        sql += ` AND gg.employee_id = $${params.length}`;
      }
    }

    sql += ` ORDER BY gg.target_date ASC, gg.id DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async createGoal({ goal_text, target_date }, employeeId) {
    if (!goal_text || !goal_text.trim() || !target_date) {
      const err = new Error('goal_text and target_date are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const res = await query(
      `INSERT INTO growth_goals (employee_id, goal_text, target_date, status)
       VALUES ($1, $2, $3, 'OPEN') RETURNING *`,
      [employeeId, goal_text.trim(), target_date]
    );

    return res.rows[0];
  }

  async updateGoal(id, { status, target_date, goal_text }, employeeId) {
    const existing = await query('SELECT * FROM growth_goals WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      const err = new Error('Growth goal not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (Number(existing.rows[0].employee_id) !== Number(employeeId)) {
      const err = new Error('You can only update your own growth goals.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const res = await query(
      `UPDATE growth_goals
       SET status = COALESCE($1, status),
           target_date = COALESCE($2, target_date),
           goal_text = COALESCE($3, goal_text)
       WHERE id = $4 RETURNING *`,
      [status, target_date, goal_text, id]
    );

    return res.rows[0];
  }
}

module.exports = new GrowthGoalService();
