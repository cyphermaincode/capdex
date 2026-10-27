const { query } = require('../db/pool');

class ReportService {
  async exportCSV(scope, currentUser) {
    if (currentUser.role === 'EMPLOYEE') {
      const err = new Error('Employees cannot export departmental or organizational reports.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (currentUser.role === 'MANAGER' && scope === 'org') {
      const err = new Error('Managers can only export team-level reports.');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const evalRes = await query(`SELECT * FROM evaluations ORDER BY cycle_date DESC, id DESC`);
    const allEvals = evalRes.rows;

    const rows = [];
    for (const e of allEvals) {
      const uRes = await query(`SELECT name, email, department_id FROM users WHERE id = $1`, [e.employee_id]);
      const emp = uRes.rows[0];
      if (!emp) continue;

      if (currentUser.role === 'MANAGER' || scope === 'team') {
        const deptId = currentUser.role === 'MANAGER' ? currentUser.departmentId : (currentUser.departmentId || 1);
        if (Number(emp.department_id) !== Number(deptId)) continue;
      }

      let deptName = 'N/A';
      if (emp.department_id) {
        const dRes = await query(`SELECT name FROM departments WHERE id = $1`, [emp.department_id]);
        if (dRes.rows.length > 0) deptName = dRes.rows[0].name;
      }

      const fbRes = await query(`SELECT strengths_text, skill_gaps_text FROM ai_feedback WHERE evaluation_id = $1`, [e.id]);
      const fb = fbRes.rows[0] || {};

      const prRes = await query(`SELECT status FROM promotion_readiness WHERE employee_id = $1`, [e.employee_id]);
      const pr = prRes.rows[0] || {};

      rows.push([
        emp.name,
        emp.email,
        deptName,
        e.cycle_date,
        e.overall_score,
        e.status,
        (fb.strengths_text || '').replace(/\n/g, ' '),
        (fb.skill_gaps_text || '').replace(/\n/g, ' '),
        pr.status || 'N/A'
      ]);
    }

    const headers = ['Employee Name', 'Email', 'Department', 'Cycle Date', 'Overall Score', 'Status', 'Strengths', 'Skill Gaps', 'Promotion Status'];

    const escapeCsv = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ];

    return csvLines.join('\r\n');
  }
}

module.exports = new ReportService();
