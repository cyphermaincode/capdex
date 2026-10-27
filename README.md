# CAPDEX (Continuous Appraisal & Performance Diagnostic Expert)

A production-ready Enterprise Continuous Performance Management & AI-Powered Diagnostic Platform built according to strict PRD specifications.

---

## 🌟 Key Features

### 1. Three-Tier Role-Based Access Control (RBAC)
- **HR Admin Portal**:
  - Full employee & manager directory administration.
  - Department management with dedicated manager assignments.
  - Role-specific evaluation parameter configuration strictly validated to sum to 100%.
  - Comprehensive evaluation console with mandatory written score justifications.
  - Promotion readiness indexing and candidate decision tracking.
  - Organizational analytics with CSV export capabilities.
- **Manager Portal**:
  - Team performance oversight & score distributions.
  - Granular appraisal reviews with manager coaching commentary.
  - Promotion nominations & rationale submissions directly to HR.
  - Formal parameter change request submission system.
  - Team radar competency analytics & departmental CSV exports.
- **Employee Portal**:
  - Personal appraisal history with 0–10 parameter score breakdown.
  - Interactive Competency Radar Diagnostic charts.
  - AI-generated performance synthesis (Strengths, Skill Gaps, Actionable 90-Day Recommendations).
  - Formal evaluation acknowledgment mechanism.
  - 90-day developmental growth goal tracker.

### 2. Weighted Parameter Engine (Sum = 100%)
- Every job role is bound to custom evaluation metrics.
- Enforces strict business validation: parameter weights must sum to exactly 100%.
- Mandatory written justification is required for every parameter score (0.0 to 10.0) to eliminate appraisal bias.

### 3. Dual-Mode AI Diagnostic Provider
- **OpenAI Integration**: Automatically activates when `OPENAI_API_KEY` is present, generating structured JSON feedback via `gpt-4o-mini`.
- **Deterministic Offline Fallback**: Generates grounded, multi-section performance diagnostics based on quantitative scores and qualitative HR justification notes with zero external API dependencies.

### 4. Database Architecture
- 11 modular SQL migration scripts.
- PostgreSQL database pool with zero-configuration in-memory fallback for immediate zero-dependency testing and evaluation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd capdex

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables (Optional)
Create `.env` in `server/`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
# Optional: Set OPENAI_API_KEY for GPT-4o-mini AI synthesis
# OPENAI_API_KEY=sk-...
```

### 3. Start the Servers
In terminal 1 (Backend API):
```bash
cd server
npm run dev
# Server starts on http://localhost:5000 with auto-migrations and demo seed
```

In terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Client runs on http://localhost:3000
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **HR Admin** | `hr@capdex.com` | `Password123!` | Evaluations, Parameters (100%), Promotions, Org Reports |
| **Engineering Manager** | `manager.eng@capdex.com` | `Password123!` | Team Reviews, Comments, Nominations, Change Requests |
| **Marketing Manager** | `manager.mkt@capdex.com` | `Password123!` | Marketing Team Reviews, Comments, Nominations |
| **Senior Frontend Dev** | `emp.dev1@capdex.com` | `Password123!` | Radar Scores, AI Feedback, Goal Tracking, Acknowledgment |
| **Backend Engineer** | `emp.dev2@capdex.com` | `Password123!` | Radar Scores, AI Feedback, Goal Tracking |
| **Marketing Specialist**| `emp.mkt1@capdex.com` | `Password123!` | Campaign Metrics, AI Suggestions, Growth Goals |

*(Interactive 1-click login buttons are also provided on the Landing & Login pages for instant exploration).*

---

## 🧪 Testing

Run backend test suites:
```bash
cd server
npm test
```
Tests cover:
- Authentication & JWT token issuance.
- Role-based authorization & row-level tenant security (HR, Manager, Employee).
- Weighted parameter constraint validation (sum $\le 100\%$).
- Evaluation lifecycle, mandatory justification enforcement, AI feedback synthesis, and CSV reporting.
