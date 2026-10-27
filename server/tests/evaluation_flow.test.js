const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/db/seed');

describe('CAPDEX End-to-End Evaluation & AI Feedback Flow', () => {
  let hrToken, managerToken, employeeToken, employeeId;

  beforeAll(async () => {
    await seed();

    const hrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hr@capdex.com', password: 'Password123!' });
    hrToken = hrRes.body.data.token;

    const mgrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager.eng@capdex.com', password: 'Password123!' });
    managerToken = mgrRes.body.data.token;

    const empRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp.dev1@capdex.com', password: 'Password123!' });
    employeeToken = empRes.body.data.token;
    employeeId = empRes.body.data.user.id;
  });

  describe('Parameter Validation', () => {
    it('Rejects parameters if total weightage for job role exceeds 100%', async () => {
      // Role 1 (Frontend Engineer) currently sums to 100%. Adding another parameter should fail.
      const res = await request(app)
        .post('/api/parameters')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          jobRoleId: 1,
          name: 'Extra Unbudgeted Metric',
          weightage: 15
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('WEIGHTAGE_EXCEEDS_100');
    });
  });

  describe('Evaluation Submission & Mandatory Written Reasons', () => {
    it('Rejects evaluation submission if any parameter reason is missing or blank', async () => {
      const invalidPayload = {
        employee_id: employeeId,
        cycle_date: '2026-09-01',
        scores: [
          { parameter_id: 1, score: 9.0, reason: 'Great work on architecture' },
          { parameter_id: 2, score: 8.5, reason: '   ' } // Empty reason
        ]
      };

      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MANDATORY_REASON_MISSING');
    });

    it('Successfully creates evaluation with valid scores and reasons, computes overall score, and generates AI feedback', async () => {
      const validPayload = {
        employee_id: employeeId,
        cycle_date: '2026-09-01',
        scores: [
          { parameter_id: 1, score: 9.5, reason: 'Architected high performance server-side rendering pipeline.' },
          { parameter_id: 2, score: 9.0, reason: 'Optimized memory consumption and reduced bundle size by 30%.' },
          { parameter_id: 3, score: 8.5, reason: 'Consistent reviewer on pull requests, great mentorship.' },
          { parameter_id: 4, score: 8.0, reason: 'Delivered all sprint items within expected timeframes.' },
          { parameter_id: 5, score: 7.5, reason: 'Needs deeper adherence to WCAG 2.1 contrast guidelines.' }
        ]
      };

      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(Number(res.body.data.overall_score)).toBeGreaterThan(80);
      expect(res.body.data).toHaveProperty('feedback');
      expect(res.body.data.feedback).toHaveProperty('strengths_text');
      expect(res.body.data.feedback).toHaveProperty('skill_gaps_text');
      expect(res.body.data.feedback).toHaveProperty('suggestions_text');
      expect(res.body.data.feedback.strengths_text.length).toBeGreaterThan(10);
    });
  });

  describe('Employee Portal & Acknowledgment', () => {
    it('Employee can fetch their own evaluations and acknowledge them', async () => {
      const evalsRes = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(evalsRes.status).toBe(200);
      expect(evalsRes.body.data.length).toBeGreaterThan(0);
      const latestEval = evalsRes.body.data[0];

      // Acknowledge
      const ackRes = await request(app)
        .patch(`/api/evaluations/${latestEval.id}/acknowledge`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(ackRes.status).toBe(200);
      expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');
    });

    it('Employee can regenerate AI feedback', async () => {
      const evalsRes = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${employeeToken}`);
      const evalId = evalsRes.body.data[0].id;

      const regenRes = await request(app)
        .post(`/api/evaluations/${evalId}/feedback/regenerate`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(regenRes.status).toBe(200);
      expect(regenRes.body.data).toHaveProperty('strengths_text');
    });
  });

  describe('Manager Team Oversight', () => {
    it('Manager can add a comment to their team members evaluation', async () => {
      const teamEvals = await request(app)
        .get('/api/evaluations/team')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(teamEvals.status).toBe(200);
      const evalId = teamEvals.body.data[0].id;

      const commentRes = await request(app)
        .post(`/api/evaluations/${evalId}/comments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ comment_text: 'Alex has shown tremendous leadership this cycle.' });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.data.comment_text).toContain('Alex has shown tremendous leadership');
    });

    it('Manager can export team CSV report', async () => {
      const res = await request(app)
        .get('/api/reports/export?scope=team')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Employee Name');
      expect(res.text).toContain('Alex Johnson');
    });
  });
});
