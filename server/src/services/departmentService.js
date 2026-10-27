const { query } = require('../db/pool');

class DepartmentService {
  async getDepartments(currentUser) {
    let sql = `SELECT * FROM departments`;
    const params = [];

    if (currentUser && currentUser.role === 'MANAGER') {
      sql += ` WHERE id = $1`;
      params.push(currentUser.departmentId);
    }
    sql += ` ORDER BY id ASC`;

    const res = await query(sql, params);
    const depts = res.rows;

    const allUsers = (await query('SELECT id, name, email, role, department_id, is_active FROM users')).rows;

    return depts.map(d => {
      const manager = d.manager_id ? allUsers.find(u => Number(u.id) === Number(d.manager_id)) : null;
      const empCount = allUsers.filter(u => Number(u.department_id) === Number(d.id) && u.role === 'EMPLOYEE' && u.is_active).length;
      return {
        ...d,
        manager_name: manager ? manager.name : null,
        manager_email: manager ? manager.email : null,
        employee_count: empCount
      };
    });
  }

  async getDepartmentById(id, currentUser) {
    if (currentUser && currentUser.role === 'MANAGER' && Number(currentUser.departmentId) !== Number(id)) {
      const err = new Error('Access denied to other departments.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const res = await query(`SELECT * FROM departments WHERE id = $1`, [id]);

    if (res.rows.length === 0) {
      const err = new Error('Department not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const dept = res.rows[0];
    let mgrName = null;
    let mgrEmail = null;
    if (dept.manager_id) {
      const uRes = await query('SELECT name, email FROM users WHERE id = $1', [dept.manager_id]);
      if (uRes.rows.length > 0) {
        mgrName = uRes.rows[0].name;
        mgrEmail = uRes.rows[0].email;
      }
    }

    return {
      ...dept,
      manager_name: mgrName,
      manager_email: mgrEmail
    };
  }

  async createDepartment({ name, manager_id }) {
    if (!name || !name.trim()) {
      const err = new Error('Department name is required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const res = await query(
      `INSERT INTO departments (name, manager_id) VALUES ($1, $2) RETURNING *`,
      [name.trim(), manager_id ? Number(manager_id) : null]
    );

    return res.rows[0];
  }

  async updateDepartment(id, { name, manager_id }) {
    const res = await query(
      `UPDATE departments
       SET name = COALESCE($1, name), manager_id = $2
       WHERE id = $3 RETURNING *`,
      [name ? name.trim() : null, manager_id ? Number(manager_id) : null, id]
    );

    if (res.rows.length === 0) {
      const err = new Error('Department not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return res.rows[0];
  }
}

module.exports = new DepartmentService();
