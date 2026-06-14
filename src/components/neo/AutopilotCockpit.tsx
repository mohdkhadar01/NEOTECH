import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutopilot } from '../../hooks/useAutopilot';
import type { 
  AgentThought, AgentName, ResearchData, WorldData, 
  StrategyData, SimulationData, ReportData 
} from '../../lib/ai/agents/types';
import { 
  Loader2, AlertTriangle, Check, Info, 
  TrendingUp, Users, Clock, Award, 
  Newspaper, FileText, CheckCircle2, XCircle
} from 'lucide-react';

const AGENT_ORDER: AgentName[] = [
  'Research Agent', 'World Builder', 'Strategy Agent',
  'Simulation Director', 'Chaos Agent', 'Critic Agent', 'Reporter Agent'
];

const PHASE_LABELS: Record<string, string> = {
  idle: 'Ready',
  researching: 'Scanning market...',
  building_world: 'Creating ecosystem...',
  strategizing: 'Planning strategy...',
  simulating: 'Running simulation...',
  chaos: 'Injecting chaos...',
  critiquing: 'Reviewing decisions...',
  reporting: 'Writing reports...',
  complete: 'Simulation complete'
};

const TYPE_COLORS: Record<string, string> = {
  thinking: '#A8A096',
  insight: '#2563EB',
  decision: '#E8600A',
  conflict: '#C0392B',
  complete: '#2D7A4F',
  warning: '#FFB800'
};

// Auxiliary UI components
function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid #E5DDCB', paddingBottom: 6 }}>
      <Icon size={14} className="text-[#E8600A]" />
      <span style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#1A1714' }}>
        {label}
      </span>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-4 bg-white shadow-paper" style={{ border: '1px solid #E5DDCB' }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096', letterSpacing: 1 }}>{(label || '').toUpperCase()}</div>
      <div className="mt-1" style={{ fontFamily: 'Instrument Serif', fontSize: 28, color: '#1A1714', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ThreatBadge({ level }: { level?: string }) {
  const normalizedLevel = (level || 'low').toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    low: { bg: '#EFF6F1', color: '#2D7A4F' },
    medium: { bg: '#FFF1E5', color: '#B8860B' },
    high: { bg: '#FBE5E0', color: '#C0392B' }
  };
  const theme = map[normalizedLevel] || map.low;
  return (
    <span className="rounded-full px-2 py-0.5" style={{ background: theme.bg, color: theme.color, fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>
      {normalizedLevel.toUpperCase()} THREAT
    </span>
  );
}

function EventTypeBadge({ type }: { type?: string }) {
  const normalizedType = (type || 'decision').toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    milestone: { bg: 'rgba(45,122,79,0.1)', color: '#2D7A4F' },
    crisis: { bg: 'rgba(192,57,43,0.1)', color: '#C0392B' },
    chaos: { bg: 'rgba(192,57,43,0.15)', color: '#C0392B' },
    attack: { bg: 'rgba(192,57,43,0.12)', color: '#C0392B' },
    decision: { bg: 'rgba(232,96,10,0.1)', color: '#E8600A' },
    pivot: { bg: 'rgba(184,134,11,0.1)', color: '#B8860B' }
  };
  const theme = map[normalizedType] || { bg: 'rgba(26,23,20,0.08)', color: '#5A5247' };
  return (
    <span className="rounded px-1.5 py-0.5" style={{ background: theme.bg, color: theme.color, fontFamily: 'JetBrains Mono', fontSize: 8, letterSpacing: 0.5 }}>
      {normalizedType.toUpperCase()}
    </span>
  );
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-4 bg-white shadow-paper" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color, letterSpacing: 0.5 }}>{label}</div>
      <p className="mt-2 text-[#5A5247]" style={{ fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function AgentDecisionPill({ emoji, agent, color, text }: { emoji: string; agent: string; color: string; text: string }) {
  return (
    <div className="flex gap-2.5 items-start mt-3 rounded-lg p-3" style={{ background: '#FAF7F2', border: '1px solid #E5DDCB' }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <div>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color }}>{(agent || '').toUpperCase()} AGENT ACTION</div>
        <p className="mt-1 text-[#1A1714]" style={{ fontFamily: 'Inter', fontSize: 12, lineHeight: 1.45 }}>{text}</p>
      </div>
    </div>
  );
}

function KpiPill({ label, value, color = '#1A1714' }: { label: string; value: string; color?: string }) {
  return (
    <span className="rounded-full px-2 py-0.5" style={{ background: '#F4EFE5', border: '1px solid #E5DDCB', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5A5247' }}>
      {label}: <span style={{ color, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

// Skeleton component with a soft pulse matching warm paper aesthetic
function SkeletonCard({ lines = 3, height = 80 }: { lines?: number; height?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      className="rounded-xl p-4 bg-white shadow-paper"
      style={{ border: '1px solid #E5DDCB', minHeight: height, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ height: 12, width: '40%', background: '#E5DDCB', borderRadius: 4 }} />
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} style={{ height: 8, width: idx === lines - 1 ? '60%' : '100%', background: '#F4EFE5', borderRadius: 4 }} />
      ))}
    </motion.div>
  );
}

function renderSafeStringOrObject(val: any) {
  if (typeof val === 'object' && val !== null) {
    const title = val.title || val.scenario || val.name || val.point || val.label || '';
    const desc = val.description || val.desc || val.detail || val.details || val.value || '';
    if (title && desc) {
      return <span><strong>{title}</strong>: {desc}</span>;
    }
    return <span>{title || desc || JSON.stringify(val)}</span>;
  }
  return <span>{String(val)}</span>;
}

export function AutopilotCockpit({ idea, onComplete, onClose }: { idea: string; onComplete?: (result: any) => void; onClose?: () => void }) {
  const {
    isRunning, phase, thoughts, activeAgent, agentStatuses,
    result, error, avatarText, avatarEmotion,
    agentConfig, start
  } = useAutopilot();

  const thoughtsEndRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set([0]));
  const prevEventsLength = useRef(0);

  // Lock body scroll on mount, restore on unmount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Auto-scroll thoughts stream
  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  // Trigger onComplete when results are final
  useEffect(() => {
    if (result && onComplete) onComplete(result);
  }, [result]);

  // Auto-start simulation on mount
  useEffect(() => {
    if (idea && phase === 'idle' && !isRunning && !result) {
      start(idea);
    }
  }, [idea, phase, isRunning, result, start]);

  // Extract progressive states from raw thoughts stream to render cards on the fly
  const progressiveResearchData = result?.researchData || 
    thoughts.find(t => t.agent === 'Research Agent' && t.type === 'complete')?.data as ResearchData | undefined;
  
  const progressiveWorldAgents = result?.worldData?.agents || 
    (thoughts.find(t => t.agent === 'World Builder' && t.type === 'complete')?.data as WorldData | undefined)?.agents || 
    thoughts.filter(t => t.agent === 'World Builder' && t.type === 'insight' && t.data).map(t => t.data as any);

  const progressiveStrategyData = result?.strategyData || 
    thoughts.find(t => t.agent === 'Strategy Agent' && t.type === 'complete')?.data as StrategyData | undefined;

  // Compile unique timeline events from progressive thoughts stream
  const progressiveEventsMap = new Map<string, any>();
  thoughts.forEach(t => {
    if ((t.agent === 'Simulation Director' || t.agent === 'Chaos Agent' || t.agent === 'Critic Agent') && t.data && (t.data as any).title && (t.data as any).month) {
      const event = t.data as any;
      const key = `${event.month}-${event.title}`;
      const existing = progressiveEventsMap.get(key) || {};
      
      progressiveEventsMap.set(key, {
        ...existing,
        ...event,
        director_decision: event.director_decision || existing.director_decision,
        chaos_injection: event.chaos_injection || existing.chaos_injection,
        critic_challenge: event.critic_challenge || existing.critic_challenge
      });
    }
  });

  const progressiveEvents = result?.simulationData?.events || 
    Array.from(progressiveEventsMap.values()).sort((a, b) => a.month - b.month);

  const progressiveOutcome = result?.simulationData?.outcome || 
    (thoughts.find(t => t.agent === 'Simulation Director' && t.type === 'complete')?.data as SimulationData | undefined)?.outcome;

  const progressiveReportData = result?.reportData || 
    thoughts.find(t => t.agent === 'Reporter Agent' && t.type === 'complete')?.data as ReportData | undefined;

  // Auto-expand and scroll to latest events in timeline
  useEffect(() => {
    if (progressiveEvents.length > prevEventsLength.current) {
      const latestIndex = progressiveEvents.length - 1;
      setExpandedEvents(prev => {
        const next = new Set(prev);
        next.add(latestIndex);
        return next;
      });
      prevEventsLength.current = progressiveEvents.length;

      // Scroll to bottom of timeline in right panel
      if (rightPanelRef.current) {
        setTimeout(() => {
          rightPanelRef.current?.scrollTo({
            top: rightPanelRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 120);
      }
    }
  }, [progressiveEvents.length]);

  const handleLaunch = () => {
    start(idea);
  };

  // Compute progress percent for visual bar
  const getPhaseProgress = (currentPhase: string) => {
    switch (currentPhase) {
      case 'idle': return 0;
      case 'researching': return 15;
      case 'building_world': return 35;
      case 'strategizing': return 50;
      case 'simulating': return 75;
      case 'chaos': return 82;
      case 'critiquing': return 88;
      case 'reporting': return 95;
      case 'complete': return 100;
      default: return 50;
    }
  };
  const currentProgress = getPhaseProgress(phase);

  const getPhaseNumber = (p: string) => {
    if (p === 'researching') return 1;
    if (p === 'building_world') return 2;
    if (p === 'strategizing') return 3;
    if (['simulating', 'chaos', 'critiquing'].includes(p)) return 4;
    return 5;
  };
  const activePhaseNumber = result ? 5 : getPhaseNumber(phase);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#FAF7F2',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* ── COCKPIT TOP DASHBOARD HEADER ── */}
      <div style={{
        padding: '16px 24px',
        background: '#FAF7F2',
        borderBottom: '1.5px solid #E5DDCB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div className="flex items-center gap-4">
          <div>
            <span style={{ fontFamily: 'Instrument Serif', fontSize: 24, fontWeight: 600, color: '#1A1714' }}>
              NEO-VERSE
            </span>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#E8600A', marginLeft: 10, borderLeft: '1px solid #E5DDCB', paddingLeft: 10 }}>
              AUTOPILOT COCKPIT
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#5A5247', background: '#F4EFE5', padding: '4px 12px', borderRadius: 6, border: '1px solid #E5DDCB' }}>
            Simulating: <strong style={{ color: '#1A1714' }}>{idea}</strong>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-[#E8600A]' : 'bg-[#2D7A4F]'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-[#E8600A]' : 'bg-[#2D7A4F]'}`}></span>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, color: '#1A1714' }}>
              {(PHASE_LABELS[phase] || phase || '').toUpperCase()}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #E5DDCB',
                borderRadius: 6,
                fontFamily: 'Space Grotesk',
                fontSize: 10,
                fontWeight: 700,
                color: '#5A5247',
                letterSpacing: 1,
                cursor: 'pointer'
              }}
              className="hover:bg-[#F4EFE5] hover:text-[#1A1714] transition-colors"
            >
              CLOSE COCKPIT
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN SPLIT-SCREEN WORKSPACE ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '38% 62%',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>

        {/* ── LEFT PANEL: Agent Activity Feed ── */}
        <div style={{
          borderRight: '1.5px solid #E5DDCB',
          display: 'flex',
          flexDirection: 'column',
          background: '#F4EFE5',
          height: '100%',
          overflow: 'hidden'
        }}>

          {/* Panel header */}
          <div style={{
            padding: '18px 20px',
            borderBottom: '1.5px solid #E5DDCB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF7F2'
          }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, 
                            letterSpacing: 2, color: '#E8600A', marginBottom: 2 }}>
                AGENT WAR ROOM
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#5A5247' }}>
                {PHASE_LABELS[phase]}
              </div>
            </div>
            {isRunning && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    style={{ width: 4, background: '#E8600A', borderRadius: 2 }}
                    animate={{ height: [4, 16, 4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Agent roster */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #E5DDCB', background: '#FAF7F2' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {AGENT_ORDER.map(agentName => {
                const config = agentConfig[agentName];
                const status = agentStatuses[agentName] || 'idle';
                const isActive = activeAgent === agentName;
                return (
                  <motion.div key={agentName}
                    animate={{ opacity: status === 'idle' && !isActive ? 0.25 : 1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '4px 8px', borderRadius: 6,
                      background: isActive ? 'rgba(232,96,10,0.06)' : 'transparent',
                      border: isActive ? '1px solid rgba(232,96,10,0.15)' : '1px solid transparent'
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{config?.emoji || '🤖'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700,
                                    color: '#1A1714' }}>{agentName}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: 8, color: '#5A5247', lineHeight: 1.1 }}>
                        {config?.description || ''}
                      </div>
                    </div>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: status === 'done' ? '#2D7A4F' 
                                 : isActive ? '#E8600A' 
                                 : '#D3C9B6'
                    }} />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Thought stream */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} className="space-y-3">
            {!isRunning && thoughts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤵💼</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 12, color: '#5A5247' }}>
                  Launch Autopilot to spawn 7 agents to stress-test and simulate your startup.
                </div>
              </div>
            )}
            <AnimatePresence>
              {thoughts.map((thought, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    borderLeft: `3px solid ${TYPE_COLORS[thought.type] || '#A8A096'}`,
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid #E5DDCB',
                    borderLeftWidth: 3
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11 }}>
                      {agentConfig[thought.agent]?.emoji}
                    </span>
                    <span style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700,
                                   color: TYPE_COLORS[thought.type] }}>
                      {(thought.agent || '').toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#A8A096',
                                   marginLeft: 'auto' }}>
                      {new Date(thought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#1A1714',
                                lineHeight: 1.45 }}>
                    {thought.message}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={thoughtsEndRef} />
          </div>

          {/* Simulation starts automatically on mount */}

          {error && (
            <div style={{ padding: 18, background: '#FAF7F2' }}>
              <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
                            borderRadius: 8, padding: 12, fontFamily: 'Inter', fontSize: 11,
                            color: '#C0392B' }}>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Progressive Output ── */}
        <div 
          ref={rightPanelRef}
          style={{ overflowY: 'auto', padding: '24px 30px', height: '100%', position: 'relative' }} 
          className="ruled"
        >
          <div className="absolute inset-0 paper-grain pointer-events-none opacity-40" />

          {/* Progressive Header / Progress Bar */}
          <div style={{ marginBottom: 30, background: '#FAF7F2', paddingBottom: 16, borderBottom: '1px solid #E5DDCB', position: 'sticky', top: -24, zIndex: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 10, color: '#E8600A', letterSpacing: 1.5, fontWeight: 700 }}>
                SIMULATION STATUS: {(PHASE_LABELS[phase] || phase || '').toUpperCase()}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096', marginLeft: 'auto' }}>
                STAGE COMPLETED: {currentProgress}%
              </span>
            </div>
            <div style={{ height: 6, background: '#E5DDCB', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: '#E8600A' }}
                initial={{ width: '0%' }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>

          <div className="space-y-8 relative z-10 pb-12">
            
            {/* ── 01 / MARKET RESEARCH SUMMARY ── */}
            <div>
              <SectionLabel icon={TrendingUp} label="01 / MARKET RESEARCH SUMMARY" />
              {progressiveResearchData ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <MetricPill label="TAM (India Market Size)" value={progressiveResearchData.market_size || 'N/A'} />
                    <MetricPill label="Market CAGR" value={progressiveResearchData.market_cagr || 'N/A'} />
                  </div>
                  
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700,
                                letterSpacing: 1.2, color: '#5A5247', marginBottom: 10 }}>
                    COMPETITIVE RADAR MAP
                  </div>
                  <div className="space-y-2">
                    {(progressiveResearchData.real_competitors || []).map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid #E5DDCB'
                      }} className="shadow-paper">
                        <div className="flex-1">
                          <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700,
                                         color: '#1A1714' }}>{c?.name || 'N/A'}</span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096',
                                         marginLeft: 10 }}>Funding: {c?.funding || 'N/A'}</span>
                          <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#5A5247',
                                         marginLeft: 10, fontStyle: 'italic' }}>Weakness: {c?.weakness || 'N/A'}</span>
                        </div>
                        <ThreatBadge level={c?.threat} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4 bg-[#EFF6F1]" style={{ border: '1px solid rgba(45,122,79,0.2)' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color: '#2D7A4F' }}>IDENTIFIED OPPORTUNITIES</div>
                      <ul className="mt-2 space-y-1 text-xs text-[#5A5247] list-disc pl-4">
                        {(progressiveResearchData.opportunities || []).map((o, idx) => <li key={idx}>{renderSafeStringOrObject(o)}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-lg p-4 bg-[#FBE5E0]" style={{ border: '1px solid rgba(192,57,43,0.2)' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color: '#C0392B' }}>MARKET RISKS</div>
                      <ul className="mt-2 space-y-1 text-xs text-[#5A5247] list-disc pl-4">
                        {(progressiveResearchData.risks || []).map((r, idx) => <li key={idx}>{renderSafeStringOrObject(r)}</li>)}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ opacity: phase === 'researching' ? 1 : 0.4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <SkeletonCard lines={2} height={80} />
                    <SkeletonCard lines={2} height={80} />
                  </div>
                  <SkeletonCard lines={3} height={120} />
                </div>
              )}
            </div>

            {/* ── 02 / SPAWNED STAKEHOLDERS ── */}
            {activePhaseNumber >= 2 && (
              <div>
                <SectionLabel icon={Users} label="02 / SPAWNED STAKEHOLDERS" />
                {progressiveWorldAgents.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {progressiveWorldAgents.map((agent, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        key={i} 
                        className="rounded-xl p-4 bg-white shadow-paper" 
                        style={{ border: '1px solid #E5DDCB' }}
                      >
                        <div className="flex justify-between items-start">
                          <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: '#1A1714' }}>
                            {agent?.short_role || 'N/A'}
                          </span>
                          <span className="rounded px-1.5 py-0.5" style={{ 
                            fontSize: 8, 
                            fontFamily: 'JetBrains Mono',
                            background: (agent?.state || '').toLowerCase() === 'supportive' ? 'rgba(45,122,79,0.1)' 
                              : (agent?.state || '').toLowerCase() === 'concerned' ? 'rgba(192,57,43,0.1)' : '#E5DDCB',
                            color: (agent?.state || '').toLowerCase() === 'supportive' ? '#2D7A4F' 
                              : (agent?.state || '').toLowerCase() === 'concerned' ? '#C0392B' : '#5A5247'
                          }}>
                            {(agent?.state || 'NEUTRAL').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A8A096] font-mono mt-0.5">{agent?.role || ''}</div>
                        <p style={{ fontFamily: 'Inter', fontSize: 11, color: '#5A5247', marginTop: 8, lineHeight: 1.4 }}>
                          {agent?.specific_description || ''}
                        </p>
                        <div style={{ borderTop: '1px dashed #E5DDCB', marginTop: 8, paddingTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div>
                            <div style={{ fontSize: 8, color: '#A8A096', fontFamily: 'Space Grotesk', fontWeight: 600 }}>MOTIVATION</div>
                            <div style={{ fontSize: 9.5, color: '#2D7A4F', lineHeight: 1.2 }}>{agent?.motivation || ''}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: '#A8A096', fontFamily: 'Space Grotesk', fontWeight: 600 }}>FEAR</div>
                            <div style={{ fontSize: 9.5, color: '#C0392B', lineHeight: 1.2 }}>{agent?.fear || ''}</div>
                          </div>
                        </div>
                        {agent?.opening_thought && (
                          <div style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 12.5, color: '#E8600A', marginTop: 8 }}>
                            &ldquo;{agent.opening_thought}&rdquo;
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{ opacity: phase === 'building_world' ? 1 : 0.4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                      <SkeletonCard lines={3} height={140} />
                      <SkeletonCard lines={3} height={140} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 03 / STRATEGIC COMPASS ── */}
            {activePhaseNumber >= 3 && (
              <div>
                <SectionLabel icon={FileText} label="03 / STRATEGIC COMPASS" />
                {progressiveStrategyData ? (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div style={{
                      padding: '14px 18px', borderRadius: 8, marginBottom: 12,
                      background: 'rgba(232,96,10,0.05)',
                      border: '1px solid rgba(232,96,10,0.15)'
                    }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700,
                                    color: '#E8600A', marginBottom: 4 }}>CORE THESIS & INSIGHT</div>
                      <div style={{ fontFamily: 'Instrument Serif', fontSize: 16, color: '#1A1714',
                                    fontStyle: 'italic', lineHeight: 1.5 }}>
                        &ldquo;{progressiveStrategyData.key_insight}&rdquo;
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <InfoCard label="Unfair Advantage" value={progressiveStrategyData.unfair_advantage} color="#2D7A4F" />
                      <InfoCard label="Critical Risk" value={progressiveStrategyData.critical_risk} color="#C0392B" />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <div className="p-3 bg-white rounded-lg" style={{ border: '1px solid #E5DDCB' }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700, color: '#5A5247' }}>MONTHS 1-3</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#1A1714', marginTop: 4, lineHeight: 1.35 }}>{progressiveStrategyData.month_1_to_3}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg" style={{ border: '1px solid #E5DDCB' }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700, color: '#5A5247' }}>MONTHS 4-9</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#1A1714', marginTop: 4, lineHeight: 1.35 }}>{progressiveStrategyData.month_4_to_9}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg" style={{ border: '1px solid #E5DDCB' }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 700, color: '#5A5247' }}>MONTHS 10-18</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#1A1714', marginTop: 4, lineHeight: 1.35 }}>{progressiveStrategyData.month_10_to_18}</div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div style={{ opacity: phase === 'strategizing' ? 1 : 0.4 }}>
                    <SkeletonCard lines={2} height={100} />
                  </div>
                )}
              </div>
            )}

            {/* ── 04 / SIMULATION TIMELINE PROTOCOL ── */}
            {activePhaseNumber >= 4 && (
              <div>
                <SectionLabel icon={Clock} label="04 / SIMULATION TIMELINE PROTOCOL" />
                {progressiveEvents.length > 0 ? (
                  <div style={{ position: 'relative', paddingLeft: 22 }}>
                    <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4,
                                  width: 1.5, background: '#E5DDCB' }} />
                    {progressiveEvents.map((event, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: 12, position: 'relative' }}
                      >
                        <div style={{
                          position: 'absolute', left: -19, top: 12,
                          width: 9, height: 9, borderRadius: '50%',
                          background: event.type === 'milestone' ? '#2D7A4F'
                                     : event.type === 'crisis' || event.type === 'chaos' || event.type === 'attack' ? '#C0392B'
                                     : '#E8600A',
                          boxShadow: '0 0 0 4px #FAF7F2'
                        }} />
                        <div
                          onClick={() => setExpandedEvents(prev => {
                            const n = new Set(prev);
                            n.has(i) ? n.delete(i) : n.add(i);
                            return n;
                          })}
                          style={{
                            padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                            borderLeft: `3px solid ${
                              event.type === 'milestone' ? '#2D7A4F'
                              : event.type === 'crisis' || event.type === 'chaos' || event.type === 'attack' ? '#C0392B'
                              : '#E8600A'
                            }`,
                            background: 'white',
                            border: '1px solid #E5DDCB',
                            borderLeftWidth: 3
                          }}
                          className="shadow-paper hover:bg-[#FAF7F2] transition-colors"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9,
                                             color: '#A8A096', marginRight: 8 }}>
                                MONTH {event.month}
                              </span>
                              <span style={{ fontFamily: 'Space Grotesk', fontSize: 12,
                                             fontWeight: 700, color: '#1A1714' }}>
                                {event.title}
                              </span>
                            </div>
                            <EventTypeBadge type={event.type} />
                          </div>

                          {expandedEvents.has(i) && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ fontFamily: 'Inter', fontSize: 12, color: '#5A5247',
                                            lineHeight: 1.5, marginTop: 8 }}>
                                {event.description}
                              </div>
                              
                              {event.narrator_line && (
                                <p className="mt-2 italic text-[#E8600A]" style={{ fontFamily: 'Instrument Serif', fontSize: 13.5 }}>
                                  &ldquo;{event.narrator_line}&rdquo;
                                </p>
                              )}

                              {event.director_decision && (
                                <AgentDecisionPill
                                  emoji="⚡"
                                  agent="Director"
                                  color="#2D7A4F"
                                  text={event.director_decision}
                                />
                              )}
                              {event.chaos_injection && (
                                <AgentDecisionPill
                                  emoji="😈"
                                  agent="Chaos"
                                  color="#C0392B"
                                  text={event.chaos_injection}
                                />
                              )}
                              {event.critic_challenge && (
                                <AgentDecisionPill
                                  emoji="🎯"
                                  agent="Critic"
                                  color="#FFB800"
                                  text={event.critic_challenge}
                                />
                              )}

                              {/* KPI pills */}
                              {event.kpis && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px dashed #E5DDCB' }}>
                                  <KpiPill label="Users" value={(event.kpis.users || 0).toLocaleString()} />
                                  <KpiPill label="Revenue"
                                    value={`₹${((event.kpis.revenue_inr || 0)/100000).toFixed(1)}L`} />
                                  <KpiPill label="Runway" value={`${event.kpis.runway_months || 0}mo`} />
                                  <KpiPill label="Team" value={`${event.kpis.team_size || 0} people`} />
                                  <KpiPill label="Morale" value={`${event.kpis.morale || 0}%`}
                                    color={(event.kpis.morale || 0) > 60 ? '#2D7A4F' : '#C0392B'} />
                                  <KpiPill label="Trust" value={`${event.kpis.trust_score || 0}%`} />
                                  <KpiPill label="Risk" value={`${event.kpis.risk_score || 0}%`} color={(event.kpis.risk_score || 0) > 60 ? '#C0392B' : '#2D7A4F'} />
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{ opacity: (phase === 'simulating' || phase === 'chaos' || phase === 'critiquing') ? 1 : 0.4 }}>
                    <SkeletonCard lines={2} height={80} />
                  </div>
                )}
              </div>
            )}

            {/* ── 05 / FINAL PERFORMANCE METRICS ── */}
            {activePhaseNumber >= 5 && (
              progressiveOutcome ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ borderTop: '1.5px solid #E5DDCB', paddingTop: 24 }}>
                  <SectionLabel icon={Award} label="05 / FINAL PERFORMANCE METRICS" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                    <div className="rounded-xl p-4 bg-white text-center shadow-paper" style={{ border: '1px solid #E5DDCB' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096', letterSpacing: 0.5 }}>SURVIVAL</div>
                      <div style={{ fontFamily: 'Instrument Serif', fontSize: 36, color: (progressiveOutcome.survival_probability || 0) > 50 ? '#2D7A4F' : '#C0392B', fontWeight: 600 }}>
                        {progressiveOutcome.survival_probability || 0}%
                      </div>
                    </div>
                    <div className="rounded-xl p-4 bg-white text-center shadow-paper" style={{ border: '1px solid #E5DDCB' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096', letterSpacing: 0.5 }}>FINAL REVENUE</div>
                      <div style={{ fontFamily: 'Instrument Serif', fontSize: 36, color: '#1A1714', fontWeight: 600 }}>
                        ₹{((progressiveOutcome.final_revenue_inr || 0) / 10000000).toFixed(1)}Cr
                      </div>
                    </div>
                    <div className="rounded-xl p-4 bg-white text-center shadow-paper" style={{ border: '1px solid #E5DDCB' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#A8A096', letterSpacing: 0.5 }}>ACTIVE USERS</div>
                      <div style={{ fontFamily: 'Instrument Serif', fontSize: 36, color: '#E8600A', fontWeight: 600 }}>
                        {((progressiveOutcome.final_users || 0) / 1000).toFixed(1)}k
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg p-5 text-center" style={{
                    background: (progressiveOutcome.survival_probability || 0) > 50 ? '#EFF6F1' : '#FBE5E0',
                    border: `1px solid ${(progressiveOutcome.survival_probability || 0) > 50 ? 'rgba(45,122,79,0.25)' : 'rgba(192,57,43,0.25)'}`
                  }}>
                    <div className="flex justify-center items-center gap-2 mb-2">
                      {(progressiveOutcome.survival_probability || 0) > 50 ? <CheckCircle2 size={18} color="#2D7A4F" /> : <XCircle size={18} color="#C0392B" />}
                      <span style={{
                        fontFamily: 'Space Grotesk',
                        color: (progressiveOutcome.survival_probability || 0) > 50 ? '#2D7A4F' : '#C0392B',
                        fontSize: 14, fontWeight: 700
                      }}>
                        {progressiveOutcome.verdict || ''}
                      </span>
                    </div>
                    <p className="text-[#5A5247] italic" style={{ fontFamily: 'Instrument Serif', fontSize: 14.5 }}>
                      &ldquo;{progressiveOutcome.key_lesson || ''}&rdquo;
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 10, borderTop: '1px dashed rgba(26,23,20,0.1)' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 9, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#2D7A4F' }}>BEST STRATEGIC DECISION</div>
                        <div style={{ fontSize: 11, color: '#5A5247', marginTop: 2 }}>{progressiveOutcome.best_decision || 'N/A'}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 9, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#C0392B' }}>GREATEST MISTAKE MADE</div>
                        <div style={{ fontSize: 11, color: '#5A5247', marginTop: 2 }}>{progressiveOutcome.biggest_mistake || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ borderTop: '1.5px solid #E5DDCB', paddingTop: 24 }}>
                  <SectionLabel icon={Award} label="05 / FINAL PERFORMANCE METRICS" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                    <SkeletonCard lines={1} height={60} />
                    <SkeletonCard lines={1} height={60} />
                    <SkeletonCard lines={1} height={60} />
                  </div>
                </div>
              )
            )}

            {/* ── 06 / SIMULATED PRESS CLIPPINGS ── */}
            {activePhaseNumber >= 5 && (
              progressiveReportData?.fake_news_articles && progressiveReportData.fake_news_articles.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <SectionLabel icon={Newspaper} label="06 / SIMULATED PRESS CLIPPINGS" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    {progressiveReportData.fake_news_articles.map((art, idx) => (
                      <div key={idx} className="rounded-lg p-4 bg-white shadow-paper" style={{ border: '1px solid #E5DDCB', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5DDCB', paddingBottom: 3, marginBottom: 8 }}>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#E8600A' }}>{art?.outlet || ''}</span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#A8A096', marginLeft: 'auto' }}>Month {art?.month || 0}</span>
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: '#1A1714', lineHeight: 1.25 }}>
                          {art?.headline || ''}
                        </div>
                        <p className="mt-2 text-[#5A5247] italic" style={{ fontFamily: 'Inter', fontSize: 11.5, lineHeight: 1.45 }}>
                          &ldquo;{art?.snippet || ''}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div>
                  <SectionLabel icon={Newspaper} label="06 / SIMULATED PRESS CLIPPINGS" />
                  <SkeletonCard lines={2} height={100} />
                </div>
              )
            )}

            {/* ── 07 / LETTER FROM THE FUTURE ── */}
            {activePhaseNumber >= 5 && (
              progressiveReportData?.future_founder_letter ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <SectionLabel icon={FileText} label="07 / LETTER FROM THE FUTURE" />
                  <div className="rounded-xl p-6 shadow-paper-lg" style={{ 
                    background: 'white', 
                    border: '1px solid #E5DDCB', 
                    backgroundImage: 'radial-gradient(rgba(26,23,20,0.06) 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#A8A096', letterSpacing: 0.5, marginBottom: 4 }}>
                      POST-MORTEM CORRESPONDENCE // 5 YEARS POST-LAUNCH
                    </div>
                    <div style={{ fontFamily: 'Instrument Serif', fontSize: 22, color: '#1A1714', fontWeight: 600, borderBottom: '1.5px solid #E5DDCB', paddingBottom: 6 }}>
                      Dear Month-1 Self,
                    </div>
                    <div className="mt-4 space-y-3" style={{ 
                      fontFamily: 'Inter', 
                      fontSize: 13, 
                      color: '#1A1714', 
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line'
                    }}>
                      {progressiveReportData.future_founder_letter}
                    </div>
                    <div className="mt-6 text-right" style={{ fontFamily: 'Instrument Serif', fontSize: 18, fontStyle: 'italic', color: '#E8600A' }}>
                      Sincerely, <br />
                      The Future Founder.
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div>
                  <SectionLabel icon={FileText} label="07 / LETTER FROM THE FUTURE" />
                  <SkeletonCard lines={4} height={140} />
                </div>
              )
            )}

            {/* ── 08 / STRATEGIC POST-MORTEM ── */}
            {activePhaseNumber >= 5 && (
              progressiveReportData?.strategic_report ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <SectionLabel icon={Info} label="08 / STRATEGIC POST-MORTEM" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4 bg-white" style={{ border: '1px solid #E5DDCB' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color: '#2D7A4F' }}>WHAT WORKED WELL</div>
                      <ul className="mt-2 space-y-1 text-xs text-[#5A5247] list-disc pl-4">
                        {(progressiveReportData.strategic_report.what_worked || []).map((item, idx) => <li key={idx}>{renderSafeStringOrObject(item)}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-lg p-4 bg-white" style={{ border: '1px solid #E5DDCB' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color: '#C0392B' }}>WHAT TO AVOID</div>
                      <ul className="mt-2 space-y-1 text-xs text-[#5A5247] list-disc pl-4">
                        {(progressiveReportData.strategic_report.what_failed || []).map((item, idx) => <li key={idx}>{renderSafeStringOrObject(item)}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-white mt-4" style={{ border: '1px solid #E5DDCB' }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, fontWeight: 700, color: '#E8600A' }}>ALTERNATIVE FUTURE LINES</div>
                    <ul className="mt-2 space-y-1 text-xs text-[#5A5247] list-disc pl-4">
                      {(progressiveReportData.strategic_report.alternative_futures || []).map((fut, idx) => <li key={idx}>{renderSafeStringOrObject(fut)}</li>)}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div>
                  <SectionLabel icon={Info} label="08 / STRATEGIC POST-MORTEM" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <SkeletonCard lines={2} height={80} />
                    <SkeletonCard lines={2} height={80} />
                  </div>
                </div>
              )
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default AutopilotCockpit;
