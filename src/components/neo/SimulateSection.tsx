import { motion, AnimatePresence } from "framer-motion";
import { useState, lazy, Suspense, useEffect } from "react";
import { Zap, Loader2, MessageSquare } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { SimMode, SimEvent } from "@/lib/ai/types";
import type { useSimulation } from "@/hooks/useSimulation";

const AvatarSystem3D = lazy(() => import("./AvatarSystem3D"));
const Boardroom = lazy(() => import("./Boardroom"));
const ChaosMode = lazy(() => import("./ChaosMode"));
const FutureFounder = lazy(() => import("./FutureFounder"));
const AutopilotCockpit = lazy(() => import("./AutopilotCockpit"));
const FounderCockpit = lazy(() => import("./FounderCockpit"));

const CHIPS = [
  { l: "\u{1F355} Food Delivery", v: "Cloud kitchen serving healthy bowls to Bangalore office workers..." },
  { l: "\u{1F3E5} HealthTech", v: "AI nutrition app in Hyderabad targeting college students..." },
  { l: "\u{1F4DA} EdTech", v: "Live coding bootcamp for Tier-2 city students with placement guarantee..." },
  { l: "\u{1F4B0} FinTech", v: "Micro-investment app for Indian gig workers with auto-SIP..." },
  { l: "\u{1F697} Mobility", v: "EV bike rental for last-mile delivery riders in Mumbai..." },
  { l: "\u{1F916} AI SaaS", v: "AI copilot for D2C brands to generate ads and product photos..." },
];

const MODES: { label: string; value: SimMode }[] = [
  { label: "AUTOPILOT", value: "autopilot" },
  { label: "FOUNDER", value: "founder" },
];

function Counter({ to, prefix = "" }: { to: number; prefix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{prefix}{n.toLocaleString()}</span>;
}

function ProgressRing({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} stroke="#F4EFE5" strokeWidth="6" fill="none" />
      <motion.circle
        cx="60" cy="60" r={r}
        stroke="#E8600A" strokeWidth="6" fill="none" strokeLinecap="round"
        transform="rotate(-90 60 60)"
        initial={{ strokeDasharray: c, strokeDashoffset: c }}
        animate={{ strokeDashoffset: off }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <text x="60" y="68" textAnchor="middle" fill="#1A1714" style={{ fontFamily: "Instrument Serif", fontSize: 28 }}>
        {value}%
      </text>
    </svg>
  );
}

function formatINR(value: number): string {
  if (value >= 10000000) return `\u20B9${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `\u20B9${(value / 100000).toFixed(1)}L`;
  return `\u20B9${value.toLocaleString()}`;
}

function eventColor(type: string): string {
  switch (type) {
    case "milestone": return "#2D7A4F";
    case "crisis": case "attack": case "chaos": return "#C0392B";
    case "decision": return "#B8860B";
    case "outcome": return "#E8600A";
    default: return "#E8600A";
  }
}

function eventCardStyles(type: string) {
  switch (type) {
    case "milestone": return { background: "#F4F9F6", border: "1px solid rgba(45,122,79,0.12)", borderLeft: "4px solid #2D7A4F" };
    case "crisis": case "attack": case "chaos": return { background: "#FDF3F2", border: "1px solid rgba(192,57,43,0.12)", borderLeft: "4px solid #C0392B" };
    case "decision": return { background: "#FCFAF2", border: "1px solid rgba(184,134,11,0.12)", borderLeft: "4px solid #B8860B" };
    case "outcome": return { background: "#FFF6F0", border: "1px solid rgba(232,96,10,0.12)", borderLeft: "4px solid #E8600A" };
    default: return { background: "#FFFFFF", border: "1px solid #E5DDCB", borderLeft: "4px solid #E8600A" };
  }
}

export default function SimulateSection({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState<SimMode>("founder");
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showAutopilot, setShowAutopilot] = useState(false);
  const [showFounderCockpit, setShowFounderCockpit] = useState(false);

  const {
    loading, loadingMsg, result, error, avatarText, avatarEmotion,
    simulate, makeDecision, speakEvent, openBoardroom, initiateChaos,
    showBoardroom, showChaos, showFutureFounder,
    setShowBoardroom, setShowChaos, setShowFutureFounder,
    boardroomSession, chaosEvent, sessionId, currentIdea, absorbChaos
  } = sim;

  useEffect(() => {
    if (result && result.timeline.length > 0) {
      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 150);
    }
  }, [result?.timeline?.length]);

  const run = () => {
    if (!idea.trim() || loading) return;
    if (mode === "autopilot") {
      setShowAutopilot(true);
    } else {
      simulate(idea, mode).then((res) => {
        if (res) {
          setShowFounderCockpit(true);
        }
      });
    }
  };

  return (
    <section id="simulate" className="relative py-28" style={{ background: "#FAF7F2" }}>
      <div className="absolute inset-0 paper-grain opacity-50" />
      <div className="relative mx-auto max-w-5xl px-6">
        {showAutopilot && (
          <Suspense fallback={
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F2]">
              <Loader2 className="animate-spin text-[#E8600A]" size={32} />
              <span className="mt-3 text-xs text-[#A8A096] font-mono">LOADING COCKPIT PROTOCOLS...</span>
            </div>
          }>
            <AutopilotCockpit idea={idea} onClose={() => setShowAutopilot(false)} />
          </Suspense>
        )}

        {showFounderCockpit && (
          <Suspense fallback={
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F2]">
              <Loader2 className="animate-spin text-[#E8600A]" size={32} />
              <span className="mt-3 text-xs text-[#A8A096] font-mono">LOADING FOUNDER CONSOLE...</span>
            </div>
          }>
            <FounderCockpit idea={idea} onClose={() => setShowFounderCockpit(false)} sim={sim} />
          </Suspense>
        )}

        <SectionHeader index="05 / SIMULATE" title="Run a simulation" withCursor subtitle="Type any startup idea. Watch the world spawn." />

            <div className="mt-14 grid lg:grid-cols-[1fr_280px] gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 bg-white shadow-paper-lg"
            style={{ border: "1px solid #E5DDCB" }}
          >
            <div className="flex items-center gap-2" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#E8600A", letterSpacing: "1px" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8600A] animate-pulse-dot" />
              enter_your_startup_idea
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="e.g. AI nutrition app in Hyderabad targeting college students..."
              className="mt-3 w-full bg-transparent outline-none resize-none text-[#1A1714] placeholder:text-[#A8A096]"
              style={{ fontFamily: "Instrument Serif", fontSize: 22, lineHeight: 1.3 }}
            />

            <div className="mt-6 pt-5 border-t border-[#E5DDCB]">
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1px" }}>quick.picks</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <button
                    key={c.l}
                    onClick={() => setIdea(c.v)}
                    className="rounded-full px-3 py-1.5 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "#FAF7F2", border: "1px solid #E5DDCB", color: "#5A5247",
                      fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 500,
                    }}
                  >
                    {c.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E5DDCB]">
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1px" }}>simulation.mode</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className="rounded-md px-5 py-2 transition-all"
                    style={{
                      background: mode === m.value ? "#1A1714" : "transparent",
                      color: mode === m.value ? "#FAF7F2" : "#5A5247",
                      border: mode === m.value ? "1px solid #1A1714" : "1px solid #E5DDCB",
                      fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 11, letterSpacing: "1.5px",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={run}
              disabled={loading || !idea.trim()}
              className="mt-7 w-full flex items-center justify-center gap-2 rounded-md h-14 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed animate-soft-pulse"
              style={{
                background: "#E8600A", color: "#FAF7F2",
                fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 13, letterSpacing: "2px",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {loading ? "GENERATING WORLD\u2026" : "SIMULATE FUTURE"}
            </button>

            {error && (
              <div className="mt-3 rounded-md p-3 text-center" style={{ background: "#FBE5E0", border: "1px solid rgba(192,57,43,0.3)", color: "#C0392B", fontFamily: "JetBrains Mono", fontSize: 11 }}>
                {error}
              </div>
            )}
          </motion.div>

          {/* Avatar sidebar */}
          <div className="hidden lg:flex flex-col items-center pt-4">
            <Suspense fallback={<div style={{ width: 240, height: 240 }} />}>
              <AvatarSystem3D text={avatarText} emotion={avatarEmotion} size={240} autoSpeak={true} showSubtitle={true} />
            </Suspense>
            {loading && loadingMsg && (
              <div className="mt-3 text-center" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1px" }}>
                {loadingMsg}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-16"
              id="results"
            >
              {/* Startup info */}
              {result.startup_name && (
                <div className="mb-6 rounded-lg p-4" style={{ background: "#FFF1E5", border: "1px solid rgba(232,96,10,0.3)" }}>
                  <div style={{ fontFamily: "Instrument Serif", fontSize: 26, color: "#1A1714" }}>
                    {result.startup_name}<span className="text-[#E8600A]">.</span>
                  </div>
                  {result.tagline && (
                    <p className="mt-1" style={{ fontFamily: "Inter", fontSize: 13, color: "#5A5247" }}>{result.tagline}</p>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="relative pl-10">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-[#E5DDCB]" />
                <div className="space-y-5">
                  {result.timeline.map((ev: SimEvent, i: number) => (
                    <motion.div
                      key={`${ev.month}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.18 }}
                      className="relative"
                      onViewportEnter={() => speakEvent(ev)}
                    >
                      <span
                        className="absolute -left-[26px] top-3 h-3 w-3 rounded-full"
                        style={{ background: eventColor(ev.type), boxShadow: `0 0 0 4px #FAF7F2, 0 0 0 5px ${eventColor(ev.type)}33` }}
                      />
                      <div className="rounded-r-lg rounded-bl-lg p-5 shadow-paper" style={eventCardStyles(ev.type)}>
                        <div className="flex items-center justify-between">
                          <h4 style={{ fontFamily: "Instrument Serif", fontSize: 22, color: "#1A1714", letterSpacing: "-0.01em" }}>
                            {ev.title}
                          </h4>
                          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: eventColor(ev.type), letterSpacing: "1px" }}>
                            M{String(ev.month).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-1 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13.5, lineHeight: 1.55 }}>
                          {ev.description}
                        </p>
                        {ev.narrator_line && (
                          <p className="mt-2 italic text-[#E8600A]" style={{ fontFamily: "Instrument Serif", fontSize: 13 }}>
                            &ldquo;{ev.narrator_line}&rdquo;
                          </p>
                        )}
                        {ev.kpis && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {ev.kpis.users > 0 && <KpiPill label="Users" value={ev.kpis.users.toLocaleString()} />}
                            {ev.kpis.revenue_inr > 0 && <KpiPill label="Revenue" value={formatINR(ev.kpis.revenue_inr)} />}
                            {ev.kpis.runway_months > 0 && <KpiPill label="Runway" value={`${ev.kpis.runway_months}mo`} />}
                            {ev.kpis.morale > 0 && <KpiPill label="Morale" value={`${ev.kpis.morale}%`} />}
                            {ev.kpis.trust_score > 0 && <KpiPill label="Trust" value={`${ev.kpis.trust_score}%`} />}
                            {ev.kpis.investor_confidence > 0 && <KpiPill label="Investor" value={`${ev.kpis.investor_confidence}%`} />}
                          </div>
                        )}

                        {ev.affected_agents && ev.affected_agents.length > 0 && result.agents && (
                          <div className="mt-4 pt-3 border-t border-[#E5DDCB]/40 flex flex-wrap items-center gap-2">
                            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "0.5px" }}>AFFECTED STAKEHOLDERS:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ev.affected_agents.map((roleNameObj, index) => {
                                const roleName = typeof roleNameObj === 'string'
                                  ? roleNameObj
                                  : (roleNameObj && typeof roleNameObj === 'object' && ('role' in roleNameObj)
                                      ? (roleNameObj as any).role
                                      : String(roleNameObj || ''));
                                if (!roleName) return null;
                                const agent = result.agents.find(a => {
                                  const aRole = (a.role || '').toLowerCase();
                                  const aShort = (a.short_role || '').toLowerCase();
                                  const searchRole = roleName.toLowerCase();
                                  return (
                                    aRole === searchRole ||
                                    aShort === searchRole ||
                                    aRole.includes(searchRole) ||
                                    searchRole.includes(aShort)
                                  );
                                });
                                if (!agent) return null;
                                return (
                                  <div key={`${agent.role}-${index}`} className="relative group cursor-pointer">
                                    <span className="inline-flex items-center justify-center h-5 px-2.5 rounded bg-white text-[#1A1714] text-[9px] border border-[#E5DDCB] hover:border-[#E8600A] transition-colors" style={{ fontFamily: "Space Grotesk", fontWeight: 600 }}>
                                      {agent.short_role}
                                    </span>
                                    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-lg bg-[#1A1714] p-3 text-white text-[10px] shadow-xl leading-relaxed">
                                      <div className="font-semibold text-[#E8600A] mb-1" style={{ fontFamily: "Space Grotesk" }}>{agent.role}</div>
                                      <div className="opacity-70 mb-1">State: <span className="font-semibold text-white">{agent.state}</span></div>
                                      <div className="italic font-serif border-t border-white/10 pt-1 mt-1">&ldquo;{agent.current_thought}&rdquo;</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Decision buttons with pros/cons tooltip */}
                        {ev.decision && (
                          <div className="mt-4">
                            <div className="mb-2" style={{ fontFamily: "Space Grotesk", fontSize: 11, color: "#B8860B", fontWeight: 600 }}>
                              {ev.decision.prompt}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ev.decision.options.map((opt, i) => (
                                <div key={opt.id || opt.label || i} className="relative">
                                  <button
                                    onClick={() => makeDecision(ev.decision!.prompt, opt.label)}
                                    onMouseEnter={() => setHoveredOption(opt.id)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                    disabled={loading}
                                    className="rounded px-3 py-1.5 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                                    style={{
                                      background: opt.risk_level === 'high' ? '#C0392B' : opt.risk_level === 'medium' ? '#B8860B' : '#1A1714',
                                      color: "#FAF7F2", fontFamily: "Space Grotesk", fontSize: 10, letterSpacing: "1px", fontWeight: 600,
                                    }}
                                  >
                                    {opt.label}
                                    <span className="ml-1 opacity-60" style={{ fontSize: 8 }}>
                                      {opt.probability_of_success}%
                                    </span>
                                  </button>
                                  {hoveredOption === opt.id && (
                                    <div className="absolute z-20 bottom-full left-0 mb-2 w-56 rounded-lg p-3 bg-white shadow-lg" style={{ border: "1px solid #E5DDCB" }}>
                                      <div className="mb-1" style={{ fontFamily: "Space Grotesk", fontSize: 10, color: "#2D7A4F", fontWeight: 600 }}>PROS</div>
                                      {(opt.pros || []).map((p, pi) => (
                                        <div key={pi} style={{ fontFamily: "Inter", fontSize: 10, color: "#5A5247" }}>+ {p}</div>
                                      ))}
                                      <div className="mt-2 mb-1" style={{ fontFamily: "Space Grotesk", fontSize: 10, color: "#C0392B", fontWeight: 600 }}>CONS</div>
                                      {(opt.cons || []).map((c, ci) => (
                                        <div key={ci} style={{ fontFamily: "Inter", fontSize: 10, color: "#5A5247" }}>- {c}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Boardroom trigger for crisis/attack events */}
                        {(ev.type === 'crisis' || ev.type === 'attack') && (
                          <button
                            onClick={() => openBoardroom(ev.title, ev.month)}
                            disabled={loading}
                            className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                            style={{
                              background: "rgba(232,96,10,0.1)", border: "1px solid rgba(232,96,10,0.3)",
                              color: "#E8600A", fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 600, letterSpacing: "1px",
                            }}
                          >
                            <MessageSquare size={12} /> OPEN BOARDROOM
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Outcome metrics */}
              {result.outcome && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 grid sm:grid-cols-3 gap-5"
                  >
                    <div className="rounded-xl p-6 flex flex-col items-center bg-white shadow-paper">
                      <ProgressRing value={result.outcome.survival_probability} />
                      <div className="mt-3" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1.5px" }}>SURVIVAL</div>
                    </div>
                    <div className="rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-paper">
                      <div style={{ fontFamily: "Instrument Serif", fontSize: 40, color: "#1A1714", lineHeight: 1 }}>
                        {formatINR(result.outcome.final_revenue_inr)}
                      </div>
                      <div className="mt-3" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1.5px" }}>
                        FINAL REVENUE
                      </div>
                    </div>
                    <div className="rounded-xl p-6 flex flex-col items-center justify-center bg-white shadow-paper">
                      <div style={{ fontFamily: "Instrument Serif", fontSize: 40, color: "#E8600A", lineHeight: 1 }}>
                        <Counter to={result.outcome.final_users} />
                      </div>
                      <div className="mt-3" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1.5px" }}>ACTIVE USERS</div>
                    </div>
                  </motion.div>

                  {/* Verdict */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mt-6 rounded-lg p-5 text-center"
                    style={{
                      background: result.outcome.survival_probability > 50 ? "#EFF6F1" : "#FBE5E0",
                      border: `1px solid ${result.outcome.survival_probability > 50 ? "rgba(45,122,79,0.30)" : "rgba(192,57,43,0.30)"}`,
                    }}
                  >
                    <span style={{
                      fontFamily: "Space Grotesk",
                      color: result.outcome.survival_probability > 50 ? "#2D7A4F" : "#C0392B",
                      fontSize: 13, letterSpacing: "0.5px", fontWeight: 600,
                    }}>
                      {result.outcome.survival_probability > 50 ? "\u2713" : "\u2717"} {result.outcome.verdict}
                    </span>
                    {result.outcome.key_lesson && (
                      <p className="mt-2 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 12.5 }}>
                        {result.outcome.key_lesson}
                      </p>
                    )}
                    {result.outcome.best_decision && (
                      <p className="mt-1 text-[#2D7A4F]" style={{ fontFamily: "Inter", fontSize: 11 }}>
                        Best decision: {result.outcome.best_decision}
                      </p>
                    )}
                    {result.outcome.biggest_mistake && (
                      <p className="mt-1 text-[#C0392B]" style={{ fontFamily: "Inter", fontSize: 11 }}>
                        Biggest mistake: {result.outcome.biggest_mistake}
                      </p>
                    )}
                  </motion.div>

                  {/* Future Founder button */}
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowFutureFounder(true)}
                      className="flex items-center gap-2 rounded-full px-6 py-3 transition-all hover:-translate-y-0.5"
                      style={{
                        background: "#1A1714", color: "#FAF7F2",
                        fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 600, letterSpacing: "1.5px",
                      }}
                    >
                      TALK TO YOUR FUTURE SELF
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chaos Mode */}
      <Suspense fallback={null}>
        <ChaosMode
          onInitiate={initiateChaos}
          chaosEvent={chaosEvent}
          open={showChaos}
          onClose={(absorb) => { if (absorb) absorbChaos(); else setShowChaos(false); }}
          loading={loading}
          visible={!showFounderCockpit && !showAutopilot && !!result}
        />
      </Suspense>

      {/* Boardroom */}
      {boardroomSession && result && (
        <Suspense fallback={null}>
          <Boardroom
            session={boardroomSession}
            agents={result.agents}
            open={showBoardroom}
            onClose={() => setShowBoardroom(false)}
            onDecide={makeDecision}
          />
        </Suspense>
      )}

      {/* Future Founder */}
      <Suspense fallback={null}>
        <FutureFounder
          open={showFutureFounder}
          onClose={() => setShowFutureFounder(false)}
          sessionId={sessionId}
          idea={currentIdea}
          simResult={result}
        />
      </Suspense>
    </section>
  );
}

function KpiPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full px-2 py-0.5" style={{ background: "#FAF7F2", border: "1px solid #E5DDCB", fontFamily: "JetBrains Mono", fontSize: 9, color: "#5A5247", letterSpacing: "0.5px" }}>
      {label}: <span className="text-[#1A1714] font-semibold">{value}</span>
    </span>
  );
}
