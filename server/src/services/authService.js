const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const env = require('../config/env');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const userRes = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    if (userRes.rows.length === 0) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const user = userRes.rows[0];

    let deptName = '—';
    if (user.department_id) {
      const dRes = await query('SELECT name FROM departments WHERE id = $1', [user.department_id]);
      if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // Check if employee has been laid off
    if (user.is_laid_off) {
      return {
        isLaidOff: true,
        token: null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'LAID_OFF',
          departmentName: deptName,
          layoffReason: user.layoff_reason || 'Performance and delivery benchmarks were not met during the evaluation cycle.',
          hrNotes: user.layoff_hr_notes || 'A formal severance package, benefits continuation documentation, and exit guidelines will be sent to your registered email address shortly.',
          layoffApprovedAt: user.layoff_approved_at || new Date().toISOString()
        }
      };
    }

    if (!user.is_active) {
      const err = new Error('This account has been deactivated. Please contact HR.');
      err.status = 403;
      err.code = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    const payload = {
      userId: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.department_id
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

    return {
      isLaidOff: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        departmentId: user.department_id,
        departmentName: deptName,
        phone: user.phone,
        is_on_pip: Boolean(user.is_on_pip),
        pip_status: user.pip_status || 'NONE',
        pip_reason: user.pip_reason || null,
        pip_target_date: user.pip_target_date || null,
        demotion_status: user.demotion_status || 'NONE',
        demoted_title: user.demoted_title || null,
        appraisal_date: user.appraisal_date || null
      }
    };
  }

  async register({ name, email, password, role, departmentId, department_id, phone, appraisal_date, appraisalDate }) {
    if (!name || !password || !role) {
      const err = new Error('Name, password, and role are required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      const err = new Error('Email is required.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    if (!['HR', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      const err = new Error('Invalid role specified. Role must be HR, MANAGER, or EMPLOYEE.');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      const err = new Error('A user with this email address already exists.');
      err.status = 400;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const targetDept = department_id !== undefined && department_id !== ''
      ? (department_id ? Number(department_id) : null)
      : (departmentId ? Number(departmentId) : null);

    const passwordHash = await bcrypt.hash(password, 10);
    const appDate = appraisal_date || appraisalDate || null;

    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone, appraisal_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, department_id, phone, appraisal_date, created_at`,
      [name.trim(), cleanEmail, passwordHash, role, targetDept, phone || null, appDate]
    );

    return insertRes.rows[0];
  }

  async getMe(userId) {
    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);

    if (userRes.rows.length === 0) {
      const err = new Error('User profile not found.');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const user = userRes.rows[0];
    let deptName = '—';
    if (user.department_id) {
      const dRes = await query('SELECT name FROM departments WHERE id = $1', [user.department_id]);
      if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      departmentId: user.department_id,
      department_id: user.department_id,
      departmentName: deptName,
      department_name: deptName,
      phone: user.phone,
      is_active: user.is_active,
      is_on_pip: Boolean(user.is_on_pip),
      pip_status: user.pip_status || 'NONE',
      pip_reason: user.pip_reason || null,
      pip_target_date: user.pip_target_date || null,
      demotion_status: user.demotion_status || 'NONE',
      demoted_title: user.demoted_title || null,
      appraisal_date: user.appraisal_date || null,
      is_laid_off: user.is_laid_off,
      layoff_reason: user.layoff_reason,
      layoff_hr_notes: user.layoff_hr_notes,
      created_at: user.created_at
    };
  }
}

module.exports = new AuthService();
