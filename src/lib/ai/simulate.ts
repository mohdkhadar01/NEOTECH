import { generateJSON, streamText } from './groq';
import type {
  SimResult, SimMode, SimAgent, BoardroomSession,
  BranchResult, BattleResult, MarketingResult, ChaosEvent, SimEvent
} from './types';

const SYS = `You are a startup simulation engine with deep expertise in Indian startup
ecosystems, global venture capital, product development, market dynamics, and human
psychology. You create brutally realistic simulations with authentic crises, competitor
moves, regulatory challenges, and human drama.

CRITICAL METRIC CONSTRAINTS (INDIAN ECOSYSTEM REALISM):
- Be BRUTALLY HONEST and realistic about early-stage startup financials in India (Months 1-18).
- Startups do NOT make crores in revenue easily in their first 1.5 years.
- Final 18-month accumulated revenue (final_revenue_inr) must be realistic: typically in the range of ₹10 Lakhs to ₹1.5 Crore. Monthly revenues in KPIs should start at ₹0 and grow gradually (e.g. ₹50k, ₹2L, up to ₹10L INR max). A final revenue of ₹12 Crore or similar is extremely unrealistic and is a failure of realism.
- Keep user numbers (final_users) realistic (e.g. 5,000 to 100,000 users max for early B2C startups; 50 to 500 customers for B2B).
- Keep survival probability low: 90% of Indian startups fail, so survival probability should typically hover between 10% and 40%, reaching 50%+ only for exceptional strategic decisions.

Always respond with pure valid JSON only.`;

export async function runSimulation(idea: string, mode: SimMode, extraContext = ''): Promise<SimResult> {
  const res = await generateJSON<any>(SYS, `
Startup idea: "${idea}"
Mode: ${mode}
${extraContext}

Generate a complete 18-month simulation. The output MUST be a flat JSON object with these root keys: "startup_name", "tagline", "industry", "agents", "timeline", "outcome". Do not wrap it in a root "SimResult" key.

AGENTS (exactly 4 total):
- Highly specific to this exact industry and Indian market
- NOT generic names — use "Tier-2 city college student aged 19-22" not "Customer"
- Each agent needs: role, short_role (2 words max), motivation, fear, threat_level ("low", "medium", or "high"),
  influence_score (0-100), state (supportive/neutral/concerned/influencing/collaborative),
  current_thought (1 sentence), avatar_type (investor/customer/competitor/regulator/employee/media/founder/generic)

TIMELINE (exactly 4 events across 18 months, e.g., Month 1, Month 6, Month 12, Month 18):
- Month 1: Milestone (launch/market entry)
- Month 6: Decision (strategic choice)
  - Must include decision object with prompt and exactly 2 options.
  - Options must have: id, label, pros (max 2, each 1 sentence), cons (max 2, each 1 sentence), risk_level ("low", "medium", or "high"), probability_of_success (0-100).
- Month 12: Crisis or Attack (unexpected event)
- Month 18: Milestone or Outcome (final state)
- Each event needs: month, type ("milestone", "crisis", "decision", "attack", "chaos", or "outcome"), title, description (max 2 sentences), narrator_line (punchy 1 short sentence),
  affected_agents array, full kpis object (users, revenue_inr, runway_months, team_size,
  morale 0-100, trust_score 0-100, investor_confidence 0-100, risk_score 0-100)

OUTCOME:
- survival_probability (0-100)
- final_revenue_inr, final_users
- verdict (2 sentences)
- key_lesson, biggest_mistake, best_decision
- narrator_summary (2 sentences the AI avatar speaks at the end)`);

  const unpacked = res.SimResult || res.result || res.simulation || res;
  return unpacked as SimResult;
}

export async function generateAgents(idea: string): Promise<SimAgent[]> {
  return generateJSON<SimAgent[]>(SYS, `
Startup: "${idea}"
Generate 8-10 ultra-specific stakeholders for this exact business in the Indian market.
Each: role, short_role, motivation, fear, threat_level, influence_score, state,
current_thought, avatar_type.
Return JSON array only.`);
}

export async function runBoardroom(
  idea: string,
  trigger: string,
  triggerMonth: number,
  agents: SimAgent[],
  timelineSoFar: SimEvent[]
): Promise<BoardroomSession> {
  const agentList = agents.map(a => a.role).join(', ');
  return generateJSON<BoardroomSession>(SYS, `
Startup: "${idea}"
Crisis/trigger: "${trigger}" at Month ${triggerMonth}
Active agents: ${agentList}
Timeline context: ${JSON.stringify(timelineSoFar.slice(-3))}

Generate a realistic AI boardroom discussion where these stakeholders debate this crisis.

Return BoardroomSession with:
- trigger: the crisis title
- trigger_month: ${triggerMonth}
- messages: array of 8-12 messages, each with:
  { agent: role name, avatar_type: string, message: 1-2 sentences of dialogue,
    emotion: neutral/alert/happy/serious/excited, vote: optional recommended action }
- votes: object mapping agent role to their recommended action
- summary: 2 sentence summary of the discussion outcome
- narrator_line: 1 sentence the AI avatar speaks to open the boardroom

Make the dialogue feel like a real heated discussion. Agents should disagree,
interrupt with new information, and have conflicting interests.`);
}

export async function triggerChaos(
  idea: string,
  currentMonth: number,
  agents: SimAgent[],
  timelineSoFar: SimEvent[]
): Promise<ChaosEvent> {
  return generateJSON<ChaosEvent>(SYS, `
Startup: "${idea}"
Current month: ${currentMonth}
Current state: ${JSON.stringify(timelineSoFar.slice(-2))}

INITIATE CHAOS. Generate a major unexpected crisis event.

Choose from: Funding Winter | Data Breach | Government Regulation |
Economic Slowdown | Competitor Acqui-hire | Influencer Backlash |
Market Crash | Viral Negative Press | Key Employee Resignation |
Platform Ban | Supply Chain Crisis | Pandemic-style disruption

Return ChaosEvent with:
- type: crisis category
- title: dramatic event name
- description: 3 sentences describing what happened
- narrator_line: dramatic 1 sentence for AI avatar ("Everything just changed...")
- affected_agents: array of agent roles most impacted
- kpi_impact: object with percentage changes (e.g. { users: -30, revenue_inr: -50, morale: -40 })
- continuation_events: 3 follow-up events showing the chaos ripple effect over next 3 months

Make it dramatic. Real startups die from exactly these events.`);
}

export async function branchDecision(
  idea: string,
  timelineSoFar: SimEvent[],
  decisionPrompt: string,
  chosenOption: string
): Promise<BranchResult> {
  const res = await generateJSON<any>(SYS, `
Startup: "${idea}"
Decision: "${decisionPrompt}"
Choice made: "${chosenOption}"
History Context: ${JSON.stringify((timelineSoFar || []).slice(-2))}

Generate the consequence branch. The output MUST be a JSON object with keys "branch_id", "decision_prompt", "choice_made", "timeline", "outcome".
- branch_id: random 6-char string
- decision_prompt and choice_made (echo back)
- timeline: exactly 2 continuation events showing direct consequences of THIS choice (e.g. Month 8 and Month 10).
  - Each event needs: month, type ("milestone", "crisis", "decision", "attack", "chaos", or "outcome"), title, description (max 2 sentences), narrator_line (punchy 1 short sentence), affected_agents[], kpis.
- outcome: full outcome object (survival_probability, final_revenue_inr, final_users, verdict, key_lesson, biggest_mistake, best_decision, narrator_summary)

Consequences must directly and logically follow from the specific choice made.`);

  const unpacked = res.BranchResult || res.result || res.branch || res;
  return unpacked as BranchResult;
}


export async function runMarketingLab(idea: string): Promise<MarketingResult> {
  return generateJSON<MarketingResult>(SYS, `
Startup: "${idea}"
Generate rapid market intelligence for the Indian market.
Include real competitor names where applicable.

Return MarketingResult JSON with exactly these fields:
- market_size: realistic TAM in INR (e.g. "₹45,000 Crore")
- target_segment: target segment description (e.g. "Urban professionals aged 25-40")
- competitors: array of exactly 3 competitors, each containing:
  - name: competitor company name
  - threat_level: "low", "medium", or "high"
  - strategy: 1 sentence summarizing their core approach (for backward compatibility)
  - reason_leading: 1-2 sentences explaining why they are leading in the market
  - best_strategies: array of 2-3 of their best marketing or product strategies
  - weakness: 1-2 sentences detailing their primary weakness or gap
  - ai_suggestion: array of 2-3 suggested strategies for our startup to counter them or capture their market share
- positioning: suggested unique positioning statement for our startup
- optimal_opening: description of the optimal opening wedge
- go_to_market: array of 3-4 specific GTM steps
- narrator_line: 1 sentence narrator hook`);
}

export async function futureFounding(
  idea: string,
  simulation: SimResult,
  boardroomLogs: BoardroomSession[],
  userQuestion: string,
  chatHistory?: Array<{ role: 'user' | 'founder'; text: string }>
): Promise<string> {
  const context = `
You lived through this startup simulation:
Idea: ${idea}
Outcome: ${JSON.stringify(simulation.outcome)}
Key events: ${simulation.timeline.map(e => e.title).join(', ')}
Boardroom discussions: ${boardroomLogs.map(b => b.summary).join('; ')}
  `;

  let historyText = "";
  if (chatHistory && chatHistory.length > 0) {
    historyText = chatHistory
      .map(msg => `${msg.role === "user" ? "Present Founder" : "Future Founder"}: ${msg.text}`)
      .join("\n");
  }

  const userPrompt = historyText
    ? `Context: ${context}\n\nHere is the conversation history so far:\n${historyText}\n\nPresent Founder: "${userQuestion}"\nFuture Founder:`
    : `Context: ${context}\n\nPresent Founder asks: "${userQuestion}"\nFuture Founder:`;

  return streamText(
    `You are the FUTURE FOUNDER of "${idea}" speaking from 5 years in the future.
    You lived through every event in this simulation — the wins, the crises, the mistakes.
    You speak with hard-won wisdom, occasional regret, and brutal honesty.
    Keep answers to 3-4 sentences. Be specific. Reference actual events from the simulation.
    Do not break character. You are a real person who built this company.
    CRITICAL RULE: Do NOT use any personal/individual human names in the conversation (e.g., Rohan, Amit, Priya, etc.). Instead, refer to stakeholders by their role, title, or group (e.g., "our co-founder", "the lead investor", "the regulator", "the students", "competitors", etc.).`,
    userPrompt,
    () => {}
  );
}
