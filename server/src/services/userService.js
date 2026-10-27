const { query } = require('../db/pool');
const authService = require('./authService');

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

class UserService {
  async getUsers(filters = {}, currentUser) {
    let sql = `SELECT * FROM users WHERE 1=1`;
    const params = [];

    if (currentUser?.role === 'EMPLOYEE') {
      params.push(currentUser.userId);
      sql += ` AND id = $${params.length}`;
    } else if (currentUser?.role === 'MANAGER') {
      params.push(currentUser.departmentId);
      sql += ` AND department_id = $${params.length}`;
    } else if (currentUser?.role === 'HR') {
      if (filters.department_id) {
        params.push(filters.department_id);
        sql += ` AND department_id = $${params.length}`;
      }
      if (filters.role) {
        params.push(filters.role);
        sql += ` AND role = $${params.length}`;
      }
    }

    sql += ` ORDER BY id ASC`;
    const res = await query(sql, params);
    const users = res.rows;

    const depts = (await query('SELECT id, name FROM departments')).rows;
    const deptMap = {};
    depts.forEach(d => { deptMap[d.id] = d.name; });

    const results = [];
    for (const u of users) {
      let latestCycleDate = u.appraisal_date ? formatDateStr(u.appraisal_date) : null;
      let latestEvaluationId = null;
      let latestScore = null;

      if (u.role === 'EMPLOYEE') {
        const evals = (await query(
          `SELECT id, cycle_date, overall_score FROM evaluations WHERE employee_id = $1 ORDER BY cycle_date DESC, id DESC LIMIT 1`,
          [u.id]
        )).rows;
        if (evals.length > 0) {
          latestCycleDate = formatDateStr(evals[0].cycle_date) || latestCycleDate;
          latestEvaluationId = evals[0].id;
          latestScore = Number(evals[0].overall_score);
        }
      }

      results.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department_id: u.department_id,
        department_name: u.department_id ? (deptMap[u.department_id] || '—') : '—',
        phone: u.phone,
        is_active: u.is_active,
        is_laid_off: u.is_laid_off,
        appraisal_date: latestCycleDate,
        latest_cycle_date: latestCycleDate,
        latest_evaluation_id: latestEvaluationId,
        latest_score: latestScore,
        created_at: u.created_at
      });
    }

    return results;
  }

  async getUserById(id, currentUser) {
    const res = await query(`SELECT * FROM users WHERE id = $1`, [id]);

    if (res.rows.length === 0) {
      const err = new Error('User not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const user = res.rows[0];
    if (currentUser.role === 'EMPLOYEE' && Number(user.id) !== Number(currentUser.userId)) {
      const err = new Error('Access denied to this user record.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
    if (currentUser.role === 'MANAGER' && Number(user.department_id) !== Number(currentUser.departmentId)) {
      const err = new Error('Access denied to users outside your department.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    let deptName = '—';
    if (user.department_id) {
      const dRes = await query('SELECT name FROM departments WHERE id = $1', [user.department_id]);
      if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
    }

    return {
      ...user,
      department_name: deptName
    };
  }

  async createUser(data) {
    return authService.register(data);
  }

  async updateUser(id, data, currentUser) {
    const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      const err = new Error('User not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const user = existing.rows[0];

    if (currentUser.role === 'EMPLOYEE') {
      if (Number(user.id) !== Number(currentUser.userId)) {
        const err = new Error('Employees can only update their own profile.');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      const updateRes = await query(
        `UPDATE users
         SET name = COALESCE($1, name), phone = COALESCE($2, phone)
         WHERE id = $3 RETURNING id, name, email, role, department_id, phone, is_active`,
        [data.name, data.phone, id]
      );
      return updateRes.rows[0];
    }

    if (currentUser.role !== 'HR') {
      const err = new Error('Only HR administrators can modify user records.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const deptId = data.department_id !== undefined ? data.department_id : data.departmentId;
    const appDate = data.appraisal_date !== undefined ? data.appraisal_date : data.appraisalDate;

    const updateRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           department_id = COALESCE($4, department_id),
           phone = COALESCE($5, phone),
           appraisal_date = COALESCE($6, appraisal_date),
           is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING id, name, email, role, department_id, phone, appraisal_date, is_active`,
      [data.name, data.email, data.role, deptId, data.phone, appDate !== undefined ? appDate : null, data.is_active, id]
    );

    if (appDate) {
      await query(`UPDATE evaluations SET cycle_date = $1 WHERE employee_id = $2`, [appDate, id]);
    }

    return updateRes.rows[0];
  }

  async deactivateUser(id) {
    const updateRes = await query(
      `UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id, name, is_active`,
      [id]
    );
    if (updateRes.rows.length === 0) {
      const err = new Error('User not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return updateRes.rows[0];
  }
}

module.exports = new UserService();
