const AIProviderInterface = require('./aiProviderInterface');

class RuleBasedFallbackProvider extends AIProviderInterface {
  async generate(evaluationContext) {
    const { jobRole, overallScore, parameters = [] } = evaluationContext;

    const strongParams = parameters.filter(p => Number(p.score) >= 8.0);
    const growthParams = parameters.filter(p => Number(p.score) < 8.0);

    let strengths = '';
    if (strongParams.length > 0) {
      const highlights = strongParams.map(p => `${p.name} (${p.score}/10: "${p.reason}")`).join('; ');
      strengths = `Demonstrates strong domain proficiency in ${jobRole || 'their domain'}. Highlights: ${highlights}.`;
    } else {
      strengths = `Maintains reliable baseline contributions meeting core role expectations with an overall evaluation score of ${overallScore}/100.`;
    }

    let skill_gaps = '';
    if (growthParams.length > 0) {
      const gaps = growthParams.map(p => `${p.name} (${p.score}/10: "${p.reason}")`).join('; ');
      skill_gaps = `Targeted growth areas identified for advancement: ${gaps}.`;
    } else {
      skill_gaps = `Exceeds current benchmarks across evaluated dimensions. Recommended to focus on strategic leadership, cross-functional mentoring, and broader architectural initiatives.`;
    }

    const suggestionsList = [];
    if (growthParams.length > 0) {
      growthParams.forEach((p, idx) => {
        suggestionsList.push(`${idx + 1}. Focus on strengthening ${p.name} by setting quarterly milestones aligned with: "${p.reason}".`);
      });
    } else {
      suggestionsList.push(`1. Lead an internal technical workshop or knowledge-sharing session on your top domain (${strongParams[0]?.name || 'core architecture'}).`);
      suggestionsList.push(`2. Take active ownership of onboarding and technical mentorship for junior team members.`);
      suggestionsList.push(`3. Explore advanced domain certifications or lead strategic architectural improvements.`);
    }

    return {
      strengths,
      skill_gaps,
      suggestions: suggestionsList.join('\n')
    };
  }

  async chat(evaluationContext, userMessage, history = []) {
    const { employeeName = 'Contributor', jobRole = 'Software Engineer', overallScore = 0, parameters = [] } = evaluationContext;
    const msg = (userMessage || '').toLowerCase().trim();

    const strongParams = parameters.filter(p => Number(p.score) >= 8.0);
    const growthParams = parameters.filter(p => Number(p.score) < 8.0);
    const lowestParam = parameters.length > 0 ? [...parameters].sort((a, b) => Number(a.score) - Number(b.score))[0] : null;
    const highestParam = parameters.length > 0 ? [...parameters].sort((a, b) => Number(b.score) - Number(a.score))[0] : null;

    // Helper: Find parameter matched by keyword
    const findParamByKeyword = (kwArray) => {
      return parameters.find(p => kwArray.some(kw => p.name.toLowerCase().includes(kw)));
    };

    // 1. 30-Day Step-by-Step Action Plan (High Priority)
    if (msg.includes('action plan') || msg.includes('30 day') || msg.includes('roadmap') || msg.includes('how to get better') || msg.includes('step by step') || msg.includes('how can i improve')) {
      const targetParam = lowestParam || parameters[0] || { name: 'Technical Competency', score: 8, weightage: 20, reason: 'Expand domain depth' };
      return `30-DAY STEP-BY-STEP ACTION PLAN: ${targetParam.name.toUpperCase()}

Target Metric: ${targetParam.name}
Current Score: ${targetParam.score}/10 (Weight: ${targetParam.weightage}%)
HR Assessment Note: "${targetParam.reason}"

---

PHASE 1: DAYS 1 TO 10 (AUDIT, ALIGNMENT & ROOT CAUSE ANALYSIS)
1. Performance Baseline Audit:
   Review your last 3 sprint deliverables and pull requests specifically analyzing ${targetParam.name}. Document recurring patterns, bottlenecks, or missed edge cases.
2. Manager 1-on-1 Alignment:
   Schedule a 20-minute alignment sync with your manager. Agree on 2 clear quantitative target milestones for this competency.
3. Dedicated Skill Sprints:
   Block 2 hours weekly on your calendar dedicated to technical documentation, architecture deep dives, and industry best practices.

PHASE 2: DAYS 11 TO 20 (PRACTICAL IMPLEMENTATION & PEER FEEDBACK)
1. Active Application in Sprint Work:
   Apply the target methodologies directly into your active sprint tasks and architecture designs.
2. Targeted Peer Reviews:
   Request focused feedback from a senior teammate specifically evaluating your improvements in ${targetParam.name}.
3. Progress Checkpoint:
   Document 2 concrete instances where your intervention improved delivery speed, code clarity, or system stability.

PHASE 3: DAYS 21 TO 30 (VALIDATION, METRICS & RETROSPECTIVE)
1. Milestone Verification:
   Measure your sprint output and automated test metrics against the baseline established in Phase 1.
2. Team Knowledge Sharing:
   Write a concise engineering RFC or guide in the team knowledge base to share key architectural takeaways.
3. Formal Appraisal Review:
   Present your documented improvements to your manager to update your active Growth Goals.

Would you like to automatically log this action plan as a tracked goal in your Growth Goals portal?`;
    }

    // 2. Strengths & Achievements Breakdown
    if (msg.includes('strength') || msg.includes('good at') || msg.includes('best') || msg.includes('achieve') || msg.includes('top skill')) {
      if (strongParams.length > 0) {
        const list = strongParams.map((p, idx) => `${idx + 1}. ${p.name.toUpperCase()} (Score: ${p.score}/10, Weight: ${p.weightage}%)\n   HR Assessment: "${p.reason}"`).join('\n\n');
        return `EVALUATION DIAGNOSTIC: TOP COMPETENCY STRENGTHS

Based on your verified appraisal records as ${jobRole}, here is the detailed breakdown of your highest performing dimensions:

${list}

EXECUTIVE SUMMARY:
Your strongest asset is ${highestParam?.name || 'Core Domain Proficiency'} where you demonstrate mastery level execution. Your work in this area directly accelerates sprint velocity and provides a benchmark for peer contributors.

COACHING RECOMMENDATION:
Leverage these verified strengths to lead cross-functional architecture reviews and author technical documentation for your department.`;
      }
      return `EVALUATION DIAGNOSTIC: BASELINE COMPETENCIES

You are maintaining consistent foundational delivery with an overall evaluation score of ${overallScore}%. Your highest evaluated competency is ${highestParam?.name || 'Core Contributions'} (${highestParam?.score || 8}/10). Focus on expanding domain depth to push your scores into the 9.0+ mastery tier.`;
    }

    // 3. Weaknesses, Skill Gaps & Improvement Areas
    if (msg.includes('weakness') || msg.includes('gap') || msg.includes('lowest') || msg.includes('focus area') || msg.includes('bad') || msg.includes('lag') || msg.includes('shortcoming')) {
      if (growthParams.length > 0) {
        const list = growthParams.map((p, idx) => `${idx + 1}. ${p.name.toUpperCase()} (Score: ${p.score}/10, Weight: ${p.weightage}%)\n   HR Assessment Note: "${p.reason}"`).join('\n\n');
        return `EVALUATION DIAGNOSTIC: TARGETED GROWTH AREAS & SKILL GAPS

To systematically increase your overall rating and qualify for senior promotions, prioritize these evaluated dimensions:

${list}

STRATEGIC IMPACT ANALYSIS:
Your lowest scoring parameter is ${lowestParam?.name} (${lowestParam?.score}/10). Because this carries a ${lowestParam?.weightage}% weight in your appraisal model, improving this single metric by +1.5 points will raise your total score by +${((1.5 * Number(lowestParam?.weightage || 20)) / 10).toFixed(1)}%.

Would you like a tailored 30-day step-by-step action plan to address ${lowestParam?.name}?`;
      }
      return `EVALUATION DIAGNOSTIC: ADVANCED GROWTH FOCUS

Outstanding performance! You currently score 8.0/10 or higher across all evaluated parameters. Your lowest relative metric is ${lowestParam?.name} (${lowestParam?.score}/10). At this advanced stage, your growth path involves scaling your individual excellence into team-wide architectural standards, mentorship, and cross-departmental impact.`;
    }

    // 4. Promotion Readiness & Career Advancement
    if (msg.includes('promotion') || msg.includes('eligible') || msg.includes('85') || msg.includes('advance') || msg.includes('next level') || msg.includes('senior')) {
      const isEligible = Number(overallScore) >= 85;
      if (isEligible) {
        return `PROMOTION READINESS STATUS: ELIGIBLE

Congratulations! Your current overall score is ${overallScore}%, which meets the 85.0% High Potential Promotion Benchmark.

NEXT STEPS FOR ADVANCEMENT:
1. Manager Nomination:
   Confirm with your manager that they have formally submitted your nomination in the Promotion Nominations portal.
2. Growth Goal Verification:
   Ensure all active milestones under your Growth Goals tab are marked as completed.
3. Impact Dossier:
   Compile a brief 1-page summary of your major deliverables, pull requests, and mentorship contributions for the HR Executive Committee.`;
      } else {
        const gap = (85 - Number(overallScore)).toFixed(1);
        return `PROMOTION READINESS STATUS: DEVELOPING TRAJECTORY (TARGET: 85.0%)

Your current overall score is ${overallScore}%. You are ${gap}% away from reaching the 85.0% promotion eligibility threshold.

FASTEST PATH TO BRIDGING THE GAP:
1. Focus on High-Weight Competencies:
   Your highest leverage improvement area is ${lowestParam?.name} (current score: ${lowestParam?.score}/10, weight: ${lowestParam?.weightage}%).
2. Targeted Score Increase:
   Raising ${lowestParam?.name} from ${lowestParam?.score}/10 to ${(Number(lowestParam?.score) + 1.5).toFixed(1)}/10 will directly contribute +${((1.5 * Number(lowestParam?.weightage || 20)) / 10).toFixed(1)}% to your overall score.
3. Active Goal Setting:
   Create a dedicated Growth Goal targeting this dimension to demonstrate intentional quarterly progress.`;
      }
    }

    // 5. Accessibility & Testing Q&A
    if (msg.includes('accessibility') || msg.includes('a11y') || msg.includes('wcag') || msg.includes('aria') || msg.includes('screen reader')) {
      const p = findParamByKeyword(['access', 'a11y', 'test', 'quality']) || lowestParam;
      return `TECHNICAL GUIDANCE: ACCESSIBILITY (a11y) & WCAG 2.2 COMPLIANCE

Based on your appraisal records for ${jobRole}, here is an actionable engineering plan to elevate your accessibility craftsmanship:

1. SEMANTIC HTML & ARIA FOUNDATIONS:
- Replace non-semantic div and span click handlers with native button, a, dialog, and form elements.
- Ensure all interactive modal elements manage keyboard focus traps (Tab and Shift+Tab cycles) and restore focus to triggering elements on close.
- Audit aria-label, aria-labelledby, aria-describedby, and aria-expanded attributes on dynamic components.

2. KEYBOARD NAVIGATION & CONTRAST RATIOS:
- Verify that every user flow is 100% executable using only the keyboard.
- Maintain minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / graphical UI boundaries.
- Add visible focus-visible rings using Tailwind focus-visible:ring-2 utilities.

3. AUTOMATED A11Y TESTING PIPELINE:
- Integrate axe-core or jest-axe into your Vitest/Jest unit test suite to catch 50%+ of contrast and ARIA defects before pull request submission.
- Run Lighthouse and Chrome DevTools Accessibility Tree audits as a pre-commit check.

HR Review Context:
${p ? `Your current score for ${p.name} is ${p.score}/10 with HR rationale: "${p.reason}".` : ''}

Would you like a sample unit test snippet or a step-by-step PR checklist for your next sprint?`;
    }

    // 6. Unit Testing & Test Coverage
    if (msg.includes('test coverage') || msg.includes('unit test') || msg.includes('testing') || msg.includes('cypress') || msg.includes('jest') || msg.includes('vitest')) {
      const p = findParamByKeyword(['test', 'quality', 'coverage']) || lowestParam;
      return `TECHNICAL GUIDANCE: AUTOMATED TEST SUITE & COVERAGE ENHANCEMENT

Here are proven strategies to systematically bring your test coverage above 90% while preventing flaky tests:

1. TESTING PYRAMID BALANCING:
- Focus 70% of test effort on isolated unit tests verifying pure business logic and reducer states.
- Dedicate 20% to integration tests verifying component state transitions and API mocking (using Mock Service Worker / MSW).
- Reserve 10% for end-to-end critical journey tests (Playwright or Cypress).

2. EDGE CASE COVERAGE:
- Test error boundaries, network disconnects, 401/403/500 API responses, and empty state renders.
- Avoid testing internal implementation details; test user behavior and DOM outputs using React Testing Library queries (getByRole, findByText).

3. CONTINUOUS INTEGRATION ENFORCEMENT:
- Configure GitHub Actions to fail pull requests if branch test coverage drops below target thresholds.

HR Review Context:
${p ? `Your current evaluation for ${p.name} is ${p.score}/10. HR Rationale: "${p.reason}".` : ''}

Would you like recommendations on how to structure integration tests for your core modules?`;
    }

    // 7. Web Performance & Optimization (Bundle size, Web Vitals, Re-renders)
    if (msg.includes('performance') || msg.includes('optimization') || msg.includes('bundle') || msg.includes('lcp') || msg.includes('web vitals') || msg.includes('re-render')) {
      const p = findParamByKeyword(['performance', 'architecture', 'speed']) || highestParam;
      return `TECHNICAL GUIDANCE: WEB PERFORMANCE & CORE WEB VITALS OPTIMIZATION

As a ${jobRole}, here is how you can achieve top-tier performance metrics across large-scale web applications:

1. RUNTIME RE-RENDER REDUCTION:
- Audit React component re-renders using React Profiler.
- Lift expensive computations into useMemo and stabilize event callbacks with useCallback.
- Deconstruct monolithic global state into localized Zustand or Context slices to prevent unnecessary component tree invalidations.

2. ASSET & BUNDLE SIZE REDUCTION:
- Implement dynamic code-splitting via React.lazy and Suspense on all route boundaries and heavy sub-components (charts, rich text editors).
- Replace heavy dependencies with lightweight alternatives (e.g. date-fns instead of Moment.js).
- Analyze rollup/vite build chunks with rollup-plugin-visualizer to keep individual bundle chunks under 200KB.

3. CORE WEB VITALS (LCP, INP, CLS):
- Optimize Largest Contentful Paint (LCP < 2.5s) by preloading critical hero fonts and images with fetchpriority="high".
- Minimize Interaction to Next Paint (INP < 200ms) by keeping main thread tasks below 50ms using requestIdleCallback.

HR Review Context:
${p ? `Your recorded score for ${p.name} is ${p.score}/10 with note: "${p.reason}".` : ''}`;
    }

    // 8. Code Reviews & Collaboration
    if (msg.includes('code review') || msg.includes('collaboration') || msg.includes('mentor') || msg.includes('pull request')) {
      const p = findParamByKeyword(['collab', 'review', 'team']) || highestParam;
      return `TECHNICAL GUIDANCE: HIGH-IMPACT CODE REVIEWS & TECHNICAL LEADERSHIP

Here is how you can elevate peer collaboration and establish yourself as a strong technical anchor:

1. CONSTRUCTIVE PR REVIEW FRAMEWORK:
- Review pull requests within a 4-hour SLA to prevent sprint bottlenecks.
- Structure comments into clear tiers: Blocker (must fix for security/correctness), Optimization (performance/refactor opportunity), and Nitpick (style preference, non-blocking).
- Always explain the "why" behind feedback and link to documentation or code examples.

2. PAIR PROGRAMMING & MENTORSHIP:
- Host bi-weekly 30-minute pairing sessions with junior engineers on debugging complex tickets.
- Document architectural decision records (ADRs) to establish shared consensus on design patterns.

HR Review Context:
${p ? `Your score for ${p.name} is ${p.score}/10. HR Note: "${p.reason}".` : ''}`;
    }

    // 9. Database & Backend Performance (Indexing, Queries, Redis, Node.js)
    if (msg.includes('database') || msg.includes('sql') || msg.includes('backend') || msg.includes('postgres') || msg.includes('query') || msg.includes('redis') || msg.includes('api')) {
      return `TECHNICAL GUIDANCE: BACKEND ARCHITECTURE & DATABASE EFFICIENCY

Here are the key engineering practices for building resilient, high-throughput backend services:

1. DATABASE QUERY OPTIMIZATION:
- Run EXPLAIN ANALYZE on queries with execution latency exceeding 50ms.
- Add B-Tree composite indexes on frequently filtered and joined columns (e.g., department_id, employee_id, status).
- Prevent N+1 query antipatterns by utilizing JOINs or batched lookups.

2. CACHING & CONNECTION POOLING:
- Cache high-read, low-write lookup tables (departments, job roles, parameters) in Redis with appropriate TTL invalidation.
- Tune PostgreSQL connection pool limits (max clients, idle timeout) to prevent connection starvation under concurrent load.

3. API CONTRACT DESIGN & IDEMPOTENCY:
- Enforce strict JSON schema validations and rate-limiting middleware on all mutation endpoints.
- Return structured RFC-7807 error envelopes with uniform status codes.`;
    }

    // 10. Growth Goals & Milestones Suggestions
    if (msg.includes('goal') || msg.includes('milestone') || msg.includes('suggest') || msg.includes('okr') || msg.includes('target')) {
      return `SUGGESTED 90-DAY DEVELOPMENTAL GROWTH GOALS

Based on your appraisal records for ${jobRole}, here are 3 high-impact goals you can add to your Growth Goals portal:

GOAL 1: COMPETENCY MASTERY
Title: Achieve 100% adherence to quality standards in ${lowestParam?.name || 'Core Domain'}
Target Date: End of Q3
Deliverables: Complete technical audit, resolve 5 identified legacy issues, and achieve zero regressions.

GOAL 2: SYSTEM RELIABILITY & ARCHITECTURE
Title: Optimize module performance and reduce latency / bundle overhead
Target Date: End of Q3
Deliverables: Author an architectural RFC, implement lazy loading and caching, and document benchmarks.

GOAL 3: TEAM ENABLEMENT & MENTORSHIP
Title: Lead 3 knowledge-sharing sessions and conduct structured peer code reviews
Target Date: End of Q3
Deliverables: Host technical walkthroughs for junior engineers and create standardized PR review checklists.

You can click Growth Goals in your navigation bar to add and track these milestones!`;
    }

    // 11. Manager 1-on-1 Prep
    if (msg.includes('1 on 1') || msg.includes('one on one') || msg.includes('meeting') || msg.includes('discuss')) {
      return `PREPARATION GUIDE: MANAGER 1-ON-1 APPRAISAL DISCUSSION

Here is an executive agenda to maximize your 1-on-1 performance review with your manager:

1. CELEBRATE KEY WINS:
- Highlight your top competency: ${highestParam?.name} (${highestParam?.score}/10).
- Share 2 specific projects where this strength drove measurable business or team success.

2. DISCUSS GROWTH OPPORTUNITIES CONSTRUCTIVELY:
- Acknowledge ${lowestParam?.name} (${lowestParam?.score}/10, HR note: "${lowestParam?.reason}").
- Present your proactive 30-day action plan to show ownership and commitment to improvement.

3. ASK STRATEGIC QUESTIONS:
- "What specific outcomes would you need to see over the next 90 days to rate my ${lowestParam?.name} as exceptional?"
- "Are there strategic initiatives or cross-functional projects I can take ownership of to prepare for senior advancement?"`;
    }

    // 12. Score Breakdown Request
    if (msg.includes('score') || msg.includes('breakdown') || msg.includes('summary') || msg.includes('all param') || msg.includes('rationales')) {
      const breakdown = parameters.map((p, idx) => `${idx + 1}. ${p.name.toUpperCase()}\n   Score: ${p.score}/10 | Weight: ${p.weightage}%\n   HR Justification: "${p.reason}"`).join('\n\n');
      return `COMPLETE APPRAISAL BREAKDOWN: ${employeeName.toUpperCase()}

Role: ${jobRole}
Overall Weighted Score: ${overallScore}% / 100%
Status: ${overallScore >= 85 ? 'Eligible for Promotion' : 'Developing Trajectory'}

PARAMETER SCORES AND HR RATIONALES:
${breakdown}

How would you like to proceed? I can create a custom action plan for any of these parameters.`;
    }

    // Default Diagnostic Overview Response
    const strongList = strongParams.map(p => `${p.name} (${p.score}/10)`).join(', ') || 'Domain Fundamentals';
    const growthList = growthParams.map(p => `${p.name} (${p.score}/10)`).join(', ') || 'Strategic Leadership';

    return `Hello ${employeeName}! I am your CAPDEX AI Performance Coach.

I have analyzed your comprehensive evaluation records as ${jobRole} (Overall Score: ${overallScore}%).

DIAGNOSTIC SUMMARY:
- Top Strengths: ${strongList}
- Growth Opportunities: ${growthList}
- Promotion Standing: ${overallScore >= 85 ? 'Eligible for Promotion (Score >= 85%)' : 'Developing Trajectory (Score < 85%)'}

HOW CAN I ASSIST YOUR CAREER DEVELOPMENT TODAY?
1. Type "action plan" for a step-by-step 30-day improvement plan.
2. Ask technical questions (e.g., accessibility standards, test coverage, performance optimization, code reviews).
3. Type "promotion" to review your path to the 85% promotion threshold.
4. Type "strengths" or "weaknesses" for an in-depth score analysis.
5. Type "growth goals" for suggested quarterly objectives.`;
  }
}

module.exports = RuleBasedFallbackProvider;
