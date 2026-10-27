const AIProviderInterface = require('./aiProviderInterface');
const env = require('../../config/env');

class OpenAIProvider extends AIProviderInterface {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || env.OPENAI_API_KEY;
  }

  async generate(evaluationContext) {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const { jobRole, overallScore, parameters = [] } = evaluationContext;
    const paramBreakdown = parameters.map(p =>
      `- ${p.name} (weight ${p.weightage}%): ${p.score}/10 — HR note: "${p.reason}"`
    ).join('\n');

    const prompt = `Job role: ${jobRole || 'General'}\nOverall score: ${overallScore} / 100\nParameter breakdown:\n${paramBreakdown}\n\nWrite concise, specific, constructive feedback grounded strictly in the evaluation data above. Do not use # or * in the text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an HR performance-feedback assistant. Respond with strict JSON only: {"strengths": string, "skill_gaps": string, "suggestions": string}. Do not include # or * symbols in any string value. No prose outside the JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const parsed = JSON.parse(content);
    return {
      strengths: (parsed.strengths || '').replace(/[#*]/g, ''),
      skill_gaps: (parsed.skill_gaps || '').replace(/[#*]/g, ''),
      suggestions: (parsed.suggestions || '').replace(/[#*]/g, '')
    };
  }

  async chat(evaluationContext, userMessage, history = []) {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const { employeeName, jobRole, overallScore, parameters = [] } = evaluationContext;

    const paramBreakdown = parameters.map(p =>
      `- ${p.name} (Weight: ${p.weightage}%, Score: ${p.score}/10) -> HR Rationale: "${p.reason}"`
    ).join('\n');

    const systemPrompt = `You are the CAPDEX AI Performance Coach, an interactive senior engineering and career mentor for ${employeeName || 'the employee'}.
Employee Job Role: ${jobRole || 'Software Professional'}
Overall Evaluation Score: ${overallScore}% / 100%
Eligibility Status: ${overallScore >= 85 ? 'ELIGIBLE FOR PROMOTION (>= 85%)' : 'Developing Trajectory (< 85%)'}

Parameter Breakdown & HR Justifications:
${paramBreakdown}

CRITICAL FORMATTING RULES:
1. STRICTLY DO NOT USE '#' OR '*' OR '**' SYMBOLS IN YOUR RESPONSE.
2. Use clean capitalized headers (e.g. "TECHNICAL GUIDANCE:", "PHASE 1: DAYS 1 TO 10", "EXECUTIVE SUMMARY:") and numbered lists (1., 2., 3.) or hyphens (-).
3. Directly reference the employee's specific parameter scores and the HR reasons when giving advice.
4. Provide deep, highly technical, actionable advice tailored to their exact role (e.g., coding standards, architecture, performance optimization, WCAG accessibility, unit/integration testing, PR reviews, system design, CI/CD).
5. When asked for action plans, structure them into practical phases with measurable deliverables.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || 'Here are suggestions based on your evaluation...';
    // Clean any stray # or *
    return rawContent.replace(/[#*]/g, '');
  }
}

module.exports = OpenAIProvider;
