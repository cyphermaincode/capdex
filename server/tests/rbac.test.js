const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/db/seed');

describe('CAPDEX RBAC & Authorization Boundaries', () => {
  let hrToken, managerToken, employeeToken;

  beforeAll(async () => {
    // Seed test database
    await seed();

    // 1. HR Login
    const hrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hr@capdex.com', password: 'Password123!' });
    expect(hrRes.status).toBe(200);
    hrToken = hrRes.body.data.token;

    // 2. Manager Login
    const mgrRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager.eng@capdex.com', password: 'Password123!' });
    expect(mgrRes.status).toBe(200);
    managerToken = mgrRes.body.data.token;

    // 3. Employee Login
    const empRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emp.dev1@capdex.com', password: 'Password123!' });
    expect(empRes.status).toBe(200);
    employeeToken = empRes.body.data.token;
  });

  describe('Health Check', () => {
    it('GET /api/health returns 200 without token', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('HR-Only Endpoints', () => {
    it('POST /api/users: HR allowed (201), Manager rejected (403), Employee rejected (403)', async () => {
      const newUser = {
        name: 'Test New User',
        email: 'test.new.user@capdex.com',
        password: 'Password123!',
        role: 'EMPLOYEE',
        departmentId: 1
      };

      // HR: Allowed
      const hrRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(newUser);
      expect(hrRes.status).toBe(201);
      expect(hrRes.body.data.email).toBe('test.new.user@capdex.com');

      // Manager: 403 Forbidden
      const mgrRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ ...newUser, email: 'mgr.attempt@capdex.com' });
      expect(mgrRes.status).toBe(403);
      expect(mgrRes.body.error.code).toBe('FORBIDDEN');

      // Employee: 403 Forbidden
      const empRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ ...newUser, email: 'emp.attempt@capdex.com' });
      expect(empRes.status).toBe(403);
      expect(empRes.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/analytics/organization: HR allowed (200), Manager rejected (403), Employee rejected (403)', async () => {
      const hrRes = await request(app)
        .get('/api/analytics/organization')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(hrRes.status).toBe(200);
      expect(hrRes.body.data).toHaveProperty('organizationAverageScore');

      const mgrRes = await request(app)
        .get('/api/analytics/organization')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(mgrRes.status).toBe(403);

      const empRes = await request(app)
        .get('/api/analytics/organization')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(empRes.status).toBe(403);
    });
  });

  describe('Manager-Only Endpoints', () => {
    it('GET /api/analytics/team: Manager allowed (200), HR rejected (403), Employee rejected (403)', async () => {
      const mgrRes = await request(app)
        .get('/api/analytics/team')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(mgrRes.status).toBe(200);
      expect(mgrRes.body.data).toHaveProperty('teamAverageScore');

      const hrRes = await request(app)
        .get('/api/analytics/team')
        .set('Authorization', `Bearer ${hrToken}`);
      expect(hrRes.status).toBe(403);

      const empRes = await request(app)
        .get('/api/analytics/team')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(empRes.status).toBe(403);
    });
  });

  describe('Employee-Only Endpoints', () => {
    it('POST /api/growth-goals: Employee allowed (201), HR rejected (403), Manager rejected (403)', async () => {
      const goalPayload = {
        goal_text: 'Complete React 19 and Concurrent Features Deep Dive',
        target_date: '2026-12-31'
      };

      const empRes = await request(app)
        .post('/api/growth-goals')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(goalPayload);
      expect(empRes.status).toBe(201);
      expect(empRes.body.data.goal_text).toBe(goalPayload.goal_text);

      const hrRes = await request(app)
        .post('/api/growth-goals')
        .set('Authorization', `Bearer ${hrToken}`)
        .send(goalPayload);
      expect(hrRes.status).toBe(403);

      const mgrRes = await request(app)
        .post('/api/growth-goals')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(goalPayload);
      expect(mgrRes.status).toBe(403);
    });
  });

  describe('Authentication Enforcement', () => {
    it('Rejects requests with missing or malformed JWT with 401 Unauthorized', async () => {
      const res1 = await request(app).get('/api/auth/me');
      expect(res1.status).toBe(401);
      expect(res1.body.error.code).toBe('UNAUTHORIZED');

      const res2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_jwt_token_payload');
      expect(res2.status).toBe(401);
      expect(res2.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
