PRODUCT REQUIREMENTS DOCUMENT
CAPDEX
Role-Based Employee Performance Assessment
& AI-Assisted Growth Tracking System
Build-Ready Specification for Autonomous AI Development Agents
Document Type
Product Requirements Document (PRD) + AI Agent Build Brief
Source Reference
CAPDEX Role Specification & Build Guide (Capstone)
Project Team
Kartik Aditya (23BCI0042) • Pranath V (23BDS0241) • Charvi Sood (23BCE2202)
Department
Computer Science and Engineering, VIT Vellore
Faculty Guide
Dr. Sujatha V
Target Builder
Autonomous AI coding agent (e.g. Claude Code) — zero-touch build
Version
1.0 — Build-Ready
Date
August 30, 2026
Table of Contents
(Right-click the field below and choose “Update Field” in Word to populate page numbers.)
1. Executive Summary & Purpose of This Document
This PRD converts the CAPDEX capstone specification into a single, self-contained brief that an autonomous AI coding agent can execute end-to-end — from an empty repository to a fully running, three-portal web application — without further clarification from a human.
CAPDEX is a centralized web platform that replaces manual, subjective employee appraisal with a standardized, transparent, AI-assisted evaluation process. Three role-scoped portals (HR, Manager, Employee) sit on one shared backend and database, each exposing strictly different screens and permissions.
1.1 What “Complete” Means for This Build
The agent must not stop at scaffolding. “Complete” means:
Every endpoint in Section 8 (API Specification) is implemented, authenticated, and role-guarded — not stubbed.
The database schema in Section 7 is created via migrations and seeded with demo data covering all three roles.
All three portals in Section 6 are navigable, wired to real API calls (no mock/hardcoded UI data), and reflect the permission matrix in Section 5 exactly.
The AI feedback module (Section 9) works in both a live OpenAI-key mode and a zero-key offline fallback mode, so the app is fully demoable without a paid API key.
The app runs locally end-to-end with a single documented command sequence, and a README.md (Section 12) is generated at the project root describing exactly how.
The acceptance checklist in Section 13 passes before the build is considered done.
Agent directive:
Treat every requirement below as mandatory unless explicitly marked optional. Where the source specification is ambiguous, this document resolves the ambiguity — follow this document over assumptions. Do not ask the user clarifying questions before starting; make the reasonable choice documented here and proceed.
2. Product Overview & Goals
2.1 Problem Statement
Traditional employee appraisal is manual, inconsistent across evaluators, and rarely explains itself — employees receive a number with little actionable context, and organizations cannot track growth trends over time in a structured way.
2.2 Core Idea
Every employee is evaluated against role-specific parameters, not a one-size-fits-all form. HR defines these parameters per job role and enters scores together with a mandatory written justification. Every evaluation is stored permanently so growth can be tracked over time. An AI module reads the scores and justification and produces personalized, human-readable feedback — strengths, skill gaps, and development suggestions — for the employee.
2.3 Goals
Standardize evaluation criteria per job role instead of a generic company-wide form.
Make every score explainable via a mandatory written reason, never a bare number.
Give employees actionable, AI-generated, personalized feedback instead of a static rating.
Give managers team-scoped visibility and analytics without cross-department leakage.
Give HR organization-wide administrative control and the sole ability to define the rules of the system.
Enforce every permission boundary identically on the frontend (UX) and backend (security) — the frontend guard is a UX convenience, the backend guard is the real control.
2.4 Non-Goals (Out of Scope for v1)
Mobile native applications (listed under Future Scope, Section 14).
Face-recognition authentication.
Third-party ERP/LMS integrations.
Multi-tenant / multi-company SaaS support.
2.5 Primary Personas
Persona
Role Code
Primary Need
HR Administrator
HR
Configure the system, run evaluations, see everything, manage accounts
Team Manager
MANAGER
See own team's performance, recommend action, cannot alter raw scores
Individual Employee
EMPLOYEE
See own performance, own AI feedback, set own growth goals
3. System Architecture
3.1 Three-Tier Architecture
The system follows a standard three-tier web architecture with a strict separation of concerns:
Frontend layer — one React application containing all three portals, with role-based client-side routing.
Backend layer — a Node.js + Express REST API that re-validates authentication and role permissions on every single request, independent of what the frontend already checked.
Data & intelligence layer — a PostgreSQL relational database for all structured records, plus an AI provider abstraction (OpenAI API by default, offline fallback available) invoked server-side only.
3.2 Request Flow
Browser (React portal, role-guarded routes)
        │  fetch/axios + Authorization: Bearer <JWT>
        ▼
REST API (Express)  ──►  authenticate middleware (verifies JWT)
        │                ──►  authorize(...roles) middleware (checks role)
        ▼
Route handler  ──►  PostgreSQL (pg Pool)
        │        └─►  AI Provider (OpenAI API or offline fallback)
        ▼
JSON response  ──►  rendered back into the calling portal
3.3 Repository Layout
The agent must create this exact top-level structure:
capdex/
├── server/                  Express REST API
│   ├── src/
│   │   ├── config/          env loading, db pool, constants
│   │   ├── middleware/      authenticate.js, authorize.js, errorHandler.js
│   │   ├── routes/          one file per resource (auth, users, departments, ...)
│   │   ├── controllers/     request handlers, one per route file
│   │   ├── services/        db queries + business logic, ai/feedbackService.js
│   │   ├── db/              migrations/, seed.js, pool.js
│   │   └── app.js           Express app assembly
│   ├── tests/                Jest + Supertest
│   ├── .env.example
│   ├── package.json
│   └── index.js              server entrypoint
├── client/                   React app (Vite)
│   ├── src/
│   │   ├── api/              axios instance + per-resource API modules
│   │   ├── auth/             AuthContext, ProtectedRoute, token storage
│   │   ├── components/       shared UI (charts, tables, forms, nav)
│   │   ├── pages/
│   │   │   ├── hr/           HR portal screens
│   │   │   ├── manager/      Manager portal screens
│   │   │   ├── employee/     Employee portal screens
│   │   │   └── auth/         Login, Landing
│   │   ├── router.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── docs/
│   └── PRD.md                this document, mirrored in-repo as Markdown
├── README.md                 root README, see Section 12
└── .gitignore
4. Authentication & Role Selection Flow
All users share a single entry point. A role-specific screen is never shown until the user has both logged in and had their role resolved server-side. Implement exactly this sequence:
Landing page — public marketing/info page with a “Sign In” button; no data is fetched or shown here.
Sign-in page — a single form (email + password) shared by all users; there is no separate URL per role at this stage.
Credential check — the backend authenticates the email/password against the Users table (bcrypt compare) and issues a signed JWT.
Role resolution — the user's role is stored server-side in the Users table at account-creation time, never chosen freely at login. The JWT payload embeds it: { userId, role, departmentId }.
Automatic redirect — immediately after login the frontend decodes the role from the JWT and redirects: HR → /hr/dashboard, Manager → /manager/dashboard, Employee → /employee/dashboard. A user never manually chooses a role they are not assigned.
Route guarding — every frontend route is wrapped in a <ProtectedRoute role=…> component that checks the JWT role before rendering; every backend endpoint re-checks the same role server-side via the authorize middleware. Never trust the frontend alone.
Session persistence — store the JWT in memory plus a secure httpOnly-style storage strategy appropriate for a SPA (Section 10.3), attach it to every API call via the Authorization header, and clear it on logout or expiry.
Account provisioning rule:
New accounts are provisioned only by HR through POST /api/auth/register, with a fixed, pre-assigned role. There is no public self-registration and no role picker anywhere in the UI. This is what makes the access control meaningful — the agent must not add a public sign-up form.
5. Master Role Permission Matrix
This table is the single source of truth for what each role can view and modify across every screen. It must be encoded directly into the backend authorization middleware (Section 10.2) — the frontend must never be the only place a restriction is enforced.
Feature / Screen
HR Admin
Manager
Employee
Login & Role Selection
Full access
Full access
Full access
Create / Edit Employee Records
View + Modify
View only
No access
Define Departments & Job Roles
View + Modify
View only
No access
Create / Edit Evaluation Parameters
View + Modify
Request changes (no direct edit)
No access
Conduct Employee Evaluation (score entry)
View + Modify
No access
No access
Mandatory Evaluation Reason / Justification
View + Modify
View only
View only (own)
View Individual Evaluation History
View (all employees)
View (own team only)
View (own record only)
AI-Generated Feedback
View (all)
View (own team)
View (own) + request regeneration
Workforce Analytics Dashboard
View (organization-wide)
View (own department/team)
No access
Promotion Readiness Ranking
View + Modify status
View (own team) + Recommend
No access
Department Reports Export
View + Modify + Export
View + Export (own team)
No access
Personal Performance Dashboard
View (all)
View (own + team)
View (own only)
Growth Tracker / Timeline
View (all employees)
View (own team)
View + set personal goals (own)
User Account Management
View + Modify
No access
No access
System Configuration / Weightage Settings
View + Modify
No access
No access
Legend: “View + Modify” = full CRUD rights on that resource. “View only” = read-only, no edit/delete. “No access” = the endpoint must return HTTP 403 Forbidden and the corresponding screen must not render or must redirect.
6. Detailed Portal-by-Portal Role Descriptions
6.1 HR Portal — “The Administrator”
The only role with organization-wide, cross-department visibility and the only role that can configure the rules of the system itself.
Can VIEW
Can MODIFY / ACTION
Full employee directory across all departments
Create, edit, deactivate employee records
All evaluation parameters and their weightages
Create departments and job roles
Every employee's complete evaluation history
Create/edit evaluation parameters per job role and set weightages
AI-generated feedback for any employee
Enter parameter-wise scores for an employee
Organization-wide analytics (averages, trends, distribution)
Attach the mandatory written reason/justification for each score
Promotion-readiness rankings for all departments
Create new user accounts and assign HR / Manager / Employee role
User accounts and their assigned roles
Approve/override promotion-readiness status; export org reports
6.2 Manager Portal — “The Team Overseer”
Visibility scoped strictly to the manager's own team/department; cannot see other departments and cannot create parameters or enter raw scores (that stays with HR to preserve standardization).
Can VIEW
Can MODIFY / ACTION
Workforce dashboard for their own team/department only
Submit promotion / training recommendations (routed to HR for final action)
Team-level analytics: average performance, top vs. needs-improvement
Request a change to an evaluation parameter (sent to HR, not applied directly)
Each of their employees' evaluation history and AI feedback
Export their own team's reports
Promotion-readiness ranking for their own team
Add manager-level comments/notes on an employee's growth trajectory
Department reports scoped to their team
6.3 Employee Portal — “The Individual Contributor”
The strictest role: an employee can only ever see their own data, with no organizational or team-wide visibility at all.
Can VIEW
Can MODIFY / ACTION
Their own overall performance score and score breakdown by parameter
Set personal development goals against identified skill gaps
Their own complete evaluation history (past cycles)
Request AI feedback regeneration / ask follow-up questions on their feedback
Their own AI-generated feedback, strengths, and skill gaps
Update their own basic profile information (contact details, not evaluation data)
Their own growth-tracker timeline/chart
Acknowledge / mark an evaluation as reviewed
7. Database Schema
PostgreSQL is used because evaluation data is highly structured and relationships between employees, parameters, and scores must stay consistent. Implement as SQL migrations (Section 10.1), not ad-hoc table creation.
7.1 Entities
Table
Key Columns
Notes
Users
id, name, email (unique), password_hash, role, department_id, created_at
role ∈ {HR, MANAGER, EMPLOYEE}; department_id nullable for HR
Departments
id, name, manager_id
manager_id references Users
JobRoles
id, name, department_id
one department has many job roles
EvaluationParameters
id, job_role_id, name, weightage, created_by
weightages for a job role should sum to 100
Evaluations
id, employee_id, evaluated_by, cycle_date, overall_score, status
status ∈ {DRAFT, SUBMITTED, ACKNOWLEDGED}
ParameterScores
id, evaluation_id, parameter_id, score, reason
reason is NOT NULL — enforce at DB and API level
AIFeedback
id, evaluation_id, strengths_text, skill_gaps_text, suggestions_text, generated_at
one-to-one with Evaluations
GrowthGoals
id, employee_id, goal_text, target_date, status
status ∈ {OPEN, IN_PROGRESS, DONE}; employee-set
ManagerComments
id, evaluation_id, manager_id, comment_text, created_at
supports Section 6.2 manager notes
ParameterChangeRequests
id, parameter_id, requested_by, request_text, status
status ∈ {PENDING, APPROVED, REJECTED}; supports manager → HR requests
7.2 Relationships
One Department has many Users (employees) and many JobRoles.
One JobRole has many EvaluationParameters.
One Evaluation has many ParameterScores and exactly one AIFeedback record.
One Employee (User) has many Evaluations and many GrowthGoals.
Every table that stores employee data carries a foreign key back to Users, so row-level access control is enforced simply by filtering on department_id or employee_id in the service layer — never by trusting a client-supplied filter.
7.3 Row-Level Access Rule (applies to every query)
Security rule:
Every service-layer query that returns employee-scoped data must filter server-side using req.user (from the verified JWT), never using a value taken from the request body or query string. Example: a Manager's team query filters by WHERE department_id = req.user.departmentId, not by any department_id the client sends.
8. REST API Specification
This is the authoritative endpoint contract. Every row must be implemented as a real, tested route — not scaffolded and left empty. All endpoints except auth/login and the health check require a valid JWT via authenticate middleware, and every non-public endpoint additionally passes through authorize(...roles).
8.1 Auth
Method & Path
Roles
Description
POST /api/auth/register
HR
Create a new user account with a fixed, pre-assigned role (HR / MANAGER / EMPLOYEE).
POST /api/auth/login
Public
Verify credentials, return a signed JWT { userId, role, departmentId }.
GET /api/auth/me
Any authenticated
Return the current user's profile derived from the JWT.
POST /api/auth/logout
Any authenticated
Invalidate/clear the client-side session (stateless JWT: client discards token).
8.2 Users, Departments & Job Roles (HR configuration)
Method & Path
Roles
Description
GET /api/users
HR
List all users org-wide; supports ?department_id filter.
POST /api/users
HR
Create an employee/manager record (delegates to register for login credentials).
PUT /api/users/:id
HR
Edit a user record.
DELETE /api/users/:id
HR
Deactivate (soft-delete) a user.
GET /api/departments
HR (all), Manager (own)
List departments.
POST /api/departments
HR
Create a department.
PUT /api/departments/:id
HR
Edit a department.
GET /api/job-roles?departmentId=
HR (all), Manager (own dept)
List job roles.
POST /api/job-roles
HR
Create a job role under a department.
8.3 Evaluation Parameters
Method & Path
Roles
Description
GET /api/parameters?jobRoleId=
HR, Manager (view), Employee (none)
List parameters and weightages for a job role.
POST /api/parameters
HR
Create a parameter with a weightage for a job role.
PUT /api/parameters/:id
HR
Edit a parameter/weightage; reject if weightages for the job role would not sum to 100.
POST /api/parameters/:id/change-request
Manager
Submit a requested change; creates a ParameterChangeRequests row routed to HR.
PATCH /api/change-requests/:id
HR
Approve or reject a manager's parameter change request.
8.4 Evaluations & Scores
Method & Path
Roles
Description
POST /api/evaluations
HR
Create an evaluation: parameter-wise scores + mandatory reason per parameter; computes overall_score from weightages; triggers AI feedback generation (Section 9) synchronously or via a queued job.
GET /api/evaluations/:id
HR (any), Manager (own team), Employee (own only)
Fetch one evaluation with its ParameterScores.
GET /api/evaluations?employeeId=
HR (any), Manager (own team), Employee (self only, ignores param)
List evaluation history; server derives the effective employeeId from req.user for Manager/Employee regardless of query string.
GET /api/evaluations/team
Manager
All evaluations for the manager's department, current cycle plus history.
PATCH /api/evaluations/:id/acknowledge
Employee (own)
Mark an evaluation as reviewed/acknowledged.
POST /api/evaluations/:id/comments
Manager (own team)
Add a ManagerComments row to an evaluation.
8.5 AI Feedback
Method & Path
Roles
Description
GET /api/evaluations/:id/feedback
HR (any), Manager (own team), Employee (own)
Fetch the AIFeedback row for an evaluation.
POST /api/evaluations/:id/feedback/regenerate
Employee (own), HR (any)
Re-invoke the AI provider for a fresh strengths/gaps/suggestions response.
8.6 Analytics & Reports
Method & Path
Roles
Description
GET /api/analytics/organization
HR
Org-wide averages, trends, score distribution.
GET /api/analytics/team
Manager
Own-team averages, top performers vs. needs-improvement.
GET /api/analytics/promotion-readiness
HR (all), Manager (own team)
Employees ranked by overall_score against a configurable threshold.
PATCH /api/promotion-readiness/:employeeId
HR (set status), Manager (recommend only)
HR overrides/approves final status; Manager writes a recommendation field only.
GET /api/reports/export?scope=org|team
HR (org or team), Manager (own team only)
Generate a CSV/PDF export of the scoped report.
8.7 Growth Goals
Method & Path
Roles
Description
GET /api/growth-goals?employeeId=
HR (any), Manager (own team), Employee (self)
List growth goals.
POST /api/growth-goals
Employee (own)
Create a goal, typically seeded from an AI-identified skill gap.
PATCH /api/growth-goals/:id
Employee (own)
Update status/target_date of an own goal.
8.8 Standard Response & Error Contract
All success responses return JSON with a top-level data key. All errors return a consistent shape so the frontend can handle them uniformly:
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource."
  }
}
400 Bad Request — validation failure (e.g. missing mandatory reason field).
401 Unauthorized — missing/invalid/expired JWT.
403 Forbidden — valid JWT, wrong role or wrong scope (e.g. Manager requesting another department).
404 Not Found — resource does not exist or, for scoped roles, is outside their visibility (do not leak existence via 403 vs 404 inconsistently — pick one convention and document it in the README).
500 Internal Server Error — unexpected failure, logged server-side, generic message to client.
9. AI Feedback Module Specification
9.1 Trigger & Data Flow
An evaluation is saved via POST /api/evaluations with all ParameterScores and their mandatory reasons.
The backend assembles a structured prompt containing: employee's job role, each parameter name + weightage + score + HR's written reason, and the computed overall_score.
The backend calls the AI provider (Section 9.2) requesting a JSON object with three fields: strengths, skill_gaps, suggestions.
The response is validated (JSON schema check) and stored in the AIFeedback table linked to that evaluation.
The employee's dashboard and the manager's aggregated view immediately reflect the new feedback on next fetch.
9.2 Provider Abstraction — Required for a Working Demo
Agent directive:
The source specification names the OpenAI API, but a capstone build must work in front of an examiner with no guaranteed API budget. Implement an AIProvider interface with two concrete implementations, selected by an environment variable, so the app is always fully functional:
OpenAIProvider — used when OPENAI_API_KEY is set in server/.env. Calls the OpenAI API with the assembled prompt and a strict “respond with JSON only” instruction; parses and validates the JSON response.
RuleBasedFallbackProvider — used automatically when no key is present. Deterministically derives strengths (parameters scoring above a threshold), skill_gaps (parameters below a threshold), and templated suggestions text from the actual scores and reasons — no network call, no cost, still personalized to the real data, not a static placeholder.
Both implementations satisfy the same interface (generate(evaluationContext) => { strengths, skill_gaps, suggestions }), so the rest of the system is provider-agnostic and the switch is invisible to the frontend.
9.3 Example Prompt Template (OpenAIProvider)
SYSTEM: You are an HR performance-feedback assistant. Respond with
strict JSON only: {"strengths": string, "skill_gaps": string,
"suggestions": string}. No prose outside the JSON object.
 
USER: Job role: {{jobRole}}
Overall score: {{overallScore}} / 100
Parameter breakdown:
{{#each parameters}}
- {{name}} (weight {{weightage}}%): {{score}}/10 — HR note: "{{reason}}"
{{/each}}
Write concise, specific, constructive feedback grounded only in the
data above.
10. Non-Functional & Technical Requirements
10.1 Technology Stack
Layer
Choice
Frontend
React.js (Vite), React Router (role-guarded routes), HTML5, CSS3
Backend
Node.js + Express.js (REST API)
Database
PostgreSQL, accessed via node-postgres (pg) with a connection Pool
Auth
JSON Web Tokens (JWT) + Role-Based Access Control (RBAC) middleware, bcrypt for password hashing
AI Module
OpenAI API, behind the provider abstraction in Section 9.2
Data Visualization
Chart.js (radar/bar for parameter scores, line for growth-over-time, bar/pie for aggregates)
Testing
Jest + Supertest (backend), focused on the authorize middleware and evaluation flow
Deployment target
Backend → Render (or equivalent Node host); Frontend → Vercel (or equivalent static host)
Version Control
Git + GitHub, conventional commits per build step
10.2 Backend Middleware Contract
authenticate — verifies the JWT signature and expiry from the Authorization: Bearer header; attaches the decoded payload to req.user; returns 401 if missing/invalid.
authorize(...allowedRoles) — checks req.user.role against the allowed list for that route; returns 403 otherwise. This middleware is the literal code-level implementation of the matrix in Section 5, and must be applied to every non-public route.
scopeToOwnData — a service-layer helper (not just middleware) that injects req.user.departmentId or req.user.userId into every query filter for Manager/Employee-scoped endpoints, per the row-level rule in Section 7.3.
errorHandler — a single Express error-handling middleware producing the standard error contract from Section 8.8; all thrown/rejected errors funnel through it.
10.3 Session & Token Handling
JWT expiry: 8 hours, matching a typical workday session; refresh is out of scope for v1 — expired tokens force re-login.
Store the token in memory (React context) as the primary copy; persist it to a secure storage mechanism (e.g. an httpOnly cookie set by the backend on login, or localStorage if the agent documents the tradeoff in the README) so a page refresh does not force re-login.
Attach the token to every API call via an axios request interceptor; on a 401 response, clear the session and redirect to /login via a response interceptor.
10.4 Validation Rules to Enforce
Every ParameterScores.reason is required and non-empty — reject the whole evaluation submission if any parameter's reason is blank.
EvaluationParameters.weightage values for a given job_role_id should sum to 100; reject a create/update that would break this, with a clear error message identifying the current sum.
Email addresses are unique across Users; return a clear 400 (not a raw DB constraint error) on duplicate registration.
All role/department scoping in Section 7.3 and 8 is enforced in the service layer, in addition to the route-level authorize check.
11. End-to-End Operational Workflow
This is the pipeline that ties every role together in a single evaluation cycle, and is the scenario the agent should use for manual and automated end-to-end testing (Section 13):
Employee logs in and lands on their personal dashboard (read-only at this stage, likely empty on first run).
HR logs in, selects an employee, and — if not already defined — sets up role-specific evaluation parameters for that employee's job role.
HR enters parameter-wise scores for the employee.
HR enters a mandatory written reason explaining each score — this is what makes the evaluation explainable, not just a number.
The evaluation record (scores, weights, reasons, timestamp) is stored permanently in the database.
The backend calls the AI provider with the scores + reasons and receives generated feedback: strengths, skill gaps, and development suggestions.
The employee's dashboard updates to show the new score, the AI feedback, and an updated growth-tracker timeline.
The manager's dashboard aggregates this evaluation into team-level analytics and the promotion-readiness ranking.
12. Build Instructions for the AI Coding Agent
Read this section first.
This section is written as direct instructions to the agent executing the build. Follow the steps in order; each builds on the previous one. Do not skip the seed data or README steps — they are what make the build demoable, not optional polish.
Step 1 — Environment Setup
Initialize a Git repository with the layout in Section 3.3.
Confirm Node.js (LTS) and a local or hosted PostgreSQL instance are available; if neither is available in the execution environment, still produce a fully correct, runnable codebase plus setup instructions in the README.
Add a root .gitignore covering node_modules, .env, dist/build output, and OS/editor files.
Step 2 — Backend & Database Foundation
Inside /server: npm init, install express, pg, bcrypt, jsonwebtoken, cors, dotenv, plus dev dependencies jest, supertest, nodemon.
Write SQL migration files under server/src/db/migrations for every table in Section 7.1, in dependency order (Departments and Users before tables that reference them, etc.).
Write server/src/db/pool.js using the pg Pool class, reading connection settings from environment variables (never hardcoded credentials).
Write server/src/app.js with a health-check route GET /api/health returning { status: "ok" } to confirm the server boots.
Write server/src/db/seed.js that creates: one HR account, at least two Departments each with a Manager account, at least four Employee accounts spread across those departments, at least one JobRole with EvaluationParameters per department, and at least one full sample Evaluation with scores, reasons, and generated AI feedback — so the app is demoable immediately after seeding, without manual data entry.
Step 3 — Authentication & RBAC
Implement POST /api/auth/register, POST /api/auth/login, GET /api/auth/me exactly as specified in Section 8.1.
Implement the authenticate and authorize(...roles) middleware from Section 10.2 and apply them to every route table in Section 8.
Write Jest + Supertest tests specifically for authorize: for a representative endpoint of each role tier, assert 200 for the correct role and 403 for each other role.
Step 4 — Frontend Shell & Role Routing
Scaffold /client with Vite + React, install react-router-dom, axios, chart.js, react-chartjs-2.
Build the shared Login page (posts to /api/auth/login, stores the JWT via AuthContext).
Decode the role from the JWT after login and redirect per Section 4, step 5.
Build the <ProtectedRoute role="..."> wrapper per Section 4, step 6, and wire it into the router for every HR/Manager/Employee route.
Step 5 — Build the HR Portal
Employee/Department management screens: list, add, edit employees and departments, calling the HR-only CRUD endpoints from Section 8.2.
Evaluation Parameters config screen: create parameters per job role and set weightages, enforcing the sum-to-100 rule from Section 10.4 client-side as a UX aid (server remains the source of truth).
Evaluate Employee screen: a form listing each parameter with a score input and a mandatory reason textbox; block submission client-side if any reason is empty, matching the server-side rule.
On submit, call POST /api/evaluations, which stores ParameterScores and triggers AI feedback generation (Section 9).
Step 6 — Build the Manager Portal
Workforce dashboard fetching only the manager's own department via GET /api/evaluations/team.
Analytics & reports screen using GET /api/analytics/team (server-side filtered, per Section 7.3).
Promotion-readiness ranking screen using GET /api/analytics/promotion-readiness, with a Recommend action calling PATCH /api/promotion-readiness/:employeeId.
Step 7 — Build the Employee Portal & AI Feedback Wiring
Employee dashboard: overall score, a Chart.js radar/bar chart of parameter scores, the AI feedback text, and a growth-tracker line chart built from historical evaluations.
Wire the regenerate-feedback button to POST /api/evaluations/:id/feedback/regenerate.
Allow the employee to add GrowthGoals rows sourced from the AI feedback's skill_gaps text.
Step 8 — Data Visualization
Use Chart.js bar/radar charts for parameter-wise scores and line charts for growth-over-time on the Employee portal.
Use aggregate bar/pie charts (average score by department, distribution of ratings) on the Manager and HR dashboards.
Step 9 — Testing
Manually and/or automatically verify each role's access boundaries: as an Employee, confirm HR/Manager-only API calls return 403.
Run the full workflow from Section 11 end-to-end at least once against the seeded data and record the result.
Expand the Jest + Supertest suite from Step 3 to cover the evaluation-creation → AI-feedback-generation path, including the offline fallback provider.
Step 10 — README & Documentation
Generate README.md at the project root per the required contents in Section 13 — this is a hard requirement of the build, not optional.
Copy this PRD into docs/PRD.md as Markdown so the specification travels with the repository.
Step 11 — Deployment (if a deploy target is available)
Push /server as a Node web service (e.g. Render); set DATABASE_URL, JWT_SECRET, and OPENAI_API_KEY (optional) as host environment variables, never committed to code.
Push /client as a static build (e.g. Vercel); set the API base URL as a build-time environment variable pointing to the deployed backend.
Restrict backend CORS to the deployed frontend's origin only.
If no deploy target is available in the execution environment, skip this step but ensure the README's local-run instructions are complete and self-sufficient.
13. Required Contents of the Project README.md
The agent must generate a README.md at the repository root (distinct from this PRD) containing at minimum the following sections, in this order:
Project title and one-paragraph description of what CAPDEX does.
Architecture summary — a short version of Section 3, including the repository layout tree.
Prerequisites — exact Node.js and PostgreSQL versions used.
Setup steps — numbered, copy-pasteable shell commands covering: cloning, installing server dependencies, installing client dependencies, creating the database, running migrations, and running the seed script.
Environment variables — a table listing every variable from server/.env.example and client/.env.example with a description and whether it is required or optional (OPENAI_API_KEY marked optional, with a note that the app falls back to the rule-based provider from Section 9.2 when absent).
Running locally — the exact commands to start the backend (e.g. npm run dev in /server) and frontend (e.g. npm run dev in /client), and the resulting local URLs.
Demo credentials — the seeded HR, Manager, and Employee email/password pairs from Step 2, so a reviewer can log in as each role immediately.
API overview — a link/pointer to Section 8 of docs/PRD.md rather than duplicating the full table.
Running tests — the exact command to run the Jest + Supertest suite.
Known limitations — an honest list (e.g. no token refresh, no multi-tenant support, AI fallback is rule-based when no API key is configured).
Future scope — mirrored from Section 14 of this PRD.
14. Future Scope
Mobile application for on-the-go access.
Face recognition-based authentication.
ERP and LMS integrations.
Attrition prediction using historical evaluation data.
Resume-to-skill mapping and AI interview analysis.
Predictive analytics and a multi-company SaaS offering.
15. Acceptance Checklist — Definition of Done
The build is not complete until every row below is true. The agent should self-verify this checklist before reporting the build as finished.
Area
Must be true
Auth
Login issues a valid JWT; wrong password/email returns a clean 4xx, not a stack trace.
RBAC
Every endpoint in Section 8 rejects at least one wrong-role request with 403 in the test suite.
Database
All 10 tables from Section 7.1 exist via migrations; seed.js populates demo data for all 3 roles.
HR Portal
HR can create a department, job role, parameters (summing to 100), and a full evaluation with reasons.
Manager Portal
Manager sees only their own department's data; cross-department access attempts return 403.
Employee Portal
Employee sees only their own evaluations/feedback; can add a growth goal from a skill gap.
AI Feedback
A saved evaluation produces AIFeedback via OpenAIProvider when a key is set, and via RuleBasedFallbackProvider when it is not — both paths tested.
Visualization
Employee dashboard renders a parameter radar/bar chart and a growth line chart from real data.
Workflow
The full Section 11 workflow completes end-to-end against seeded data without manual DB edits.
README
README.md exists at the repo root and satisfies every item in Section 13; demo credentials work as documented.
Docs
docs/PRD.md exists as a Markdown mirror of this document.