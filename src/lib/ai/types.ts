export type SimMode = 'autopilot' | 'founder' | 'marketing';
export type AgentState = 'supportive' | 'neutral' | 'concerned' | 'influencing' | 'collaborative';
export type EmotionType = 'neutral' | 'alert' | 'happy' | 'serious' | 'excited';

export interface SimAgent {
  role: string;
  short_role: string;
  motivation: string;
  fear: string;
  threat_level: 'low' | 'medium' | 'high';
  influence_score: number;
  state: AgentState;
  current_thought: string;
  avatar_type: 'investor' | 'customer' | 'competitor' | 'regulator' | 'employee' | 'media' | 'founder' | 'generic';
}

export interface SimDecision {
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    pros: string[];
    cons: string[];
    risk_level: 'low' | 'medium' | 'high';
    probability_of_success: number;
  }>;
}

export interface SimEvent {
  month: number;
  type: 'milestone' | 'crisis' | 'decision' | 'attack' | 'chaos' | 'outcome';
  title: string;
  description: string;
  narrator_line: string;
  affected_agents: string[];
  kpis: {
    users: number;
    revenue_inr: number;
    runway_months: number;
    team_size: number;
    morale: number;
    trust_score: number;
    investor_confidence: number;
    risk_score: number;
  };
  decision?: SimDecision;
}

export interface SimResult {
  startup_name: string;
  tagline: string;
  industry: string;
  agents: SimAgent[];
  timeline: SimEvent[];
  outcome: {
    survival_probability: number;
    final_revenue_inr: number;
    final_users: number;
    verdict: string;
    key_lesson: string;
    biggest_mistake: string;
    best_decision: string;
    narrator_summary: string;
  };
}

export interface BoardroomMessage {
  agent: string;
  avatar_type: string;
  message: string;
  emotion: EmotionType;
  vote?: string;
}

export interface BoardroomSession {
  trigger: string;
  trigger_month: number;
  messages: BoardroomMessage[];
  votes: Record<string, string>;
  summary: string;
  narrator_line: string;
}

export interface BranchResult {
  branch_id: string;
  decision_prompt: string;
  choice_made: string;
  timeline: SimEvent[];
  outcome: SimResult['outcome'];
}

export interface BattleResult {
  human: SimResult;
  ai: SimResult;
  winner: 'human' | 'ai';
  revenue_multiplier: number;
  runway_advantage_months: number;
  divergence_points: Array<{
    month: number;
    human_choice: string;
    ai_choice: string;
    impact: string;
  }>;
  narrator_intro: string;
  narrator_verdict: string;
}

export interface MarketingResult {
  market_size: string;
  target_segment: string;
  competitors: Array<{
    name: string;
    threat_level: 'low' | 'medium' | 'high';
    strategy?: string;
    weakness: string;
    reason_leading: string;
    best_strategies: string[];
    ai_suggestion: string[];
  }>;
  positioning: string;
  optimal_opening: string;
  go_to_market: string[];
  narrator_line: string;
}

export interface ChaosEvent {
  type: string;
  title: string;
  description: string;
  narrator_line: string;
  affected_agents: string[];
  kpi_impact: Record<string, number>;
  continuation_events: SimEvent[];
}
