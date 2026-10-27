const { query } = require('../db/pool');

class JobRoleService {
  async getJobRoles(departmentId, currentUser) {
    let sql = `SELECT * FROM job_roles WHERE 1=1`;
    const params = [];

    if (currentUser && currentUser.role === 'MANAGER') {
      sql += ` AND department_id = $1`;
      params.push(currentUser.departmentId);
    } else if (departmentId) {
      params.push(departmentId);
      sql += ` AND department_id = $${params.length}`;
    }
    sql += ` ORDER BY id ASC`;

    const res = await query(sql, params);
    const roles = res.rows;

    const depts = (await query('SELECT id, name FROM departments')).rows;
    const deptMap = {};
    depts.forEach(d => { deptMap[d.id] = d.name; });

    const allParams = (await query('SELECT id, job_role_id FROM evaluation_parameters')).rows;

    return roles.map(r => ({
      ...r,
      department_name: deptMap[r.department_id] || 'General',
      parameter_count: allParams.filter(p => Number(p.job_role_id) === Number(r.id)).length
    }));
  }

  async createJobRole({ name, department_id }) {
    if (!name || !department_id) {
      const err = new Error('Job role name and department_id are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const res = await query(
      `INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`,
      [name.trim(), Number(department_id)]
    );

    return res.rows[0];
  }
}

module.exports = new JobRoleService();
