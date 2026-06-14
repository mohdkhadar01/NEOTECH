import type { 
  SimResult, BoardroomSession, ChaosEvent, 
  BranchResult, MarketingResult, SimAgent, SimEvent 
} from './types';

function cleanName(idea: string): string {
  const words = idea.split(' ').filter(w => w.length > 2);
  const base = words[0] || 'Alpha';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function mockSimulation(idea: string, mode: string): SimResult {
  const name = cleanName(idea);
  const startupName = `${name}Verse`;
  
  const agents: SimAgent[] = [
    {
      role: 'Tier-1 college graduate lead developer',
      short_role: 'Lead Dev',
      motivation: 'Building scalable architecture and working with modern stack',
      fear: 'Running out of runway before product-market fit',
      threat_level: 'low',
      influence_score: 85,
      state: 'supportive',
      current_thought: 'The codebase is stable, but we need to optimize our database queries to handle scale.',
      avatar_type: 'employee'
    },
    {
      role: 'Urban professional target customer',
      short_role: 'User Profile',
      motivation: 'Saving time and solving delivery/friction',
      fear: 'Hidden fees, poor customer service, and delayed responses',
      threat_level: 'medium',
      influence_score: 75,
      state: 'neutral',
      current_thought: 'I like the concept, but the signup process is slightly tedious.',
      avatar_type: 'customer'
    },
    {
      role: 'Early-stage angel investor',
      short_role: 'Angel Investor',
      motivation: 'Seeing rapid user growth and strong retention cohorts',
      fear: 'High customer acquisition cost and lack of defensibility',
      threat_level: 'high',
      influence_score: 90,
      state: 'concerned',
      current_thought: 'The burn rate is within limits, but I want to see a clear path to profitability.',
      avatar_type: 'investor'
    },
    {
      role: 'Agile sector competitor',
      short_role: 'Competitor',
      motivation: 'Capturing market share through aggressive discounts',
      fear: 'Losing top customers to our superior product experience',
      threat_level: 'high',
      influence_score: 60,
      state: 'concerned',
      current_thought: 'They are moving fast. We should watch their next marketing campaign closely.',
      avatar_type: 'competitor'
    }
  ];

  const timeline: SimEvent[] = [
    {
      month: 1,
      type: 'milestone',
      title: 'Initial Alpha Launch',
      description: `Successfully deployed the first version of ${startupName} in select locations. Initial user feedback is positive.`,
      narrator_line: 'We have taken our first steps. The system is live, and the clock is ticking.',
      affected_agents: ['Lead Dev', 'User Profile'],
      kpis: {
        users: 1200,
        revenue_inr: 85000,
        runway_months: 16,
        team_size: 4,
        morale: 85,
        trust_score: 80,
        investor_confidence: 75,
        risk_score: 15
      }
    },
    {
      month: 6,
      type: 'decision',
      title: 'Monetization Crossroads',
      description: 'User acquisition is steady, but transaction costs are rising. We need to lock in our monetization model.',
      narrator_line: 'Growth is great, but revenue is what keeps the lights on. It is time to make a call.',
      affected_agents: ['Angel Investor', 'User Profile'],
      kpis: {
        users: 8500,
        revenue_inr: 450000,
        runway_months: 11,
        team_size: 5,
        morale: 80,
        trust_score: 75,
        investor_confidence: 70,
        risk_score: 25
      },
      decision: {
        prompt: 'How do we scale monetization in the next quarter?',
        options: [
          {
            id: 'opt_premium',
            label: 'Introduce Premium subscription with zero delivery fees',
            pros: ['Predictable recurring revenue', 'Increases user retention'],
            cons: ['May alienate casual users', 'Short-term margin squeeze'],
            risk_level: 'medium',
            probability_of_success: 75
          },
          {
            id: 'opt_transaction',
            label: 'Add 5% convenience fee on all transactions',
            pros: ['Instant margin boost', 'Easy to implement'],
            cons: ['High customer backlash risk', 'Competitors might undercut us'],
            risk_level: 'high',
            probability_of_success: 45
          }
        ]
      }
    },
    {
      month: 12,
      type: 'crisis',
      title: 'Server Outage & Data Leak Rumors',
      description: 'A major database outage took down the platform for 14 hours, sparking rumors of a security breach.',
      narrator_line: 'Fires are burning. Trust is fragile, and the press is starting to circle.',
      affected_agents: ['Lead Dev', 'Angel Investor', 'User Profile'],
      kpis: {
        users: 18000,
        revenue_inr: 1200000,
        runway_months: 6,
        team_size: 6,
        morale: 55,
        trust_score: 40,
        investor_confidence: 45,
        risk_score: 75
      }
    },
    {
      month: 18,
      type: 'outcome',
      title: '18-Month Post-Mortem',
      description: `We navigated the storm. ${startupName} has established a secure niche in the market, though challenges remain.`,
      narrator_line: 'We survived the first chapter. The foundation is built, but the real climb begins now.',
      affected_agents: ['Angel Investor', 'Lead Dev'],
      kpis: {
        users: 34000,
        revenue_inr: 2800000,
        runway_months: 8,
        team_size: 7,
        morale: 75,
        trust_score: 70,
        investor_confidence: 65,
        risk_score: 30
      }
    }
  ];

  return {
    startup_name: startupName,
    tagline: `Next-gen ${idea} platform for the modern Indian market.`,
    industry: 'Consumer Tech',
    agents,
    timeline,
    outcome: {
      survival_probability: 68,
      final_revenue_inr: 2800000,
      final_users: 34000,
      verdict: `${startupName} successfully found product-market fit by surviving early database crises and locking in a premium subscription model.`,
      key_lesson: 'Always prioritize data reliability and customer trust over rapid growth hooks.',
      biggest_mistake: 'Delayed monetization strategy in the first four months, wasting valuable runway.',
      best_decision: 'Introducing the premium subscription which stabilized our monthly cash flows.',
      narrator_summary: `We navigated 18 months of building ${startupName}. With 34,000 active users and ₹28 Lakhs in revenue, the business is stable and prepared for institutional scale.`
    }
  };
}

export function mockBoardroom(idea: string, trigger: string, month: number, agents: SimAgent[]): BoardroomSession {
  const activeRoles = agents.map(a => a.short_role);
  const leadDev = activeRoles.includes('Lead Dev') ? 'Lead Dev' : (agents[0]?.short_role || 'Lead Dev');
  const investor = activeRoles.includes('Angel Investor') ? 'Angel Investor' : (agents[1]?.short_role || 'Angel Investor');
  const user = activeRoles.includes('User Profile') ? 'User Profile' : (agents[2]?.short_role || 'User Profile');

  return {
    trigger,
    trigger_month: month,
    messages: [
      {
        agent: leadDev,
        avatar_type: 'employee',
        message: `This crisis regarding "${trigger}" is hitting our infrastructure hard. We need to freeze product releases and focus on stability.`,
        emotion: 'alert',
        vote: 'Focus on Core Operations'
      },
      {
        agent: investor,
        avatar_type: 'investor',
        message: `We cannot afford to stop growing. If we stop marketing, our competitors will swallow us. We should launch an aggressive PR campaign.`,
        emotion: 'serious',
        vote: 'Aggressive Countermeasure'
      },
      {
        agent: user,
        avatar_type: 'customer',
        message: `As a user, all I care about is consistency. Give us a discount code and fix the reliability. Keep it simple.`,
        emotion: 'neutral',
        vote: 'Negotiate and Compromise'
      }
    ],
    votes: {
      [leadDev]: 'Focus on Core Operations',
      [investor]: 'Aggressive Countermeasure',
      [user]: 'Negotiate and Compromise'
    },
    summary: `The board debated on "${trigger}". The Lead Dev pushed for stability, the Investor demanded growth, and the Customer wanted simple remediation.`,
    narrator_line: 'Welcome, team. The board is convened. Let us address this crisis immediately.'
  };
}

export function mockChaos(idea: string, month: number, agents: SimAgent[]): ChaosEvent {
  const name = cleanName(idea);
  return {
    type: 'chaos',
    title: 'Sudden Competitor Funding Infusion',
    description: `Our direct competitor in the ${idea} space just raised a massive round, launching a 50% discount campaign to steal our users.`,
    narrator_line: 'Chaos is the only constant. Capital has entered the field, and it is targeting our users.',
    affected_agents: agents.map(a => a.role).slice(0, 2),
    kpi_impact: {
      users: -1500,
      morale: -15,
      trust_score: -10,
      risk_score: 25
    },
    continuation_events: [
      {
        month: month,
        type: 'chaos',
        title: 'Competitor Price War Escalates',
        description: 'We are seeing localized user churn as customers flock to competitor discounts.',
        narrator_line: 'Margins are squeezed. The price war is officially under way.',
        affected_agents: [agents[0]?.role || 'User Profile'],
        kpis: {
          users: 12000,
          revenue_inr: 800000,
          runway_months: 5,
          team_size: 6,
          morale: 60,
          trust_score: 65,
          investor_confidence: 50,
          risk_score: 55
        }
      }
    ]
  };
}

export function mockBranch(idea: string, timeline: SimEvent[], decisionPrompt: string, chosenOption: string): BranchResult {
  const lastEvent = timeline[timeline.length - 1];
  const lastKpis = lastEvent?.kpis || { users: 10000, revenue_inr: 500000, runway_months: 12, team_size: 5, morale: 80, trust_score: 80, investor_confidence: 70, risk_score: 20 };
  
  const isPremium = chosenOption.toLowerCase().includes('premium');
  const userImpact = isPremium ? 1200 : -800;
  const revenueImpact = isPremium ? 250000 : 150000;
  const moraleImpact = isPremium ? 5 : -10;

  const nextEvent: SimEvent = {
    month: (lastEvent?.month || 6) + 3,
    type: 'milestone',
    title: `Consequences of: ${chosenOption.slice(0, 30)}...`,
    description: `Deciding to "${chosenOption}" led to a shift in user segments. We observed ${isPremium ? 'increased user loyalty' : 'slight initial user backlash'} in early data.`,
    narrator_line: 'Every action has a reaction. The path is set, and the first waves of impact are hitting.',
    affected_agents: ['Lead Dev', 'Angel Investor'],
    kpis: {
      users: Math.max(100, lastKpis.users + userImpact),
      revenue_inr: Math.max(0, lastKpis.revenue_inr + revenueImpact),
      runway_months: Math.max(1, lastKpis.runway_months - 3),
      team_size: lastKpis.team_size,
      morale: Math.max(10, Math.min(100, lastKpis.morale + moraleImpact)),
      trust_score: Math.max(10, Math.min(100, lastKpis.trust_score + (isPremium ? 10 : -5))),
      investor_confidence: Math.max(10, Math.min(100, lastKpis.investor_confidence + (isPremium ? 15 : -10))),
      risk_score: Math.max(10, Math.min(100, lastKpis.risk_score - 10))
    }
  };

  return {
    branch_id: Math.random().toString(36).substring(7),
    decision_prompt: decisionPrompt,
    choice_made: chosenOption,
    timeline: [nextEvent],
    outcome: {
      survival_probability: isPremium ? 72 : 55,
      final_revenue_inr: Math.max(0, lastKpis.revenue_inr + revenueImpact) * 2,
      final_users: Math.max(100, lastKpis.users + userImpact) * 1.5,
      verdict: `Successfully transitioned strategy towards ${chosenOption}.`,
      key_lesson: 'Moving early on structured subscriptions protects critical margins.',
      biggest_mistake: 'Delayed communication with target segment stakeholders.',
      best_decision: `Adopting the "${chosenOption}" operational route.`,
      narrator_summary: 'We branched our timeline. The consequence has reshaped our metrics.'
    }
  };
}

export function mockMarketing(idea: string): MarketingResult {
  const name = cleanName(idea);
  return {
    market_size: '₹34,000 Crore',
    target_segment: 'Urban working professionals and students aged 18-35',
    competitors: [
      {
        name: `${name}Fast`,
        threat_level: 'high',
        reason_leading: 'Backed by major venture capital with rapid logistics network.',
        best_strategies: ['Heavy cashback offers', 'Sub-20 minute delivery guarantee'],
        weakness: 'High driver churn rate and negative unit economics.',
        ai_suggestion: ['Focus on retention campaigns', 'Offer customized bulk orders for offices']
      },
      {
        name: `Go${name}`,
        threat_level: 'medium',
        reason_leading: 'Strong B2B corporate partnerships and employee benefit programs.',
        best_strategies: ['Corporate dashboard integrations', 'Post-paid monthly billing'],
        weakness: 'Brittle B2C presence and slow app performance.',
        ai_suggestion: ['Capture the premium B2C segment', 'Build a simplified web client']
      }
    ],
    positioning: `The most reliable, transparent, and eco-friendly ${idea} experience in India.`,
    optimal_opening: 'Establish localized density in a single high-tier tech park before scaling city-wide.',
    go_to_market: [
      'Partner with tech-park food courts and offices',
      'Launch micro-influencer campaigns in tech hubs',
      'Provide zero-fee delivery for the first 1000 signups'
    ],
    narrator_line: 'Market intelligence report completed. The cracks in competitor armor are mapped.'
  };
}

export function mockFutureFounder(idea: string, question: string): string {
  const q = question.toLowerCase();
  if (q.includes('mistake') || q.includes('regret')) {
    return 'Our biggest mistake was holding off on charging subscription fees for the first four months. We burned too much cash trying to acquire customers who didn\'t value the core service. If I were you, I would charge from Day One.';
  }
  if (q.includes('decision') || q.includes('best')) {
    return 'The decision that saved us was investing in proprietary demand-forecasting software in Month 6. It cut our operational waste in half and pushed our unit economics into the positive. Do not outsource your core technology.';
  }
  if (q.includes('survive') || q.includes('outcome')) {
    return 'Yes, we survived, but it was closer than I like to admit. In Month 12, a major security scare almost wiped out our user base. We survived because we were completely transparent and offered free credits to affected accounts.';
  }
  return 'Building this company taught me that retention is the only metric that matters. Do not get distracted by vanity numbers or what competitors are raising. Build something that people love, and survive long enough to monetize it.';
}
