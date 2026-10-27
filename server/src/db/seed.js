const bcrypt = require('bcrypt');
const { query } = require('./pool');
const { runMigrations } = require('./migrate');
const { ROLES } = require('../config/constants');

async function seed() {
  console.log('Seeding CAPDEX database with comprehensive enterprise datasets...');
  await runMigrations();

  // Clean existing tables in reverse dependency order
  const tables = [
    'promotion_readiness',
    'parameter_change_requests',
    'manager_comments',
    'growth_goals',
    'ai_feedback',
    'parameter_scores',
    'evaluations',
    'evaluation_parameters',
    'job_roles',
    'users',
    'departments'
  ];

  for (const table of tables) {
    try {
      await query(`DELETE FROM ${table}`);
    } catch (e) {
      // Table might be empty or fresh
    }
  }

  // 1. Create Departments
  const deptEng = (await query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, ['Engineering'])).rows[0];
  const deptMkt = (await query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, ['Marketing'])).rows[0];
  const deptProd = (await query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, ['Product & Design'])).rows[0];
  const deptQA = (await query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, ['Quality Assurance'])).rows[0];
  const deptSales = (await query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, ['Sales & Growth'])).rows[0];

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create HR Admin User
  const hrUser = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Sarah Jenkins (HR Admin)', 'hr@capdex.com', passwordHash, ROLES.HR, null, '+1-555-0100']
  )).rows[0];

  // 4. Create Department Managers
  const mgrEng = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['David Miller (Eng Manager)', 'manager.eng@capdex.com', passwordHash, ROLES.MANAGER, deptEng.id, '+1-555-0101']
  )).rows[0];

  const mgrMkt = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Elena Vance (Marketing Manager)', 'manager.mkt@capdex.com', passwordHash, ROLES.MANAGER, deptMkt.id, '+1-555-0102']
  )).rows[0];

  const mgrProd = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Rachel Green (Product Lead)', 'manager.prod@capdex.com', passwordHash, ROLES.MANAGER, deptProd.id, '+1-555-0103']
  )).rows[0];

  const mgrQA = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Thomas Clark (QA Director)', 'manager.qa@capdex.com', passwordHash, ROLES.MANAGER, deptQA.id, '+1-555-0104']
  )).rows[0];

  const mgrSales = (await query(
    `INSERT INTO users (name, email, password_hash, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    ['Jordan Bell (VP Sales)', 'manager.sales@capdex.com', passwordHash, ROLES.MANAGER, deptSales.id, '+1-555-0105']
  )).rows[0];

  // Link managers to departments
  await query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [mgrEng.id, deptEng.id]);
  await query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [mgrMkt.id, deptMkt.id]);
  await query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [mgrProd.id, deptProd.id]);
  await query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [mgrQA.id, deptQA.id]);
  await query(`UPDATE departments SET manager_id = $1 WHERE id = $2`, [mgrSales.id, deptSales.id]);

  // 5. Create Job Roles Across All Departments
  const roleFE = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Frontend Engineer', deptEng.id])).rows[0];
  const roleBE = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Backend Engineer', deptEng.id])).rows[0];
  const roleDevOps = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['DevOps & Cloud Engineer', deptEng.id])).rows[0];
  
  const roleMkt = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Marketing Specialist', deptMkt.id])).rows[0];
  const roleGrowth = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Growth Marketer', deptMkt.id])).rows[0];

  const rolePM = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Product Manager', deptProd.id])).rows[0];
  const roleUIUX = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['UI/UX Product Designer', deptProd.id])).rows[0];

  const roleQA = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['QA Automation Engineer', deptQA.id])).rows[0];
  const roleSales = (await query(`INSERT INTO job_roles (name, department_id) VALUES ($1, $2) RETURNING *`, ['Enterprise Account Executive', deptSales.id])).rows[0];

  // 6. Create Comprehensive Evaluation Parameters (Sum = 100% strictly for each role)
  // Frontend Engineer (30 + 25 + 20 + 15 + 10 = 100%)
  const feP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleFE.id, 'Code Quality & UI Craftsmanship', 30, hrUser.id])).rows[0];
  const feP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleFE.id, 'System Architecture & Web Performance', 25, hrUser.id])).rows[0];
  const feP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleFE.id, 'Team Collaboration & Code Reviews', 20, hrUser.id])).rows[0];
  const feP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleFE.id, 'Delivery Speed & Sprint Reliability', 15, hrUser.id])).rows[0];
  const feP5 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleFE.id, 'Accessibility (a11y) & Testing Coverage', 10, hrUser.id])).rows[0];

  // Backend Engineer (30 + 25 + 20 + 15 + 10 = 100%)
  const beP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleBE.id, 'API Architecture & System Design', 30, hrUser.id])).rows[0];
  const beP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleBE.id, 'Database Optimization & Query Indexing', 25, hrUser.id])).rows[0];
  const beP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleBE.id, 'Security, Auth & Error Handling', 20, hrUser.id])).rows[0];
  const beP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleBE.id, 'Automated Test Coverage & CI/CD', 15, hrUser.id])).rows[0];
  const beP5 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleBE.id, 'Production Reliability & Incident Response', 10, hrUser.id])).rows[0];

  // DevOps & Cloud Engineer (30 + 30 + 20 + 20 = 100%)
  const devopsP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleDevOps.id, 'CI/CD Pipeline Automation & Speed', 30, hrUser.id])).rows[0];
  const devopsP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleDevOps.id, 'Cloud Infrastructure & Terraform IaC', 30, hrUser.id])).rows[0];
  const devopsP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleDevOps.id, 'Observability, Logging & Alerting', 20, hrUser.id])).rows[0];
  const devopsP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleDevOps.id, 'Security Hardening & Secret Management', 20, hrUser.id])).rows[0];

  // Marketing Specialist (35 + 25 + 20 + 20 = 100%)
  const mktP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleMkt.id, 'Campaign ROI & Conversion Growth', 35, hrUser.id])).rows[0];
  const mktP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleMkt.id, 'Content Strategy & Copywriting Quality', 25, hrUser.id])).rows[0];
  const mktP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleMkt.id, 'Channel Analytics & SEO Performance', 20, hrUser.id])).rows[0];
  const mktP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleMkt.id, 'Brand Consistency & Cross-functional Alignment', 20, hrUser.id])).rows[0];

  // Product Manager (35 + 25 + 20 + 20 = 100%)
  const pmP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [rolePM.id, 'Product Vision & PRD Specification Quality', 35, hrUser.id])).rows[0];
  const pmP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [rolePM.id, 'Sprint Backlog Prioritization & Velocity', 25, hrUser.id])).rows[0];
  const pmP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [rolePM.id, 'User Research & Data-Driven Insights', 20, hrUser.id])).rows[0];
  const pmP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [rolePM.id, 'Stakeholder Alignment & Communication', 20, hrUser.id])).rows[0];

  // UI/UX Designer (35 + 25 + 20 + 20 = 100%)
  const uxP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleUIUX.id, 'Design System Architecture & Visual Polish', 35, hrUser.id])).rows[0];
  const uxP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleUIUX.id, 'User Flows, Wireframes & Prototypes', 25, hrUser.id])).rows[0];
  const uxP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleUIUX.id, 'Usability Testing & Iterative Discovery', 20, hrUser.id])).rows[0];
  const uxP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleUIUX.id, 'Frontend Engineering Handoff Quality', 20, hrUser.id])).rows[0];

  // QA Automation Engineer (35 + 25 + 20 + 20 = 100%)
  const qaP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleQA.id, 'Automated Test Suite Coverage & Health', 35, hrUser.id])).rows[0];
  const qaP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleQA.id, 'Bug Discovery & Root Cause Precision', 25, hrUser.id])).rows[0];
  const qaP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleQA.id, 'Regression Testing & Release Sign-Off', 20, hrUser.id])).rows[0];
  const qaP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleQA.id, 'Performance & Load Testing Execution', 20, hrUser.id])).rows[0];

  // Sales Executive (40 + 25 + 20 + 15 = 100%)
  const salesP1 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleSales.id, 'Quarterly Quota Attainment & Revenue', 40, hrUser.id])).rows[0];
  const salesP2 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleSales.id, 'Pipeline Velocity & Deal Closing Rate', 25, hrUser.id])).rows[0];
  const salesP3 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleSales.id, 'Client Retention & Account Expansion', 20, hrUser.id])).rows[0];
  const salesP4 = (await query(`INSERT INTO evaluation_parameters (job_role_id, name, weightage, created_by) VALUES ($1, $2, $3, $4) RETURNING *`, [roleSales.id, 'Product Demonstration & Value Pitching', 15, hrUser.id])).rows[0];

  // 7. Create Multiple Employees Per Department with Diverse Performance Profiles
  // Helper to insert user
  const createUser = async (name, email, role, deptId, phone) => {
    const res = await query(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email, passwordHash, role, deptId, phone]
    );
    return res.rows[0];
  };

  // --- Engineering Team ---
  const empAlex = await createUser('Alex Johnson (Senior Frontend)', 'emp.dev1@capdex.com', ROLES.EMPLOYEE, deptEng.id, '+1-555-0201'); // High (89.5%) -> PROMOTE
  const empLiam = await createUser('Liam Chen (Lead Fullstack)', 'emp.dev3@capdex.com', ROLES.EMPLOYEE, deptEng.id, '+1-555-0203'); // Top (92.0%) -> PROMOTE
  const empMarcus = await createUser('Marcus Brody (Backend Dev)', 'emp.dev2@capdex.com', ROLES.EMPLOYEE, deptEng.id, '+1-555-0202'); // Mid (78.0%) -> RETAIN & COACH
  const empSophia = await createUser('Sophia Davis (DevOps Engineer)', 'emp.devops@capdex.com', ROLES.EMPLOYEE, deptEng.id, '+1-555-0205'); // Developing (84.0%) -> RETAIN & COACH
  const empKevin = await createUser('Kevin Vance (Junior Backend)', 'emp.kevin@capdex.com', ROLES.EMPLOYEE, deptEng.id, '+1-555-0206'); // Underperformer (62.5%) -> PIP / LAYOFF RISK

  // --- Marketing Team ---
  const empSamir = await createUser('Samir Patel (Content Strategist)', 'emp.mkt2@capdex.com', ROLES.EMPLOYEE, deptMkt.id, '+1-555-0204'); // High (88.0%) -> PROMOTE
  const empChloe = await createUser('Chloe Decker (Growth Specialist)', 'emp.mkt1@capdex.com', ROLES.EMPLOYEE, deptMkt.id, '+1-555-0207'); // Solid (82.5%) -> RETAIN & COACH
  const empZoe = await createUser('Zoe Martinez (Campaign Coordinator)', 'emp.zoe@capdex.com', ROLES.EMPLOYEE, deptMkt.id, '+1-555-0208'); // Underperformer (65.0%) -> PIP / LAYOFF RISK

  // --- Product & Design Team ---
  const empMaya = await createUser('Maya Lin (Senior Product Manager)', 'emp.maya@capdex.com', ROLES.EMPLOYEE, deptProd.id, '+1-555-0209'); // Top (91.0%) -> PROMOTE
  const empEthan = await createUser('Ethan Hunt (UI/UX Designer)', 'emp.ethan@capdex.com', ROLES.EMPLOYEE, deptProd.id, '+1-555-0210'); // Solid (79.5%) -> RETAIN & COACH
  const empDaniel = await createUser('Daniel Craig (Associate PM)', 'emp.daniel@capdex.com', ROLES.EMPLOYEE, deptProd.id, '+1-555-0211'); // Underperformer (64.0%) -> PIP / LAYOFF RISK

  // --- QA Team ---
  const empNina = await createUser('Nina Williams (Senior QA Engineer)', 'emp.nina@capdex.com', ROLES.EMPLOYEE, deptQA.id, '+1-555-0212'); // High (87.5%) -> PROMOTE
  const empOscar = await createUser('Oscar Isaac (QA Tester)', 'emp.oscar@capdex.com', ROLES.EMPLOYEE, deptQA.id, '+1-555-0213'); // Mid (72.0%) -> RETAIN & COACH

  // --- Sales Team ---
  const empJessica = await createUser('Jessica Pearson (Enterprise Sales)', 'emp.jessica@capdex.com', ROLES.EMPLOYEE, deptSales.id, '+1-555-0214'); // Top (93.0%) -> PROMOTE
  const empHarvey = await createUser('Harvey Specter (Account Executive)', 'emp.harvey@capdex.com', ROLES.EMPLOYEE, deptSales.id, '+1-555-0215'); // Mid (81.5%) -> RETAIN & COACH
  const empLouis = await createUser('Louis Litt (Junior Sales Rep)', 'emp.louis@capdex.com', ROLES.EMPLOYEE, deptSales.id, '+1-555-0216'); // Underperformer (61.0%) -> PIP / LAYOFF RISK

  // 8. Helper to Seed Evaluation with Parameters, AI Feedback, Manager Comments, and Promotion Readiness
  const seedFullEvaluation = async (employee, evaluator, cycleDate, overallScore, status, scoresArray, strengths, gaps, suggestions, managerComment, mgrUser, promoStatus, promoText) => {
    const evalRow = (await query(
      `INSERT INTO evaluations (employee_id, evaluated_by, cycle_date, overall_score, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee.id, evaluator.id, cycleDate, overallScore, status]
    )).rows[0];

    for (const s of scoresArray) {
      await query(
        `INSERT INTO parameter_scores (evaluation_id, parameter_id, score, reason) VALUES ($1, $2, $3, $4)`,
        [evalRow.id, s.paramId, s.score, s.reason]
      );
    }

    await query(
      `INSERT INTO ai_feedback (evaluation_id, strengths_text, skill_gaps_text, suggestions_text) VALUES ($1, $2, $3, $4)`,
      [evalRow.id, strengths, gaps, suggestions]
    );

    if (managerComment && mgrUser) {
      await query(
        `INSERT INTO manager_comments (evaluation_id, manager_id, comment_text) VALUES ($1, $2, $3)`,
        [evalRow.id, mgrUser.id, managerComment]
      );
    }

    if (promoStatus) {
      await query(
        `INSERT INTO promotion_readiness (employee_id, score, status, recommendation_text, updated_by) VALUES ($1, $2, $3, $4, $5)`,
        [employee.id, overallScore, promoStatus, promoText, mgrUser?.id || hrUser.id]
      );
    }

    await query(`UPDATE users SET appraisal_date = $1 WHERE id = $2`, [cycleDate, employee.id]);

    return evalRow;
  };

  // --- SEED ENGINEERING EVALUATIONS ---
  // 1. Alex Johnson (Score: 89.5% -> PROMOTE)
  await seedFullEvaluation(
    empAlex, hrUser, '2026-08-01', 89.50, 'ACKNOWLEDGED',
    [
      { paramId: feP1.id, score: 9.5, reason: 'Exceptional attention to design detail, pixel-perfect implementation of new design system components.' },
      { paramId: feP2.id, score: 9.0, reason: 'Engineered critical state management optimizations reducing re-renders by 40%.' },
      { paramId: feP3.id, score: 8.5, reason: 'Active and constructive in all pull request discussions; mentored junior frontend hires.' },
      { paramId: feP4.id, score: 8.5, reason: 'Hit all key milestones for Q2 product launch ahead of schedule.' },
      { paramId: feP5.id, score: 8.0, reason: 'Consistently wrote comprehensive unit tests with 88% coverage.' }
    ],
    'Demonstrates outstanding domain expertise in modern frontend engineering, component architecture, and UI responsiveness. Highly trusted team member for complex features.',
    'Accessibility auditing and automated visual regression testing can be expanded across secondary views.',
    '1. Lead a brown-bag knowledge sharing session on frontend performance best practices.\n2. Deepen expertise in WCAG 2.1 AAA accessibility standards.\n3. Take full technical ownership of the next major UI redesign initiative.',
    'Alex is a pillar of our engineering culture and consistently drives velocity with high architectural rigor. Strongly recommend for promotion to Lead Frontend Engineer.',
    mgrEng,
    'ELIGIBLE',
    'Ready for promotion to Lead Frontend Engineer based on strong technical leadership and consistent high velocity.'
  );

  // 2. Liam Chen (Score: 92.0% -> PROMOTE)
  await seedFullEvaluation(
    empLiam, hrUser, '2026-08-01', 92.00, 'ACKNOWLEDGED',
    [
      { paramId: beP1.id, score: 9.5, reason: 'Architected high-throughput microservice handling 10,000 req/sec with zero downtime.' },
      { paramId: beP2.id, score: 9.0, reason: 'Introduced Redis caching layers and optimized PostgreSQL composite indexes.' },
      { paramId: beP3.id, score: 9.5, reason: 'Zero security regressions; implemented robust JWT and RBAC security middleware.' },
      { paramId: beP4.id, score: 9.0, reason: 'Maintained 94% integration test coverage with automated GitHub Actions pipelines.' },
      { paramId: beP5.id, score: 8.5, reason: 'Resolved critical production incidents swiftly with comprehensive post-mortems.' }
    ],
    'Mastery in fullstack and backend architecture. Liam is an exemplary top performer setting technical standards for the entire organization.',
    'Continue building cross-functional leadership and driving broader org-wide RFC reviews.',
    '1. Author org-wide guidelines for microservice contracts.\n2. Keynote technical onboarding workshops.',
    'Liam operates at a Principal Engineer level. His contributions have fundamentally modernized our infrastructure.',
    mgrEng,
    'ELIGIBLE',
    'Exemplary top performer recommended for Principal Engineer advancement.'
  );

  // 3. Marcus Brody (Score: 78.0% -> RETAIN & COACH)
  await seedFullEvaluation(
    empMarcus, hrUser, '2026-08-01', 78.00, 'ACKNOWLEDGED',
    [
      { paramId: beP1.id, score: 8.0, reason: 'Delivered core REST API endpoints on time according to Swagger specs.' },
      { paramId: beP2.id, score: 7.0, reason: 'Several unindexed slow queries required senior engineer refactoring during load tests.' },
      { paramId: beP3.id, score: 8.0, reason: 'Good adherence to security standards and input validation.' },
      { paramId: beP4.id, score: 7.5, reason: 'Unit test coverage sits around 72%; occasionally misses edge case error handlers.' },
      { paramId: beP5.id, score: 8.5, reason: 'Dependable sprint delivery and responsive during working hours.' }
    ],
    'Reliable backend contributor who writes clean code for standard endpoints.',
    'Database indexing strategies and query performance optimization require deepening.',
    '1. Pair with senior backend engineers on query optimization and EXPLAIN ANALYZE.\n2. Increase test coverage on edge-case handlers to 85%.',
    'Marcus is dependable and receptive to feedback. Recommend retaining in current band with targeted coaching on database performance before next promotion cycle.',
    mgrEng,
    'NEEDS_TRAINING',
    'Solid contributor; needs targeted coaching in database optimization and query indexing before senior promotion.'
  );

  // 4. Sophia Davis (Score: 84.0% -> RETAIN & COACH)
  await seedFullEvaluation(
    empSophia, hrUser, '2026-08-01', 84.00, 'ACKNOWLEDGED',
    [
      { paramId: devopsP1.id, score: 8.5, reason: 'Streamlined build times from 12 mins to 4 mins across core microservices.' },
      { paramId: devopsP2.id, score: 8.5, reason: 'Migrated 100% of cloud resources into modular Terraform configurations.' },
      { paramId: devopsP3.id, score: 8.0, reason: 'Implemented Grafana and Prometheus monitoring alerts for key service SLOs.' },
      { paramId: devopsP4.id, score: 8.5, reason: 'Audited cloud IAM roles and enabled least-privilege access policies.' }
    ],
    'Strong cloud infrastructure engineering and excellent execution on CI/CD pipeline automation.',
    'Incident response documentation and runbooks can be formalized for off-hours escalations.',
    '1. Lead a disaster recovery drill for core database clusters.\n2. Formalize automated rollback pipelines.',
    'Sophia is performing right at the threshold of senior level. One more solid quarter of incident response leadership will make her fully eligible for promotion.',
    mgrEng,
    'NEEDS_TRAINING',
    'Close to promotion threshold (84%); recommend finalizing disaster recovery runbooks to qualify.'
  );

  // 5. Kevin Vance (Score: 62.5% -> PIP / LAYOFF RISK)
  await seedFullEvaluation(
    empKevin, hrUser, '2026-08-01', 62.50, 'SUBMITTED',
    [
      { paramId: beP1.id, score: 6.0, reason: 'Frequent API schema mismatches and breaking changes pushed without versioning.' },
      { paramId: beP2.id, score: 5.5, reason: 'Multiple N+1 query antipatterns introduced into production causing latency spikes.' },
      { paramId: beP3.id, score: 6.5, reason: 'Missed sanitization on user input fields during code review cycle.' },
      { paramId: beP4.id, score: 6.5, reason: 'Test coverage below team minimum (54%); failed CI builds on branch merges.' },
      { paramId: beP5.id, score: 7.0, reason: 'Attended daily standups but missed 2 critical sprint delivery deadlines.' }
    ],
    'Shows basic programming competence in Node.js syntax.',
    'Significant skill gaps across API design, SQL query efficiency, automated testing, and sprint delivery reliability.',
    '1. Enroll immediately in a structured 30-day Performance Improvement Plan (PIP).\n2. Mandatory pair programming on all PRs with a designated mentor.\n3. Complete backend security and database optimization remediations.',
    'Kevin has struggled to meet standard sprint commitments and code quality expectations. Recommend initiating a formal 30-day PIP with clear weekly milestones; if standards are not met, recommend restructuring/offboarding.',
    mgrEng,
    'NEEDS_TRAINING',
    'Underperforming relative to band expectations (62.5%). Formal PIP or role realignment recommended.'
  );

  // --- SEED MARKETING EVALUATIONS ---
  // Chloe Decker (82.5% -> RETAIN & COACH)
  await seedFullEvaluation(
    empChloe, hrUser, '2026-08-01', 82.50, 'ACKNOWLEDGED',
    [
      { paramId: mktP1.id, score: 8.5, reason: 'Generated 25% increase in qualified inbound leads through optimized paid channels.' },
      { paramId: mktP2.id, score: 8.0, reason: 'High quality copy across email and social media landing pages.' },
      { paramId: mktP3.id, score: 8.0, reason: 'Improved organic search ranking for 5 target industry keywords.' },
      { paramId: mktP4.id, score: 8.5, reason: 'Collaborated seamlessly with product design to align visual brand identity.' }
    ],
    'Strong cross-channel campaign orchestration and quantifiable ROI improvement in inbound conversion funnel.',
    'Further depth in automated marketing analytics and multi-touch attribution modeling.',
    '1. Partner with data analytics team to implement multi-touch attribution.\n2. Lead a large-scale product marketing launch campaign.',
    'Chloe has driven tangible inbound lead growth. Recommend retaining with stretch assignments before senior marketing specialist nomination.',
    mgrMkt,
    'NEEDS_TRAINING',
    'Solid performance; recommended to lead one additional cross-departmental campaign before senior role.'
  );

  // Samir Patel (88.0% -> PROMOTE)
  await seedFullEvaluation(
    empSamir, hrUser, '2026-08-01', 88.00, 'ACKNOWLEDGED',
    [
      { paramId: mktP1.id, score: 9.0, reason: 'Drove 40% growth in organic traffic through viral content and SEO pillars.' },
      { paramId: mktP2.id, score: 9.0, reason: 'Author of top-converting industry whitepapers and case studies.' },
      { paramId: mktP3.id, score: 8.5, reason: 'Advanced mastery of Google Analytics 4 and custom conversion tracking.' },
      { paramId: mktP4.id, score: 8.5, reason: 'Exemplary brand guardian and active cross-team communicator.' }
    ],
    'Exceptional content strategist with proven ability to translate complex product capabilities into high-converting narratives.',
    'Expand video marketing and interactive web tools.',
    '1. Develop an executive thought-leadership series.\n2. Mentor junior copywriters on SEO best practices.',
    'Samir is a high-performing creative anchor who has single-handedly elevated our organic brand presence. Strongly endorse for promotion to Content Director.',
    mgrMkt,
    'ELIGIBLE',
    'Ready for promotion to Content Director based on market impact and content velocity.'
  );

  // Zoe Martinez (65.0% -> PIP / LAYOFF RISK)
  await seedFullEvaluation(
    empZoe, hrUser, '2026-08-01', 65.00, 'SUBMITTED',
    [
      { paramId: mktP1.id, score: 6.0, reason: 'Paid campaign ad spend exceeded budget by 20% with below-target ROAS (0.8x).' },
      { paramId: mktP2.id, score: 6.5, reason: 'Copy drafts contained multiple grammatical errors requiring extensive rework.' },
      { paramId: mktP3.id, score: 6.5, reason: 'Difficulty interpreting cohort retention data and channel analytics.' },
      { paramId: mktP4.id, score: 7.0, reason: 'Participates in marketing standups but lacks proactive execution.' }
    ],
    'Demonstrates enthusiasm for brand marketing and visual assets.',
    'Critical gaps in ROI management, analytical rigor, and copy accuracy.',
    '1. Implement a 30-day PIP with strict ROAS and conversion targets.\n2. Mandatory copywriting review checkpoint before publishing.',
    'Zoe has struggled to deliver ROI on campaign budgets. A structured 30-day improvement plan is required to determine viability.',
    mgrMkt,
    'NEEDS_TRAINING',
    'Underperforming in campaign ROI and analytical rigor. Placed on coaching plan.'
  );

  // --- SEED PRODUCT & DESIGN EVALUATIONS ---
  // Maya Lin (91.0% -> PROMOTE)
  await seedFullEvaluation(
    empMaya, hrUser, '2026-08-01', 91.00, 'ACKNOWLEDGED',
    [
      { paramId: pmP1.id, score: 9.5, reason: 'Penned comprehensive, crystal-clear PRDs with edge cases and zero engineering ambiguity.' },
      { paramId: pmP2.id, score: 9.0, reason: 'Maintained 95% sprint commitment delivery across 6 consecutive release cycles.' },
      { paramId: pmP3.id, score: 9.0, reason: 'Conducted 25 customer discovery interviews uncovering key retention insights.' },
      { paramId: pmP4.id, score: 8.5, reason: 'Masterful stakeholder alignment between Sales, Engineering, and Executive leadership.' }
    ],
    'World-class product leadership, impeccable PRD drafting, and deep customer empathy.',
    'Continue mentoring associate product managers on roadmap prioritization matrices.',
    '1. Lead quarterly product roadmap planning sessions org-wide.\n2. Present product strategy to Executive Board.',
    'Maya is an outstanding product strategist who commands respect across all engineering and executive teams. Unanimous support for promotion to Group Product Manager.',
    mgrProd,
    'ELIGIBLE',
    'Ready for promotion to Group Product Manager.'
  );

  // Ethan Hunt (79.5% -> RETAIN & COACH)
  await seedFullEvaluation(
    empEthan, hrUser, '2026-08-01', 79.50, 'ACKNOWLEDGED',
    [
      { paramId: uxP1.id, score: 8.5, reason: 'Created beautiful, modern UI Figma components for the design system.' },
      { paramId: uxP2.id, score: 8.0, reason: 'Solid wireframing and prototyping for core feature flows.' },
      { paramId: uxP3.id, score: 7.0, reason: 'Usability testing sessions were conducted infrequently prior to development handoff.' },
      { paramId: uxP4.id, score: 8.0, reason: 'Collaborated well with frontend engineers during sprint demos.' }
    ],
    'Strong aesthetic craftsmanship, visual hierarchy, and component design in Figma.',
    'Usability research and user testing methodologies require more systematic integration.',
    '1. Conduct weekly usability testing sessions on interactive prototypes.\n2. Document accessibility contrast tokens in design system.',
    'Ethan is a skilled designer with great visual sensibility. Coaching him to incorporate rigorous user research before pushing designs to engineering.',
    mgrProd,
    'NEEDS_TRAINING',
    'Solid visual designer; coaching focused on proactive user testing before senior role.'
  );

  // Daniel Craig (64.0% -> PIP / LAYOFF RISK)
  await seedFullEvaluation(
    empDaniel, hrUser, '2026-08-01', 64.00, 'SUBMITTED',
    [
      { paramId: pmP1.id, score: 6.0, reason: 'PRDs lacked technical detail and missed key edge cases, causing 2-week engineering delays.' },
      { paramId: pmP2.id, score: 6.5, reason: 'Sprint backlog was often unrefined on sprint planning days.' },
      { paramId: pmP3.id, score: 6.5, reason: 'Relied on assumptions rather than customer research or usage data.' },
      { paramId: pmP4.id, score: 7.0, reason: 'Communication with engineering was reactive and inconsistent.' }
    ],
    'Good interpersonal communication during team social events.',
    'Severe shortcomings in PRD thoroughness, backlog management, and analytical rigor.',
    '1. 30-day PIP targeting PRD completeness and on-time backlog readiness.\n2. Weekly PRD reviews with Product Lead.',
    'Daniel requires significant coaching to meet the baseline standards of product management. Placed on structured improvement plan.',
    mgrProd,
    'NEEDS_TRAINING',
    'Below band expectations (64.0%). Placed on formal PIP.'
  );

  // --- SEED QA EVALUATIONS ---
  // Nina Williams (87.5% -> PROMOTE)
  await seedFullEvaluation(
    empNina, hrUser, '2026-08-01', 87.50, 'ACKNOWLEDGED',
    [
      { paramId: qaP1.id, score: 9.0, reason: 'Engineered robust Playwright E2E test suite covering 90% of user journeys.' },
      { paramId: qaP2.id, score: 9.0, reason: 'Discovered 4 critical security & race condition bugs prior to production releases.' },
      { paramId: qaP3.id, score: 8.5, reason: 'Maintained zero regression escapes to production across last 3 quarters.' },
      { paramId: qaP4.id, score: 8.5, reason: 'Executed automated load tests using k6 identifying bottleneck queries.' }
    ],
    'Premier test automation engineer who ensures rock-solid production stability and zero critical escapes.',
    'Expand performance testing into automated nightly CI runs.',
    '1. Architect automated visual regression suite.\n2. Lead QA workshop on contract testing.',
    'Nina has transformed our QA posture from reactive testing to automated engineering excellence. Strongly recommend for Lead QA Engineer promotion.',
    mgrQA,
    'ELIGIBLE',
    'Ready for promotion to Lead QA Engineer.'
  );

  // --- SEED SALES EVALUATIONS ---
  // Jessica Pearson (93.0% -> PROMOTE)
  await seedFullEvaluation(
    empJessica, hrUser, '2026-08-01', 93.00, 'ACKNOWLEDGED',
    [
      { paramId: salesP1.id, score: 9.5, reason: 'Achieved 145% of Q2 annual contract value (ACV) quota, closing $1.2M in revenue.' },
      { paramId: salesP2.id, score: 9.0, reason: 'Reduced average enterprise sales cycle from 90 days to 42 days.' },
      { paramId: salesP3.id, score: 9.5, reason: '100% net revenue retention across all managed enterprise accounts.' },
      { paramId: salesP4.id, score: 9.0, reason: 'Exceptional executive presence in Fortune 500 demos and RFP defenses.' }
    ],
    'Unsurpassed revenue generation, executive sales acumen, and client partnership mastery.',
    'Coach junior account executives on enterprise deal structuring.',
    '1. Establish enterprise sales playbook for global market expansion.\n2. Lead strategic account reviews.',
    'Jessica is our top revenue producer company-wide. Phenomenal performance and absolute top recommendation for VP / Director of Enterprise Sales.',
    mgrSales,
    'ELIGIBLE',
    'Top performer company-wide; recommended for Director of Enterprise Sales.'
  );

  // Louis Litt (61.0% -> PIP / LAYOFF RISK)
  await seedFullEvaluation(
    empLouis, hrUser, '2026-08-01', 61.00, 'SUBMITTED',
    [
      { paramId: salesP1.id, score: 5.5, reason: 'Closed only 45% of quarterly quota; struggled to advance pipeline deals.' },
      { paramId: salesP2.id, score: 6.0, reason: 'High drop-off rate after initial product demonstration.' },
      { paramId: salesP3.id, score: 6.5, reason: '2 key customer accounts churned due to inadequate post-sale follow-up.' },
      { paramId: salesP4.id, score: 6.5, reason: 'Sales pitches lacked customized value propositions for prospective buyers.' }
    ],
    'Punctual and consistent in logging CRM activities.',
    'Significant deficit in quota achievement, deal qualification, and objection handling.',
    '1. 30-day PIP requiring 20 discovery calls per week and 3 closed deals.\n2. Mandatory pitch coaching with Sales Director.',
    'Louis has missed quota for two consecutive quarters. Formal PIP initiated; if targets are not met by end of month, contract termination will proceed.',
    mgrSales,
    'NEEDS_TRAINING',
    'Below minimum revenue quota (61.0%). Initiated 30-day PIP; layoff risk if unrecovered.'
  );

  // Seed Growth Goals for Alex, Chloe, Marcus, Liam, and Kevin
  await query(
    `INSERT INTO growth_goals (employee_id, goal_text, target_date, status) VALUES ($1, $2, '2026-11-30', 'IN_PROGRESS')`,
    [empAlex.id, 'Obtain Web Accessibility Specialist (WAS) certification and complete full audit of Capdex dashboard.']
  );
  await query(
    `INSERT INTO growth_goals (employee_id, goal_text, target_date, status) VALUES ($1, $2, '2026-10-15', 'IN_PROGRESS')`,
    [empMarcus.id, 'Refactor top 5 database queries with composite B-Tree indexes and eliminate all N+1 query patterns.']
  );
  await query(
    `INSERT INTO growth_goals (employee_id, goal_text, target_date, status) VALUES ($1, $2, '2026-09-30', 'IN_PROGRESS')`,
    [empKevin.id, 'Achieve 85% unit test coverage on all assigned backend modules with zero regression escapes.']
  );
  await query(
    `INSERT INTO growth_goals (employee_id, goal_text, target_date, status) VALUES ($1, $2, '2026-12-31', 'IN_PROGRESS')`,
    [empLiam.id, 'Architect event-driven message queue system with Apache Kafka and lead engineering tech talk.']
  );

  console.log('CAPDEX database successfully seeded with 16 employees across 5 departments, 9 job roles, 40+ parameters, and evaluations!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
