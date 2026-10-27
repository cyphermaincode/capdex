const { query } = require('../db/pool');

class ParameterService {
  async getParameters(jobRoleId, currentUser) {
    if (currentUser && currentUser.role === 'EMPLOYEE') {
      const err = new Error('Employees do not have direct access to parameter configuration.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    let sql = `SELECT * FROM evaluation_parameters WHERE 1=1`;
    const params = [];

    if (jobRoleId) {
      params.push(Number(jobRoleId));
      sql += ` AND job_role_id = $${params.length}`;
    }

    sql += ` ORDER BY id ASC`;

    const res = await query(sql, params);
    const paramRows = res.rows;

    const roles = (await query('SELECT id, name, department_id FROM job_roles')).rows;
    const roleMap = {};
    roles.forEach(r => { roleMap[r.id] = r; });

    const filtered = paramRows.filter(p => {
      const role = roleMap[p.job_role_id];
      if (!role) return true;
      if (currentUser && currentUser.role === 'MANAGER') {
        return Number(role.department_id) === Number(currentUser.departmentId);
      }
      return true;
    });

    return filtered.map(p => {
      const role = roleMap[p.job_role_id];
      return {
        ...p,
        weightage: Number(p.weightage),
        job_role_name: role ? role.name : 'N/A',
        department_id: role ? role.department_id : null
      };
    });
  }

  async createParameter({ jobRoleId, name, weightage, userId }) {
    if (!jobRoleId || !name || weightage === undefined) {
      const err = new Error('jobRoleId, name, and weightage are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const weightNum = Number(weightage);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 100) {
      const err = new Error('Weightage must be an integer between 1 and 100.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const existing = await query(
      'SELECT SUM(weightage) as total FROM evaluation_parameters WHERE job_role_id = $1',
      [Number(jobRoleId)]
    );
    const currentTotal = Number(existing.rows[0]?.total || 0);

    if (currentTotal + weightNum > 100) {
      const err = new Error(`Total weightage cannot exceed 100%. Current total is ${currentTotal}%, adding ${weightNum}% would result in ${currentTotal + weightNum}%.`);
      err.status = 400;
      err.code = 'WEIGHTAGE_EXCEEDS_100';
      throw err;
    }

    const res = await query(
      `INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [Number(jobRoleId), name.trim(), weightNum, userId]
    );

    return res.rows[0];
  }

  async updateParameter(id, { name, weightage }) {
    const existingRes = await query('SELECT * FROM evaluation_parameters WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      const err = new Error('Parameter not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    const current = existingRes.rows[0];

    let newWeight = current.weightage;
    if (weightage !== undefined) {
      newWeight = Number(weightage);
      if (isNaN(newWeight) || newWeight <= 0 || newWeight > 100) {
        const err = new Error('Weightage must be between 1 and 100.');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        throw err;
      }

      const sumRes = await query(
        'SELECT SUM(weightage) as total FROM evaluation_parameters WHERE job_role_id = $1 AND id != $2',
        [current.job_role_id, id]
      );
      const otherTotal = Number(sumRes.rows[0]?.total || 0);
      if (otherTotal + newWeight > 100) {
        const err = new Error(`Total weightage for this job role cannot exceed 100%. Other parameters sum to ${otherTotal}%.`);
        err.status = 400;
        err.code = 'WEIGHTAGE_EXCEEDS_100';
        throw err;
      }
    }

    const res = await query(
      `UPDATE evaluation_parameters
       SET name = COALESCE($1, name), weightage = $2
       WHERE id = $3 RETURNING *`,
      [name ? name.trim() : null, newWeight, id]
    );

    return res.rows[0];
  }

  async submitChangeRequest(parameterId, requestedBy, requestText) {
    if (!requestText || !requestText.trim()) {
      const err = new Error('Request text is required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const res = await query(
      `INSERT INTO parameter_change_requests (parameter_id, requested_by, request_text, status)
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [parameterId, requestedBy, requestText.trim()]
    );

    return res.rows[0];
  }

  async getChangeRequests(currentUser) {
    const res = await query(`SELECT * FROM parameter_change_requests ORDER BY created_at DESC`);
    const requests = res.rows;

    const params = (await query('SELECT id, name, weightage, job_role_id FROM evaluation_parameters')).rows;
    const paramMap = {};
    params.forEach(p => { paramMap[p.id] = p; });

    const roles = (await query('SELECT id, name FROM job_roles')).rows;
    const roleMap = {};
    roles.forEach(r => { roleMap[r.id] = r.name; });

    const users = (await query('SELECT id, name FROM users')).rows;
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const enriched = requests.map(req => {
      const param = paramMap[req.parameter_id];
      const roleName = param ? roleMap[param.job_role_id] : 'N/A';
      const userName = userMap[req.requested_by] || 'N/A';
      return {
        ...req,
        parameter_name: param ? param.name : 'N/A',
        current_weightage: param ? param.weightage : 0,
        job_role_name: roleName,
        requested_by_name: userName
      };
    });

    if (currentUser && currentUser.role === 'MANAGER') {
      return enriched.filter(r => Number(r.requested_by) === Number(currentUser.userId));
    }

    return enriched;
  }

  async updateChangeRequest(id, status) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      const err = new Error('Status must be APPROVED or REJECTED.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const res = await query(
      `UPDATE parameter_change_requests SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (res.rows.length === 0) {
      const err = new Error('Change request not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return res.rows[0];
  }
}

module.exports = new ParameterService();
