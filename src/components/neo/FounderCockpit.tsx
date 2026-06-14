import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, Zap, Flame, Users, TrendingUp,
  DollarSign, Clock, Shield, AlertTriangle, MessageSquare,
  ChevronRight, CornerUpRight, Terminal, Activity, Eye, Star,
  BarChart2, Globe, Loader2, Lock, Sparkles, ArrowRight, Radio
} from "lucide-react";
import type { useSimulation } from "@/hooks/useSimulation";
import type { SimAgent, SimEvent } from "@/lib/ai/types";

const Boardroom = lazy(() => import("./Boardroom"));
const ChaosMode = lazy(() => import("./ChaosMode"));
const FutureFounder = lazy(() => import("./FutureFounder"));

interface FounderCockpitProps {
  idea: string;
  onClose: () => void;
  sim: ReturnType<typeof useSimulation>;
}

// ─── Color tokens (warm cream/orange theme) ───────────────────────────────────
const CREAM = "#FAF7F2";
const CREAM2 = "#F4EFE5";
const CREAM3 = "#E5DDCB";
const INK = "#1A1714";
const INK2 = "#5A5247";
const INK3 = "#A8A096";
const ORANGE = "#E8600A";
const GREEN = "#2D7A4F";
const RED = "#C0392B";
const GOLD = "#B8860B";

const STATE_COLOR: Record<string, string> = {
  supportive: GREEN,
  neutral: INK3,
  concerned: RED,
  influencing: "#8B5CF6",
  collaborative: "#2563EB",
};

const THREAT_COLOR: Record<string, string> = {
  low: GREEN,
  medium: GOLD,
  high: RED,
};

const EVENT_COLOR: Record<string, string> = {
  milestone: GREEN,
  crisis: RED,
  attack: RED,
  chaos: RED,
  decision: GOLD,
  outcome: ORANGE,
};

const EVENT_BG: Record<string, string> = {
  milestone: "#F0F7F3",
  crisis: "#FBF0EF",
  attack: "#FBF0EF",
  chaos: "#FBF0EF",
  decision: "#FDFAF0",
  outcome: "#FFF5EE",
};

const EVENT_BORDER: Record<string, string> = {
  milestone: "rgba(45,122,79,0.2)",
  crisis: "rgba(192,57,43,0.2)",
  attack: "rgba(192,57,43,0.2)",
  chaos: "rgba(192,57,43,0.2)",
  decision: "rgba(184,134,11,0.2)",
  outcome: "rgba(232,96,10,0.2)",
};

const AVATAR_EMOJI: Record<string, string> = {
  investor: "💼", customer: "👤", competitor: "⚔️",
  regulator: "🏛️", employee: "👥", media: "📰",
  founder: "🚀", generic: "🤖",
};

const EVENT_ICON: Record<string, React.ReactNode> = {
  milestone: <Star size={10} />,
  crisis: <AlertTriangle size={10} />,
  attack: <Shield size={10} />,
  chaos: <Flame size={10} />,
  decision: <CornerUpRight size={10} />,
  outcome: <Globe size={10} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v}`;
}

// ─── KPI Gauge ────────────────────────────────────────────────────────────────
function Gauge({ label, value, max = 100, color, icon, format }: {
  label: string; value: number; max?: number; color: string;
  icon: React.ReactNode; format?: (v: number) => string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const display = format ? format(value) : value.toLocaleString();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" style={{ color: INK3, fontSize: 9, fontFamily: "JetBrains Mono", letterSpacing: 0.8 }}>
          <span style={{ color }}>{icon}</span>
          <span>{label.toUpperCase()}</span>
        </div>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color }}>
          {display}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: CREAM3 }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─── Ecosystem Node ───────────────────────────────────────────────────────────
function AgentNode({ agent, selected, onClick, index, total }: {
  agent: SimAgent; selected: boolean; onClick: () => void;
  index: number; total: number;
}) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = 115;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const color = STATE_COLOR[agent.state] || INK3;

  return (
    <div
      className="absolute"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
        zIndex: selected ? 20 : 10,
      }}
    >
      <svg className="absolute overflow-visible pointer-events-none" style={{ width: 0, height: 0, left: 20, top: 20 }}>
        <line x1={0} y1={0} x2={-x} y2={-y}
          stroke={selected ? color : CREAM3}
          strokeWidth={selected ? 1.5 : 1}
          strokeDasharray="4 4"
        />
      </svg>

      <motion.button
        onClick={onClick}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.07, type: "spring", stiffness: 140 }}
        whileHover={{ scale: 1.15 }}
        className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
        style={{
          background: selected ? color + "18" : CREAM,
          border: `2px solid ${selected ? color : CREAM3}`,
          boxShadow: selected ? `0 0 16px ${color}40` : `0 2px 8px rgba(26,23,20,0.08)`,
        }}
      >
        <span className="text-base leading-none">{AVATAR_EMOJI[agent.avatar_type] || "🤖"}</span>
        <span
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2"
          style={{ background: THREAT_COLOR[agent.threat_level], borderColor: CREAM2 }}
        />
        <span
          className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[8px] font-semibold shadow-sm"
          style={{
            background: selected ? color + "15" : CREAM,
            color: selected ? color : INK2,
            border: `1px solid ${selected ? color + "30" : CREAM3}`,
            fontFamily: "Space Grotesk",
          }}
        >
          {agent.short_role}
        </span>
      </motion.button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FounderCockpit({ idea, onClose, sim }: FounderCockpitProps) {
  const {
    loading, result, makeDecision, openBoardroom, initiateChaos,
    showBoardroom, showChaos, showFutureFounder,
    setShowBoardroom, setShowChaos, setShowFutureFounder,
    boardroomSession, chaosEvent, sessionId, currentIdea, absorbChaos
  } = sim;

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<SimAgent | null>(null);
  const [customText, setCustomText] = useState("");
  const [executingCustom, setExecutingCustom] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [activeTab, setActiveTab] = useState<"agents" | "ecosystem">("agents");
  const feedRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * ── CRITICAL FIX ─────────────────────────────────────────────────────────
   * We track the simulation identity by startup_name + initial timeline count.
   * This ensures step resets ONLY when a completely new simulation starts,
   * NOT when makeDecision appends events to an existing timeline.
   */
  const simIdentityRef = useRef<string>("");

  useEffect(() => {
    if (!result) return;
    const identity = `${result.startup_name}::${result.timeline[0]?.title ?? ""}`;
    if (identity !== simIdentityRef.current) {
      // It's a genuinely new simulation — reset
      simIdentityRef.current = identity;
      setStep(1);
      setSelectedAgent(result.agents?.[0] ?? null);
      setAutoPlay(false);
    }
    // If the identity is the same, makeDecision just appended events — do NOT reset step
  }, [result?.startup_name, result?.timeline?.[0]?.title]);

  // Select first agent on load
  useEffect(() => {
    if (result?.agents?.length && !selectedAgent) {
      setSelectedAgent(result.agents[0]);
    }
  }, [result?.agents]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [step]);

  // Auto-play
  useEffect(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (!autoPlay || !result) return;

    autoPlayRef.current = setInterval(() => {
      setStep(prev => {
        const hasNext = prev < result.timeline.length;
        const curr = result.timeline[prev - 1];
        const isPending = curr?.type === "decision" && !!curr.decision && hasNext;
        if (!hasNext || isPending || loading) {
          setAutoPlay(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2600);

    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [autoPlay, result, loading]);

  if (!result) return null;

  const revealed = result.timeline.slice(0, step);
  const currentEvent = revealed[revealed.length - 1];
  const hasNext = step < result.timeline.length;
  const isDecisionPending = !!(currentEvent?.type === "decision" && currentEvent.decision && hasNext);
  const isComplete = step >= result.timeline.length;
  const kpis = currentEvent?.kpis ?? result.timeline[0]?.kpis ?? {
    users: 0, revenue_inr: 0, runway_months: 18,
    team_size: 4, morale: 80, trust_score: 80,
    investor_confidence: 60, risk_score: 20
  };

  const handleNext = () => {
    if (!hasNext || isDecisionPending || loading) return;
    setStep(p => p + 1);
  };

  const handleDecide = async (prompt: string, label: string) => {
    await makeDecision(prompt, label);
    // After decision, advance by 1 to show consequences
    setStep(p => p + 1);
  };

  const handleCustomDecide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || loading || !currentEvent?.decision) return;
    setExecutingCustom(true);
    try {
      await handleDecide(currentEvent.decision.prompt, customText);
      setCustomText("");
    } finally { setExecutingCustom(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: CREAM, fontFamily: "Inter, sans-serif" }}
    >
      {/* Paper grain */}
      <div className="absolute inset-0 paper-grain opacity-40 pointer-events-none" />

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: CREAM3, background: "#FAF7F2" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: ORANGE + "15", border: `1.5px solid ${ORANGE}40` }}>
              <Radio size={15} style={{ color: ORANGE }} />
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 800, color: INK, letterSpacing: 2.5 }}>
                FOUNDER COCKPIT
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: ORANGE, letterSpacing: 2 }}>
                LIVE SIMULATION
              </div>
            </div>
          </div>

          <div className="hidden md:block h-7 w-px" style={{ background: CREAM3 }} />

          <div className="hidden md:block rounded-xl px-3 py-1.5 shadow-sm"
            style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 7, color: INK3, letterSpacing: 1 }}>STARTUP</div>
            <div style={{ fontFamily: "Instrument Serif", fontSize: 14, color: INK }}>
              {result.startup_name}<span style={{ color: ORANGE }}>.</span>
            </div>
          </div>

          <div className="hidden lg:block rounded-xl px-3 py-1.5 shadow-sm"
            style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 7, color: INK3, letterSpacing: 1 }}>INDUSTRY</div>
            <div style={{ fontFamily: "Space Grotesk", fontSize: 11, fontWeight: 600, color: INK2 }}>{result.industry}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Month indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 shadow-sm"
            style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
            <Activity size={9} style={{ color: ORANGE }} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: INK }}>
              MONTH {String(currentEvent?.month ?? 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: INK3 }}>
              / {result.timeline[result.timeline.length - 1]?.month ?? 18}
            </span>
          </div>

          {/* Survival probability */}
          <div className="relative hidden sm:flex items-center justify-center"
            title={`Survival: ${result.outcome.survival_probability}%`}>
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="14" stroke={CREAM3} strokeWidth="3" fill="none" />
              <motion.circle
                cx="19" cy="19" r="14"
                stroke={result.outcome.survival_probability > 60 ? GREEN : result.outcome.survival_probability > 40 ? GOLD : RED}
                strokeWidth="3" fill="none" strokeLinecap="round"
                transform="rotate(-90 19 19)"
                initial={{ strokeDasharray: 88, strokeDashoffset: 88 }}
                animate={{ strokeDashoffset: 88 - (result.outcome.survival_probability / 100) * 88 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <text x="19" y="22.5" textAnchor="middle" fill={INK} style={{ fontSize: 7, fontFamily: "JetBrains Mono", fontWeight: 700 }}>
                {result.outcome.survival_probability}%
              </text>
            </svg>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all hover:bg-red-50"
            style={{ border: `1px solid ${RED}30`, color: RED, fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 600 }}
          >
            <X size={12} /> EXIT
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN AREA ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: KPI + Agent panels */}
        <div className="flex-shrink-0 flex flex-col border-r overflow-hidden"
          style={{ width: 240, borderColor: CREAM3 }}>

          {/* KPI Gauges */}
          <div className="p-4 border-b space-y-3.5" style={{ borderColor: CREAM3, background: CREAM2 + "60" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 size={10} style={{ color: ORANGE }} />
              <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: ORANGE, letterSpacing: 2 }}>LIVE METRICS</span>
            </div>
            <Gauge label="Users" value={kpis.users} max={50000} color="#2563EB" icon={<Users size={9} />} />
            <Gauge label="Revenue" value={kpis.revenue_inr} max={10000000} color={GREEN} icon={<DollarSign size={9} />} format={fmtINR} />
            <Gauge label="Runway" value={kpis.runway_months} max={36} color={GOLD} icon={<Clock size={9} />} format={v => `${v}mo`} />
            <Gauge label="Morale" value={kpis.morale} max={100} color="#8B5CF6" icon={<TrendingUp size={9} />} format={v => `${v}%`} />
            <Gauge label="Trust" value={kpis.trust_score} max={100} color={ORANGE} icon={<Star size={9} />} format={v => `${v}%`} />
            <Gauge label="Risk" value={kpis.risk_score} max={100}
              color={kpis.risk_score > 60 ? RED : kpis.risk_score > 35 ? GOLD : GREEN}
              icon={<AlertTriangle size={9} />} format={v => `${v}%`} />
          </div>

          {/* Tab switcher */}
          <div className="flex border-b flex-shrink-0" style={{ borderColor: CREAM3 }}>
            {(["agents", "ecosystem"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-center transition-all"
                style={{
                  fontFamily: "Space Grotesk", fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
                  color: activeTab === tab ? ORANGE : INK3,
                  borderBottom: `2px solid ${activeTab === tab ? ORANGE : "transparent"}`,
                  background: activeTab === tab ? ORANGE + "08" : "transparent"
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "agents" ? (
              <div className="p-3 space-y-2">
                {result.agents.map(agent => {
                  const color = STATE_COLOR[agent.state] || INK3;
                  const isSelected = selectedAgent?.role === agent.role;
                  return (
                    <motion.button
                      key={agent.role}
                      onClick={() => setSelectedAgent(agent)}
                      whileHover={{ x: 2 }}
                      className="w-full text-left rounded-xl p-2.5 transition-all"
                      style={{
                        background: isSelected ? color + "10" : CREAM,
                        border: `1px solid ${isSelected ? color + "35" : CREAM3}`,
                        boxShadow: isSelected ? `0 2px 12px ${color}20` : "none",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{AVATAR_EMOJI[agent.avatar_type] || "🤖"}</span>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, color: isSelected ? color : INK }} className="truncate">
                            {agent.short_role}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="rounded px-1.5 py-px text-[7px] font-bold"
                              style={{ background: color + "15", color, fontFamily: "Space Grotesk" }}>
                              {agent.state.toUpperCase()}
                            </span>
                            <span className="rounded px-1 py-px text-[7px] font-bold"
                              style={{ background: THREAT_COLOR[agent.threat_level] + "15", color: THREAT_COLOR[agent.threat_level], fontFamily: "JetBrains Mono" }}>
                              {agent.threat_level.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: isSelected ? color : INK3 }}>
                          {agent.influence_score}
                        </span>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 pt-2 border-t"
                          style={{ borderColor: color + "20" }}
                        >
                          <p className="italic text-[9px] leading-relaxed" style={{ fontFamily: "Instrument Serif", color: INK2, fontSize: 11 }}>
                            "{agent.current_thought}"
                          </p>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Ecosystem radial tree */
              <div className="relative flex items-center justify-center" style={{ height: 340 }}>
                {/* Center node */}
                <motion.div
                  animate={{ boxShadow: [`0 0 12px ${ORANGE}40`, `0 0 24px ${ORANGE}60`, `0 0 12px ${ORANGE}40`] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="absolute z-20 rounded-full flex flex-col items-center justify-center text-center shadow-lg"
                  style={{
                    width: 64, height: 64,
                    background: ORANGE + "12",
                    border: `2px solid ${ORANGE}`,
                    left: "50%", top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="text-lg">🚀</span>
                  <span style={{ fontFamily: "Space Grotesk", fontSize: 6, fontWeight: 800, color: ORANGE, letterSpacing: 1.5 }}>YOU</span>
                </motion.div>

                {result.agents.map((agent, i) => (
                  <AgentNode
                    key={agent.role}
                    agent={agent}
                    selected={selectedAgent?.role === agent.role}
                    onClick={() => setSelectedAgent(agent)}
                    index={i}
                    total={result.agents.length}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Event Feed */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Feed header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: CREAM3, background: CREAM2 + "40" }}>
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ORANGE }} />
              <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: ORANGE, letterSpacing: 2 }}>
                SIMULATION FEED
              </span>
              <span className="rounded-full px-2.5 py-0.5" style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3, background: CREAM2, border: `1px solid ${CREAM3}` }}>
                {step}/{result.timeline.length} EVENTS
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isComplete && !isDecisionPending && (
                <button
                  onClick={() => setAutoPlay(p => !p)}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all text-[9px] font-bold"
                  style={{
                    fontFamily: "Space Grotesk", letterSpacing: 1.5,
                    background: autoPlay ? GREEN + "12" : CREAM2,
                    border: `1px solid ${autoPlay ? GREEN + "50" : CREAM3}`,
                    color: autoPlay ? GREEN : INK2,
                  }}
                >
                  {autoPlay ? <Pause size={10} /> : <Play size={10} />}
                  {autoPlay ? "PAUSE" : "AUTO-PLAY"}
                </button>
              )}
              <button
                onClick={initiateChaos}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all text-[9px] font-bold disabled:opacity-40 hover:bg-red-50"
                style={{ fontFamily: "Space Grotesk", letterSpacing: 1.5, background: RED + "08", border: `1px solid ${RED}25`, color: RED }}
              >
                <Flame size={10} /> CHAOS
              </button>
            </div>
          </div>

          {/* Event cards */}
          <div ref={feedRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <AnimatePresence>
              {revealed.map((ev, idx) => {
                const isLatest = idx === revealed.length - 1;
                const color = EVENT_COLOR[ev.type] || ORANGE;
                const isDecision = ev.type === "decision";

                return (
                  <motion.div
                    key={`${ev.month}-${idx}`}
                    initial={{ opacity: 0, y: 16, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl overflow-hidden shadow-sm"
                    style={{
                      background: isLatest ? EVENT_BG[ev.type] : CREAM,
                      borderTop: `1px solid ${isLatest ? EVENT_BORDER[ev.type] : CREAM3}`,
                      borderRight: `1px solid ${isLatest ? EVENT_BORDER[ev.type] : CREAM3}`,
                      borderBottom: `1px solid ${isLatest ? EVENT_BORDER[ev.type] : CREAM3}`,
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b"
                      style={{ borderColor: isLatest ? EVENT_BORDER[ev.type] : CREAM3 }}>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 w-5 rounded"
                          style={{ background: color + "15", color, border: `1px solid ${color}25` }}>
                          {EVENT_ICON[ev.type]}
                        </span>
                        <span className="rounded px-2 py-0.5 text-[8px] font-bold tracking-widest"
                          style={{ background: color + "12", color, fontFamily: "Space Grotesk", border: `1px solid ${color}20` }}>
                          {ev.type.toUpperCase()}
                        </span>
                        {isLatest && (
                          <span className="flex items-center gap-1 text-[7px] font-bold" style={{ color: GREEN, fontFamily: "Space Grotesk", letterSpacing: 1 }}>
                            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                            LIVE
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color }}>
                        MONTH {String(ev.month).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-3.5">
                      <h3 style={{ fontFamily: "Instrument Serif", fontSize: 20, color: INK, lineHeight: 1.25 }}>
                        {ev.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ fontFamily: "Inter", fontSize: 13, color: INK2 }}>
                        {ev.description}
                      </p>

                      {ev.narrator_line && (
                        <div className="mt-3 rounded-xl px-3.5 py-2.5 flex items-start gap-2"
                          style={{ background: ORANGE + "08", border: `1px solid ${ORANGE}20` }}>
                          <Terminal size={10} className="mt-0.5 flex-shrink-0" style={{ color: ORANGE }} />
                          <p className="italic text-xs leading-relaxed"
                            style={{ fontFamily: "Instrument Serif", color: ORANGE, fontSize: 13, lineHeight: 1.55 }}>
                            "{ev.narrator_line}"
                          </p>
                        </div>
                      )}

                      {/* KPI pills */}
                      {ev.kpis && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {ev.kpis.users > 0 && <KpiPill label="Users" value={ev.kpis.users.toLocaleString()} color="#2563EB" />}
                          {ev.kpis.revenue_inr > 0 && <KpiPill label="Revenue" value={fmtINR(ev.kpis.revenue_inr)} color={GREEN} />}
                          {ev.kpis.runway_months > 0 && <KpiPill label="Runway" value={`${ev.kpis.runway_months}mo`} color={GOLD} />}
                          {ev.kpis.morale > 0 && <KpiPill label="Morale" value={`${ev.kpis.morale}%`} color="#8B5CF6" />}
                          {ev.kpis.risk_score > 0 && <KpiPill label="Risk" value={`${ev.kpis.risk_score}%`} color={ev.kpis.risk_score > 60 ? RED : GOLD} />}
                        </div>
                      )}

                      {/* Affected agents */}
                      {(ev.affected_agents?.length ?? 0) > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3 }}>AFFECTED:</span>
                          {ev.affected_agents.map((roleNameObj, roleIndex) => {
                            const roleName = typeof roleNameObj === 'string'
                              ? roleNameObj
                              : (roleNameObj && typeof roleNameObj === 'object' && ('role' in roleNameObj)
                                  ? (roleNameObj as any).role
                                  : String(roleNameObj || ''));
                            if (!roleName) return null;
                            const a = result.agents.find(ag => {
                              const aRole = (ag.role || '').toLowerCase();
                              const aShort = (ag.short_role || '').toLowerCase();
                              const searchRole = roleName.toLowerCase();
                              return aRole.includes(searchRole) || aShort.includes(searchRole);
                            });
                            if (!a) return null;
                            const c = STATE_COLOR[a.state] || INK3;
                            return (
                              <button
                                key={`${a.role}-${roleIndex}`}
                                onClick={() => setSelectedAgent(a)}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 transition-all hover:scale-105 shadow-sm"
                                style={{ background: c + "10", border: `1px solid ${c}25`, color: c, fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 600 }}
                              >
                                {AVATAR_EMOJI[a.avatar_type]} {a.short_role}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Boardroom for crisis */}
                      {(ev.type === "crisis" || ev.type === "attack") && isLatest && (
                        <button
                          onClick={() => openBoardroom(ev.title, ev.month)}
                          disabled={loading}
                          className="mt-3.5 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all hover:scale-[1.01] disabled:opacity-40"
                          style={{
                            background: ORANGE + "08",
                            border: `1px solid ${ORANGE}30`,
                            color: ORANGE, fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, letterSpacing: 1.5
                          }}
                        >
                          <MessageSquare size={13} /> OPEN EMERGENCY BOARDROOM
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Simulation complete */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 shadow-sm"
                style={{
                  background: "#FFF5EE",
                  borderTop: `1px solid ${ORANGE}25`,
                  borderRight: `1px solid ${ORANGE}25`,
                  borderBottom: `1px solid ${ORANGE}25`,
                  borderLeft: `4px solid ${ORANGE}`,
                }}
              >
                <div style={{ fontFamily: "Space Grotesk", fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: 2 }}>
                  ⚡ SIMULATION COMPLETE — 18 MONTHS NAVIGATED
                </div>
                <p className="mt-2 leading-relaxed" style={{ fontFamily: "Instrument Serif", color: INK2, fontSize: 14 }}>
                  {result.outcome.narrator_summary}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 shadow-sm" style={{ background: CREAM, border: `1px solid ${CREAM3}` }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3, letterSpacing: 1 }}>SURVIVAL PROB.</div>
                    <div style={{ fontFamily: "Instrument Serif", fontSize: 28, color: result.outcome.survival_probability > 50 ? GREEN : RED }}>
                      {result.outcome.survival_probability}%
                    </div>
                  </div>
                  <div className="rounded-xl p-3 shadow-sm" style={{ background: CREAM, border: `1px solid ${CREAM3}` }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3, letterSpacing: 1 }}>FINAL REVENUE</div>
                    <div style={{ fontFamily: "Instrument Serif", fontSize: 24, color: GREEN }}>
                      {fmtINR(result.outcome.final_revenue_inr)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl p-3.5 shadow-sm" style={{ background: CREAM, border: `1px solid ${CREAM3}` }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3, letterSpacing: 1 }}>KEY LESSON</div>
                  <p className="mt-1.5" style={{ fontFamily: "Inter", color: INK, fontSize: 12, lineHeight: 1.55 }}>
                    {result.outcome.key_lesson}
                  </p>
                </div>
                <button
                  onClick={() => setShowFutureFounder(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-xs tracking-wider transition-all hover:opacity-90 shadow-md"
                  style={{ background: INK, color: CREAM, fontFamily: "Space Grotesk", letterSpacing: 2 }}
                >
                  💬 TALK TO YOUR FUTURE SELF
                </button>
              </motion.div>
            )}
            <div style={{ height: 16 }} />
          </div>
        </div>

        {/* RIGHT: Agent Inspector + Decision Engine */}
        <div className="flex-shrink-0 flex flex-col border-l overflow-hidden"
          style={{ width: 295, borderColor: CREAM3 }}>

          {/* Agent inspector */}
          <AnimatePresence mode="wait">
            {selectedAgent && (
              <motion.div
                key={selectedAgent.role}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="border-b flex-shrink-0 p-4"
                style={{ borderColor: CREAM3 }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Eye size={10} style={{ color: ORANGE }} />
                  <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: ORANGE, letterSpacing: 2 }}>
                    AGENT INSPECTOR
                  </span>
                </div>

                <div className="rounded-xl p-3 shadow-sm" style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{AVATAR_EMOJI[selectedAgent.avatar_type] || "🤖"}</span>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 700, color: INK }} className="truncate">
                        {selectedAgent.short_role}
                      </div>
                      <div style={{ fontFamily: "Inter", fontSize: 9, color: INK3, marginTop: 2 }} className="truncate">
                        {selectedAgent.role}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="rounded px-1.5 py-px text-[7px] font-bold"
                          style={{ background: STATE_COLOR[selectedAgent.state] + "15", color: STATE_COLOR[selectedAgent.state], fontFamily: "Space Grotesk" }}>
                          {selectedAgent.state.toUpperCase()}
                        </span>
                        <span className="rounded px-1.5 py-px text-[7px] font-bold"
                          style={{ background: THREAT_COLOR[selectedAgent.threat_level] + "15", color: THREAT_COLOR[selectedAgent.threat_level], fontFamily: "JetBrains Mono" }}>
                          THREAT: {selectedAgent.threat_level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-2">
                  <InspectorRow label="Motivation" value={selectedAgent.motivation} />
                  <InspectorRow label="Primary Fear" value={selectedAgent.fear} />
                  <div className="rounded-xl px-3 py-2 flex items-center justify-between shadow-sm"
                    style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3 }}>INFLUENCE SCORE</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: CREAM3 }}>
                        <div className="h-full rounded-full" style={{ width: `${selectedAgent.influence_score}%`, background: ORANGE }} />
                      </div>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: ORANGE }}>
                        {selectedAgent.influence_score}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 relative shadow-sm" style={{ background: ORANGE + "07", border: `1px solid ${ORANGE}20` }}>
                    <div className="absolute -top-2.5 left-3 rounded px-1.5 py-px text-[7px] font-bold"
                      style={{ background: ORANGE, color: "white", fontFamily: "Space Grotesk", letterSpacing: 0.5 }}>
                      THINKING NOW
                    </div>
                    <p className="italic mt-1 leading-relaxed"
                      style={{ fontFamily: "Instrument Serif", color: INK, fontSize: 12, lineHeight: 1.55 }}>
                      "{selectedAgent.current_thought}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decision Engine */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3.5 border-b flex items-center gap-1.5 flex-shrink-0" style={{ borderColor: CREAM3 }}>
              <Terminal size={10} style={{ color: GOLD }} />
              <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>
                DECISION ENGINE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isDecisionPending && currentEvent?.decision ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Pending alert */}
                  <div className="flex items-center gap-2 rounded-xl p-3"
                    style={{ background: GOLD + "10", border: `1px solid ${GOLD}30` }}>
                    <Activity size={12} className="animate-pulse flex-shrink-0" style={{ color: GOLD }} />
                    <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
                      DECISION REQUIRED
                    </span>
                  </div>

                  <h4 style={{ fontFamily: "Instrument Serif", fontSize: 15, color: INK, lineHeight: 1.4 }}>
                    {currentEvent.decision.prompt}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentEvent.decision.options.map((opt, i) => {
                      const riskColor = opt.risk_level === "high" ? RED : opt.risk_level === "medium" ? GOLD : GREEN;
                      return (
                        <motion.button
                          key={opt.id || opt.label || i}
                          onClick={() => handleDecide(currentEvent.decision!.prompt, opt.label)}
                          disabled={loading}
                          whileHover={{ scale: 1.01, x: 3 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full text-left rounded-xl p-3.5 transition-all disabled:opacity-40 group shadow-sm"
                          style={{ background: CREAM, border: `1px solid ${CREAM3}` }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div style={{ fontFamily: "Space Grotesk", fontSize: 11, fontWeight: 700, color: INK, lineHeight: 1.3 }}>
                                {opt.label}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="rounded-full px-2 py-px text-[7px] font-bold"
                                  style={{ background: riskColor + "12", color: riskColor, border: `1px solid ${riskColor}25`, fontFamily: "Space Grotesk" }}>
                                  {opt.risk_level.toUpperCase()} RISK
                                </span>
                                <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3 }}>
                                  {opt.probability_of_success}% confidence
                                </span>
                              </div>
                            </div>
                            <ArrowRight size={14} className="mt-1 flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
                              style={{ color: ORANGE }} />
                          </div>
                          {(opt.pros?.length || opt.cons?.length) && (
                            <div className="mt-2.5 pt-2.5 border-t grid grid-cols-2 gap-2"
                              style={{ borderColor: CREAM3 }}>
                              <div className="space-y-0.5">
                                {(opt.pros || []).slice(0, 2).map((p, i) => (
                                  <div key={i} style={{ fontFamily: "Inter", fontSize: 8, color: GREEN, lineHeight: 1.4 }}>+ {p}</div>
                                ))}
                              </div>
                              <div className="space-y-0.5">
                                {(opt.cons || []).slice(0, 2).map((c, i) => (
                                  <div key={i} style={{ fontFamily: "Inter", fontSize: 8, color: RED, lineHeight: 1.4 }}>- {c}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Custom strategy */}
                  <form onSubmit={handleCustomDecide} className="space-y-2 pt-2 border-t" style={{ borderColor: CREAM3 }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3, letterSpacing: 0.8 }}>
                      OR WRITE YOUR OWN STRATEGY:
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={customText}
                        onChange={e => setCustomText(e.target.value)}
                        disabled={loading || executingCustom}
                        placeholder="e.g. Pivot to enterprise, raise prices..."
                        className="w-full text-xs rounded-xl pl-3 pr-11 py-2.5 outline-none transition-all"
                        style={{
                          background: CREAM,
                          border: `1px solid ${CREAM3}`,
                          color: INK,
                          fontFamily: "Inter",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = ORANGE + "60"}
                        onBlur={e => e.currentTarget.style.borderColor = CREAM3}
                      />
                      <button
                        type="submit"
                        disabled={!customText.trim() || loading || executingCustom}
                        className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: INK, color: CREAM }}
                      >
                        {executingCustom ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : isComplete ? (
                <div className="space-y-3">
                  <div className="rounded-xl p-3 text-center shadow-sm"
                    style={{ background: GREEN + "10", border: `1px solid ${GREEN}25` }}>
                    <div style={{ fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: 1.5 }}>
                      SIMULATION COMPLETE
                    </div>
                  </div>
                  <MetaRow label="Verdict" value={result.outcome.verdict} />
                  <MetaRow label="Best Decision" value={result.outcome.best_decision} color={GREEN} />
                  <MetaRow label="Biggest Mistake" value={result.outcome.biggest_mistake} color={RED} />
                  <button
                    onClick={() => setShowFutureFounder(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-xs tracking-wider transition-all hover:opacity-90 shadow-md"
                    style={{ background: INK, color: CREAM, fontFamily: "Space Grotesk", letterSpacing: 2 }}
                  >
                    💬 TALK TO FUTURE SELF
                  </button>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 size={20} className="animate-spin" style={{ color: ORANGE }} />
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: INK3, letterSpacing: 1 }}>
                    SIMULATING...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="text-3xl opacity-60">⏳</div>
                  <div style={{ fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 600, color: INK3, letterSpacing: 1.5 }}>
                    AWAITING YOUR COMMAND
                  </div>
                  <p style={{ fontFamily: "Inter", fontSize: 10, color: INK3, lineHeight: 1.6, maxWidth: 200 }}>
                    Press "SIMULATE NEXT MONTH" to reveal what happens.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM COMMAND BAR ───────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t"
        style={{ borderColor: CREAM3, background: CREAM2 }}
      >
        {/* Timeline dot progress */}
        <div className="hidden md:flex items-center gap-0.5 overflow-hidden max-w-xs">
          {result.timeline.map((ev, i) => {
            const isRevealed = i < step;
            const isActive = i === step - 1;
            const c = EVENT_COLOR[ev.type] || ORANGE;
            return (
              <div key={i} className="flex items-center gap-0.5">
                <motion.button
                  onClick={() => { if (i < step) setStep(i + 1); }}
                  whileHover={{ scale: 1.5 }}
                  title={`Month ${ev.month}: ${ev.title}`}
                  style={{
                    width: isActive ? 10 : 5,
                    height: isActive ? 10 : 5,
                    borderRadius: "50%",
                    background: isRevealed ? c : CREAM3,
                    boxShadow: isActive ? `0 0 6px ${c}80` : "none",
                    flexShrink: 0,
                    transition: "all 0.3s",
                  }}
                />
                {i < result.timeline.length - 1 && (
                  <div style={{ width: 10, height: 1, background: isRevealed ? c + "60" : CREAM3, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Center: current event summary */}
        <div className="hidden lg:flex items-center gap-2 mx-4 overflow-hidden">
          {currentEvent && (
            <>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: INK3 }}>NOW:</span>
              <span style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 600, color: INK2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentEvent.title}
              </span>
            </>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {isComplete && (
            <button
              onClick={() => setShowFutureFounder(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-bold text-[9px] tracking-wider transition-all hover:opacity-80 shadow-sm"
              style={{ background: ORANGE + "12", border: `1px solid ${ORANGE}35`, color: ORANGE, fontFamily: "Space Grotesk", letterSpacing: 1.5 }}
            >
              💬 FUTURE SELF
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={loading || !hasNext || isDecisionPending || isComplete}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-[10px] tracking-wider transition-all hover:opacity-90 disabled:opacity-35 shadow-sm"
            style={{
              background: isDecisionPending ? GOLD + "15"
                : isComplete ? GREEN + "15"
                  : INK,
              color: isDecisionPending ? GOLD : isComplete ? GREEN : CREAM,
              border: isDecisionPending ? `1px solid ${GOLD}40` : isComplete ? `1px solid ${GREEN}40` : "none",
              fontFamily: "Space Grotesk", letterSpacing: 2,
            }}
          >
            {loading ? (
              <><Loader2 size={12} className="animate-spin" /> PROCESSING...</>
            ) : isDecisionPending ? (
              <><Lock size={11} /> CHOOSE A DECISION</>
            ) : isComplete ? (
              <><Star size={11} /> COMPLETE</>
            ) : (
              <><ChevronRight size={12} /> SIMULATE NEXT MONTH</>
            )}
          </button>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        {boardroomSession && (
          <Boardroom
            session={boardroomSession}
            agents={result.agents}
            open={showBoardroom}
            onClose={() => setShowBoardroom(false)}
            onDecide={async (prompt, choice) => { await handleDecide(prompt, choice); }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <FutureFounder
          open={showFutureFounder}
          onClose={() => setShowFutureFounder(false)}
          sessionId={sessionId}
          idea={currentIdea}
          simResult={result}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ChaosMode
          onInitiate={initiateChaos}
          chaosEvent={chaosEvent}
          open={showChaos}
          onClose={(absorb) => { if (absorb) absorbChaos(); else setShowChaos(false); }}
          loading={loading}
          visible={true}
          hideTrigger={true}
        />
      </Suspense>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function KpiPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm"
      style={{ background: color + "10", border: `1px solid ${color}20`, fontFamily: "JetBrains Mono", fontSize: 8 }}>
      <span style={{ color: color + "80" }}>{label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </span>
  );
}

function InspectorRow({ label, value, color = INK2 }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl px-3 py-2 shadow-sm" style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 7, color: INK3, letterSpacing: 0.8, marginBottom: 3 }}>
        {label.toUpperCase()}
      </div>
      <p style={{ fontFamily: "Inter", fontSize: 10, color, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function MetaRow({ label, value, color = INK2 }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-3 shadow-sm" style={{ background: CREAM2, border: `1px solid ${CREAM3}` }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 7, color: INK3, letterSpacing: 0.8 }}>{label.toUpperCase()}</div>
      <p className="mt-1" style={{ fontFamily: "Inter", color, fontSize: 11, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}
