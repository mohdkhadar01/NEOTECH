export type AgentName = 
  | 'Research Agent'
  | 'World Builder' 
  | 'Strategy Agent'
  | 'Simulation Director'
  | 'Chaos Agent'
  | 'Critic Agent'
  | 'Reporter Agent';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'done' | 'conflict';

export interface AgentThought {
  agent: AgentName;
  type: 'thinking' | 'insight' | 'decision' | 'conflict' | 'complete' | 'warning';
  message: string;
  timestamp: number;
  data?: any;
}

export interface AgentState {
  name: AgentName;
  status: AgentStatus;
  currentTask: string;
  thoughts: AgentThought[];
  output?: any;
  emoji: string;
  color: string;
  description: string;
}

export interface AutopilotState {
  phase: 
    | 'idle'
    | 'researching'
    | 'building_world'
    | 'strategizing'
    | 'simulating'
    | 'chaos'
    | 'critiquing'
    | 'reporting'
    | 'complete';
  agents: Record<AgentName, AgentState>;
  thoughts: AgentThought[];
  researchData?: ResearchData;
  worldData?: WorldData;
  strategyData?: StrategyData;
  simulationData?: SimulationData;
  reportData?: ReportData;
  currentMonth: number;
  totalMonths: number;
  idea: string;
  sessionId: string;
}

export interface ResearchData {
  market_size: string;
  market_cagr: string;
  real_competitors: Array<{
    name: string;
    funding: string;
    pricing: string;
    weakness: string;
    threat: 'low' | 'medium' | 'high';
  }>;
  recent_news: string[];
  opportunities: string[];
  risks: string[];
  india_specific_insights: string[];
  summary: string;
}

export interface WorldData {
  agents: Array<{
    role: string;
    short_role: string;
    specific_description: string;
    motivation: string;
    fear: string;
    influence_score: number;
    state: 'supportive' | 'neutral' | 'concerned' | 'threatening';
    opening_thought: string;
    avatar_type: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: 'influences' | 'blocks' | 'funds' | 'competes' | 'regulates';
    strength: number;
  }>;
  ecosystem_summary: string;
}

export interface StrategyData {
  key_insight: string;
  unfair_advantage: string;
  critical_risk: string;
  month_1_to_3: string;
  month_4_to_9: string;
  month_10_to_18: string;
  north_star_metric: string;
  pivot_trigger: string;
}

export interface SimulationEvent {
  month: number;
  type: 'milestone' | 'crisis' | 'decision' | 'attack' | 'chaos' | 'pivot';
  title: string;
  description: string;
  narrator_line: string;
  agent_reactions: Array<{ agent: string; reaction: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
  kpis: {
    users: number;
    revenue_inr: number;
    runway_months: number;
    team_size: number;
    morale: number;
    trust_score: number;
    risk_score: number;
  };
  director_decision?: string;
  chaos_injection?: string;
  critic_challenge?: string;
}

export interface SimulationData {
  events: SimulationEvent[];
  outcome: {
    survival_probability: number;
    final_revenue_inr: number;
    final_users: number;
    verdict: string;
    key_lesson: string;
    biggest_mistake: string;
    best_decision: string;
  };
}

export interface ReportData {
  future_founder_letter: string;
  fake_news_articles: Array<{
    outlet: string;
    headline: string;
    snippet: string;
    month: number;
  }>;
  strategic_report: {
    what_worked: string[];
    what_failed: string[];
    alternative_futures: string[];
  };
  narrator_summary: string;
}
