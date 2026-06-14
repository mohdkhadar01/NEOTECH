import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import type { 
  AgentName, AgentThought, ResearchData, WorldData, 
  StrategyData, SimulationData, ReportData, AutopilotState 
} from './types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';
const FALLBACK = 'llama-3.1-8b-instant';

async function callGroq(system: string, user: string): Promise<string> {
  const messages = [
    { role: 'system' as const, content: system + '\n\nRespond ONLY with valid JSON. No markdown. No backticks.' },
    { role: 'user' as const, content: user }
  ];
  try {
    const res = await groq.chat.completions.create({
      model: MODEL, temperature: 1, max_completion_tokens: 4096,
      top_p: 1, stream: false, stop: null, messages
    }) as any;
    return res.choices[0]?.message?.content || '{}';
  } catch {
    const res = await groq.chat.completions.create({
      model: FALLBACK, temperature: 1, max_completion_tokens: 4096,
      top_p: 1, stream: false, messages
    }) as any;
    return res.choices[0]?.message?.content || '{}';
  }
}

function parseJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; }
  catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) { try { return JSON.parse(match[0]) as T; } catch {} }
    return fallback;
  }
}

export type ProgressCallback = (thought: AgentThought) => void;

async function emit(cb: ProgressCallback, thought: Omit<AgentThought, 'timestamp'>) {
  cb({ ...thought, timestamp: Date.now() });
  await new Promise(r => setTimeout(r, 80));
}

// ── AGENT 1: Research Agent ──────────────────────────────────────
export async function researchAgent(
  idea: string, 
  cb: ProgressCallback
): Promise<ResearchData> {
  await emit(cb, {
    agent: 'Research Agent',
    type: 'thinking',
    message: `Scanning market intelligence for: "${idea}"`
  });

  let webResults = '';
  try {
    const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });
    const [competitorSearch, marketSearch, newsSearch] = await Promise.all([
      tv.search(`${idea} competitors India startup 2024 2025`, { maxResults: 5 }),
      tv.search(`${idea} market size India TAM 2025`, { maxResults: 3 }),
      tv.search(`${idea} India startup funding news 2025`, { maxResults: 3 })
    ]);
    
    webResults = [
      ...competitorSearch.results,
      ...marketSearch.results,
      ...newsSearch.results
    ].map(r => `${r.title}: ${r.content?.slice(0, 300)}`).join('\n\n');

    await emit(cb, {
      agent: 'Research Agent',
      type: 'insight',
      message: `Found ${competitorSearch.results.length} competitors, market data, and ${newsSearch.results.length} recent news items`
    });
  } catch {
    await emit(cb, {
      agent: 'Research Agent',
      type: 'warning',
      message: 'Web search unavailable — using AI knowledge base for market research'
    });
    webResults = 'Use AI knowledge of Indian startup ecosystem as of 2025.';
  }

  await emit(cb, {
    agent: 'Research Agent',
    type: 'thinking',
    message: 'Synthesizing market intelligence report...'
  });

  const raw = await callGroq(
    `You are an expert startup market researcher specializing in the Indian ecosystem.
     Analyze the web research data and generate a comprehensive market intelligence report.
     Focus on real companies, real funding amounts, real pricing where available.`,
    `Startup idea: "${idea}"
     Web research data: ${webResults}
     
     Generate ResearchData JSON with:
     - market_size: realistic TAM (e.g. "₹58,000 Cr")
     - market_cagr: growth rate
     - real_competitors: array of up to 5 real companies with name, funding, pricing, weakness, threat level (low/medium/high)
     - recent_news: 3 relevant recent developments
     - opportunities: 3 specific gaps in the market
     - risks: 3 real risks specific to this idea in India
     - india_specific_insights: 3 India-specific factors (regulatory, cultural, infrastructure)
     - summary: 2-sentence synthesis`
  );

  const data = parseJSON<ResearchData>(raw, {
    market_size: 'Data unavailable',
    market_cagr: '15%',
    real_competitors: [],
    recent_news: [],
    opportunities: [],
    risks: [],
    india_specific_insights: [],
    summary: 'Research completed'
  });

  // Safeguards for ResearchData properties
  data.real_competitors = Array.isArray(data?.real_competitors) ? data.real_competitors : [];
  data.recent_news = Array.isArray(data?.recent_news) ? data.recent_news : [];
  data.opportunities = Array.isArray(data?.opportunities) ? data.opportunities : [];
  data.risks = Array.isArray(data?.risks) ? data.risks : [];
  data.india_specific_insights = Array.isArray(data?.india_specific_insights) ? data.india_specific_insights : [];
  data.market_size = data.market_size || 'Data unavailable';
  data.market_cagr = data.market_cagr || '15%';

  await emit(cb, {
    agent: 'Research Agent',
    type: 'complete',
    message: `Market mapped. Found ${data.real_competitors.length} real competitors. Market size: ${data.market_size}`,
    data: data
  });

  return data;
}

// ── AGENT 2: World Builder ───────────────────────────────────────
export async function worldBuilderAgent(
  idea: string,
  research: ResearchData,
  cb: ProgressCallback
): Promise<WorldData> {
  await emit(cb, {
    agent: 'World Builder',
    type: 'thinking',
    message: 'Discovering who exists in this ecosystem...'
  });

  await emit(cb, {
    agent: 'World Builder',
    type: 'thinking',
    message: `Generating stakeholders specific to ${idea} in Indian market...`
  });

  const raw = await callGroq(
    `You are a world-building AI that creates realistic startup ecosystems. 
     You generate highly specific, non-generic stakeholders based on real market research.
     Never use generic names like "Customer" — always use specific descriptions.`,
    `Startup: "${idea}"
     Market research: ${JSON.stringify(research)}
     
     Generate WorldData JSON with:
     - agents: 8-10 stakeholders, each with:
       * role: specific title (e.g. "JEE Aspirant from Kota coaching dropout")
       * short_role: 2 words max (e.g. "JEE Student")
       * specific_description: 1 sentence about who exactly this person is
       * motivation: what they want from this startup
       * fear: what would make them leave or oppose
       * influence_score: 0-100
       * state: supportive/neutral/concerned/threatening
       * opening_thought: their first reaction to this startup (1 sentence, in their voice)
       * avatar_type: investor/customer/competitor/regulator/employee/media/founder/generic
     - relationships: array of influence connections between agents:
       * from: agent role title
       * to: agent role title
       * type: influences/blocks/funds/competes/regulates
       * strength: 0-100
     - ecosystem_summary: 2 sentences describing this world`
  );

  const data = parseJSON<WorldData>(raw, { agents: [], relationships: [], ecosystem_summary: '' });

  // Safeguards for WorldData properties
  data.agents = Array.isArray(data?.agents) ? data.agents : [];
  data.relationships = Array.isArray(data?.relationships) ? data.relationships : [];

  for (const agent of data.agents) {
    await emit(cb, {
      agent: 'World Builder',
      type: 'insight',
      message: `Spawned: ${agent.role} — "${agent.opening_thought}"`,
      data: agent
    });
    await new Promise(r => setTimeout(r, 200));
  }

  await emit(cb, {
    agent: 'World Builder',
    type: 'complete',
    message: `World built. ${data.agents.length} stakeholders created with ${data.relationships.length} relationships mapped.`,
    data: data
  });

  return data;
}

// ── AGENT 3: Strategy Agent ──────────────────────────────────────
export async function strategyAgent(
  idea: string,
  research: ResearchData,
  world: WorldData,
  cb: ProgressCallback
): Promise<StrategyData> {
  await emit(cb, {
    agent: 'Strategy Agent',
    type: 'thinking',
    message: 'Analyzing research + ecosystem to find the optimal path...'
  });

  const raw = await callGroq(
    `You are a ruthless startup strategist who has seen 1000 startups fail and 
     50 succeed. You identify the single unfair advantage and build around it.
     You are grounded in real market data, not generic advice.`,
    `Startup: "${idea}"
     Research: ${JSON.stringify(research)}
     Ecosystem: ${JSON.stringify(world.agents.map(a => ({ role: a.role, state: a.state, influence: a.influence_score })))}
     
     Generate StrategyData JSON:
     - key_insight: the single most important market insight (1 sentence)
     - unfair_advantage: what this startup can do that competitors cannot (1 sentence)
     - critical_risk: the one thing most likely to kill this startup (1 sentence)
     - month_1_to_3: what to build/do first (2 sentences)
     - month_4_to_9: growth phase strategy (2 sentences)
     - month_10_to_18: scale or pivot decision (2 sentences)
     - north_star_metric: the single metric that predicts success
     - pivot_trigger: what event should force a pivot`
  );

  const data = parseJSON<StrategyData>(raw, {
    key_insight: '', unfair_advantage: '', critical_risk: '',
    month_1_to_3: '', month_4_to_9: '', month_10_to_18: '',
    north_star_metric: '', pivot_trigger: ''
  });

  // Safeguards for StrategyData properties
  data.key_insight = data.key_insight || '';
  data.unfair_advantage = data.unfair_advantage || '';
  data.critical_risk = data.critical_risk || '';
  data.month_1_to_3 = data.month_1_to_3 || '';
  data.month_4_to_9 = data.month_4_to_9 || '';
  data.month_10_to_18 = data.month_10_to_18 || '';

  await emit(cb, {
    agent: 'Strategy Agent',
    type: 'decision',
    message: `Key insight: ${data.key_insight}`,
    data: data
  });

  await emit(cb, {
    agent: 'Strategy Agent',
    type: 'complete',
    message: `Strategy locked. Unfair advantage: ${data.unfair_advantage}`,
    data: data
  });

  return data;
}

// ── AGENTS 4+5: Simulation Director vs Chaos Agent ───────────────
export async function simulationDirectorVsChaos(
  idea: string,
  research: ResearchData,
  world: WorldData,
  strategy: StrategyData,
  cb: ProgressCallback
): Promise<SimulationData> {
  await emit(cb, {
    agent: 'Simulation Director',
    type: 'thinking',
    message: 'Beginning 18-month simulation loop...'
  });

  await emit(cb, {
    agent: 'Chaos Agent',
    type: 'thinking',
    message: 'Preparing to stress-test this startup. It will not be easy.'
  });

  const raw = await callGroq(
    `You are two AI agents running simultaneously:
     
     SIMULATION DIRECTOR: Runs the startup optimally based on strategy. 
     Makes good decisions. Drives toward product-market fit.
     
     CHAOS AGENT: Actively tries to kill the startup. Injects real crises 
     at the worst possible moments. Uses real market forces, competitor moves, 
     regulatory actions, and economic events. Is ruthless but realistic.
     
     Together you create a realistic simulation where the startup faces real challenges.
     
     CRITICAL METRIC CONSTRAINTS (INDIAN ECOSYSTEM REALISM):
     - Be BRUTALLY HONEST and realistic about early-stage startup financials in India (Months 1-18).
     - Startups do NOT make crores in revenue easily in their first 1.5 years.
     - Final 18-month accumulated revenue (final_revenue_inr) must be realistic: typically in the range of ₹10 Lakhs to ₹1.5 Crore. Monthly revenues in KPIs should start at ₹0 and grow gradually (e.g. ₹50k, ₹2L, up to ₹10L INR max). A final revenue of ₹12 Crore or similar is extremely unrealistic and is a failure of realism.
     - Keep user numbers (final_users) realistic (e.g. 5,000 to 100,000 users max for early B2C startups; 50 to 500 customers for B2B).
     - Keep survival probability low: 90% of Indian startups fail, so survival probability should typically hover between 10% and 40%, reaching 50%+ only for exceptional strategic decisions.`,
    `Startup: "${idea}"
     Strategy: ${JSON.stringify(strategy)}
     World agents: ${JSON.stringify(world.agents.map(a => a.role))}
     Real competitors: ${JSON.stringify(research.real_competitors.map(c => c.name))}
     
     Generate SimulationData JSON:
     - events: 10-14 events across 18 months with:
       * month: 1-18
       * type: milestone/crisis/decision/attack/chaos/pivot
       * title: event name
       * description: 2-3 sentences of what happened
       * narrator_line: 1 punchy sentence for AI avatar to speak
       * agent_reactions: 3 stakeholder reactions with sentiment (positive/negative/neutral)
       * kpis: users, revenue_inr, runway_months, team_size, morale(0-100), trust_score(0-100), risk_score(0-100)
       * director_decision: what the Director decided (for milestone/decision types)
       * chaos_injection: what Chaos Agent did (for crisis/attack/chaos types)
       * critic_challenge: one-line challenge to the decision
     - outcome: survival_probability, final_revenue_inr, final_users, verdict, 
       key_lesson, biggest_mistake, best_decision`
  );

  const data = parseJSON<SimulationData>(raw, { events: [], outcome: {
    survival_probability: 50, final_revenue_inr: 0, final_users: 0,
    verdict: '', key_lesson: '', biggest_mistake: '', best_decision: ''
  }});

  // Safeguards for SimulationData properties
  data.events = Array.isArray(data?.events) ? data.events : [];
  if (!data.outcome) {
    data.outcome = {
      survival_probability: 30, final_revenue_inr: 0, final_users: 0,
      verdict: 'Simulation complete.', key_lesson: '', biggest_mistake: '', best_decision: ''
    };
  }

  for (const event of data.events) {
    if (event.type === 'milestone' || event.type === 'decision') {
      await emit(cb, {
        agent: 'Simulation Director',
        type: 'decision',
        message: `Month ${event.month}: ${event.title} — ${event.director_decision || event.description}`,
        data: event
      });
    }
    if (event.type === 'crisis' || event.type === 'attack' || event.type === 'chaos') {
      await emit(cb, {
        agent: 'Chaos Agent',
        type: 'conflict',
        message: `Month ${event.month}: ${event.title} — ${event.chaos_injection || event.description}`,
        data: event
      });
    }
    if (event.critic_challenge) {
      await emit(cb, {
        agent: 'Critic Agent',
        type: 'conflict',
        message: event.critic_challenge,
        data: event
      });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  await emit(cb, {
    agent: 'Simulation Director',
    type: 'complete',
    message: `Simulation complete. Survival: ${data.outcome.survival_probability}%`,
    data: data
  });

  return data;
}

// ── AGENT 7: Reporter Agent ──────────────────────────────────────
export async function reporterAgent(
  idea: string,
  simulation: SimulationData,
  research: ResearchData,
  cb: ProgressCallback
): Promise<ReportData> {
  await emit(cb, {
    agent: 'Reporter Agent',
    type: 'thinking',
    message: 'Writing the future founder letter and news articles...'
  });

  const raw = await callGroq(
    `You are a journalist and creative writer who documents startup journeys.
     You write the future artifacts that emerge from a simulation — 
     news articles, founder letters, strategic reports. 
     Your writing is vivid, specific, and emotionally resonant.`,
    `Startup: "${idea}"
     Simulation outcome: ${JSON.stringify(simulation.outcome)}
     Key events: ${JSON.stringify(simulation.events.map(e => ({ month: e.month, title: e.title, type: e.type })))}
     Real competitors: ${JSON.stringify(research.real_competitors)}
     
     Generate ReportData JSON:
     - future_founder_letter: letter from the founder 5 years later to their Month-1 self.
       3 paragraphs. Personal, specific, emotional. References real events from simulation.
     - fake_news_articles: 3 articles from different months:
       Each: outlet (e.g. "YourStory", "Inc42", "TechCrunch India"), headline, snippet (2 sentences), month
     - strategic_report:
       * what_worked: 3 specific things
       * what_failed: 3 specific failures
       * alternative_futures: 2 "what if" scenarios
     - narrator_summary: 2 sentences the AI avatar speaks to close the simulation`
  );

  const data = parseJSON<ReportData>(raw, {
    future_founder_letter: '',
    fake_news_articles: [],
    strategic_report: { what_worked: [], what_failed: [], alternative_futures: [] },
    narrator_summary: 'Simulation complete.'
  });

  // Safeguards for ReportData properties
  data.fake_news_articles = Array.isArray(data?.fake_news_articles) ? data.fake_news_articles : [];
  if (!data.strategic_report) {
    data.strategic_report = { what_worked: [], what_failed: [], alternative_futures: [] };
  } else {
    data.strategic_report.what_worked = Array.isArray(data.strategic_report.what_worked) ? data.strategic_report.what_worked : [];
    data.strategic_report.what_failed = Array.isArray(data.strategic_report.what_failed) ? data.strategic_report.what_failed : [];
    data.strategic_report.alternative_futures = Array.isArray(data.strategic_report.alternative_futures) ? data.strategic_report.alternative_futures : [];
  }
  data.future_founder_letter = data.future_founder_letter || '';
  data.narrator_summary = data.narrator_summary || 'Simulation complete.';

  await emit(cb, {
    agent: 'Reporter Agent',
    type: 'complete',
    message: `Reports generated. Future founder letter written. ${data.fake_news_articles.length} news articles created.`,
    data: data
  });

  return data;
}

// ── MAIN CREW RUNNER ─────────────────────────────────────────────
export async function runAutopilotCrew(
  idea: string,
  sessionId: string,
  cb: ProgressCallback
): Promise<AutopilotState> {
  const research = await researchAgent(idea, cb);
  const world = await worldBuilderAgent(idea, research, cb);
  const strategy = await strategyAgent(idea, research, world, cb);
  const simulation = await simulationDirectorVsChaos(idea, research, world, strategy, cb);
  const report = await reporterAgent(idea, simulation, research, cb);

  return {
    phase: 'complete',
    idea, sessionId,
    agents: {} as any,
    thoughts: [],
    currentMonth: 18,
    totalMonths: 18,
    researchData: research,
    worldData: world,
    strategyData: strategy,
    simulationData: simulation,
    reportData: report
  };
}
