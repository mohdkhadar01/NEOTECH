import { motion, AnimatePresence } from "framer-motion";
import { useState, lazy, Suspense } from "react";
import { Radar, Loader2 } from "lucide-react";
import SectionHeader from "./SectionHeader";
import type { useSimulation } from "@/hooks/useSimulation";

const AvatarSystem3D = lazy(() => import("./AvatarSystem3D"));

const VECTORS = [
  "An AI-powered automated code reviewer that suggests refactors in real time",
  "A farm-to-table organic grocery delivery app using electric cargo bikes",
  "A privacy-first chat and collaboration tool for decentralized remote teams",
  "A smart wearable device that helps developers monitor focus states and prevent burnout",
];

export default function MarketingLab({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const [idea, setIdea] = useState("");
  const [activeCompIdx, setActiveCompIdx] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [localMarketingResult, setLocalMarketingResult] = useState<any>(null);

  const { loading, analyzeMarketing, avatarText, avatarEmotion } = sim;

  const analyze = async () => {
    if (!idea.trim() || loading || isScraping) return;
    setActiveCompIdx(0);
    setLoadingLogs([]);
    setLocalMarketingResult(null);
    setIsScraping(true);

    const logs = [
      "> Establishing secure connection to web search index...",
      "[01/05] Querying Tavily AI agent pipeline for competitors...",
      `[02/05] Scraping live Indian search results for: "${idea.slice(0, 45)}..."`,
      "[03/05] Data ingested: Extracting pricing tables, traction metrics, and positioning moats...",
      "[04/05] Performing game-theoretic multi-agent strategic vulnerability audits...",
      "[05/05] Synthesizing AI-recommended counter-measures & entry vectors...",
      "> Analysis compiled. Syncing competitive intelligence radar matrix..."
    ];

    // Trigger backend fetch concurrently
    let backendResult: any = null;
    const fetchPromise = analyzeMarketing(idea).then(res => {
      backendResult = res;
    });

    // Run progressive terminal logs
    for (let i = 0; i < logs.length; i++) {
      setLoadingLogs(prev => [...prev, logs[i]]);
      await new Promise(r => setTimeout(r, 900));
    }

    // Wait for the backend if it took longer than 6.3 seconds
    if (!backendResult) {
      setLoadingLogs(prev => [...prev, "[!] Finalizing LLM synthesis report..."]);
      await fetchPromise;
    }

    setLocalMarketingResult(backendResult);
    setIsScraping(false);
  };

  const showIdle = !isScraping && !localMarketingResult;
  const showLoading = isScraping;
  const showDone = !isScraping && !!localMarketingResult;

  return (
    <section id="marketing" className="relative py-28" style={{ background: "#F4EFE5" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          index="05 / MARKETING LAB"
          title="Market & competitor radar."
          subtitle="Input your startup idea. The matrix maps the top 3 competitors, their strategies and weaknesses, and your optimal opening."
        />

        <div className="mt-14 grid lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT: Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-7 bg-white shadow-paper-lg flex flex-col"
            style={{ border: "1px solid #E5DDCB" }}
          >
            <div className="flex items-center justify-between" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#E8600A", letterSpacing: "1.2px" }}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8600A] animate-pulse-dot" />
                idea_terminal
              </span>
              <span className="text-[#A8A096]">// 01_input</span>
            </div>

            {/* Avatar in terminal header */}
            {localMarketingResult && (
              <div className="mt-3 flex justify-center">
                <Suspense fallback={null}>
                  <AvatarSystem3D text={avatarText} emotion={avatarEmotion} size={140} showSubtitle={false} autoSpeak={false} />
                </Suspense>
              </div>
            )}

            <div className="mt-4 text-[#A8A096]" style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "1px" }}>
              &gt; define startup protocol
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              placeholder="e.g. An AI copilot for D2C founders that auto-generates ad creatives\u2026"
              className="mt-2 w-full bg-transparent outline-none resize-none text-[#1A1714] placeholder:text-[#A8A096]"
              style={{ fontFamily: "Instrument Serif", fontSize: 20, lineHeight: 1.35 }}
            />

            <div className="mt-6 pt-5 border-t border-[#E5DDCB]">
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1px" }}>quick.start.vectors</span>
              <div className="mt-3 flex flex-col gap-2">
                {VECTORS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setIdea(v)}
                    className="text-left rounded-md px-3 py-2 transition-all duration-200 hover:bg-[#FFF1E5] hover:text-[#E8600A]"
                    style={{ background: "#FAF7F2", border: "1px solid #E5DDCB", color: "#5A5247", fontFamily: "Inter", fontSize: 13 }}
                  >
                    <span className="text-[#E8600A] mr-2">{'\u203A'}</span>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading || !idea.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-md h-12 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#E8600A", color: "#FAF7F2",
                fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 12, letterSpacing: "2px",
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
              {loading ? "SCANNING HORIZON\u2026" : "ANALYZE COMPETITORS"}
            </button>
          </motion.div>

          {/* RIGHT: Radar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl p-7 bg-white shadow-paper-lg overflow-hidden"
            style={{ border: "1px solid #E5DDCB", minHeight: 520 }}
          >
            {/* Radar sweep */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 opacity-30">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="95" fill="none" stroke="#E8600A" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="#E8600A" strokeWidth="0.5" />
                <circle cx="100" cy="100" r="35" fill="none" stroke="#E8600A" strokeWidth="0.5" />
                <motion.line
                  x1="100" y1="100" x2="100" y2="5"
                  stroke="#E8600A" strokeWidth="1.2"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  style={{ transformOrigin: "100px 100px" }}
                />
              </svg>
            </div>

            <div className="relative flex items-center justify-between" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#E8600A", letterSpacing: "1.2px" }}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8600A] animate-pulse-dot" />
                radar_output
              </span>
              <span className="text-[#A8A096]">// 02_analysis</span>
            </div>

            <AnimatePresence mode="wait">
              {showIdle && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-16 text-center">
                  <div style={{ fontFamily: "Instrument Serif", fontSize: 32, color: "#1A1714", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    Awaiting analysis<span className="text-[#E8600A]">.</span>
                  </div>
                  <p className="mt-3 mx-auto max-w-sm text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13.5, lineHeight: 1.55 }}>
                    Input your startup description to initialize the competitor positioning model and strategic opening map.
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {["competitors", "strategies", "your.path"].map((l) => (
                      <div key={l} className="rounded-md py-4 text-center" style={{ background: "#FAF7F2", border: "1px solid #E5DDCB" }}>
                        <div className="text-[#E8600A]" style={{ fontFamily: "Instrument Serif", fontSize: 22 }}>&mdash;</div>
                        <div className="mt-1 text-[#A8A096]" style={{ fontFamily: "JetBrains Mono", fontSize: 9, letterSpacing: "1px" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {showLoading && (
                <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative mt-6 rounded-lg p-5 bg-[#1A1714] text-[#EFF6F1] font-mono text-[11px] leading-relaxed shadow-lg border border-[#E5DDCB]/20">
                  <div className="flex items-center justify-between border-b border-[#E5DDCB]/10 pb-2 mb-3">
                    <span className="text-[#E8600A] font-bold">HORIZON_SCRAPER_TERMINAL v2.36</span>
                    <span className="animate-pulse text-[#2D7A4F]">● SCRAPING_LIVE</span>
                  </div>
                  <div className="space-y-1.5 overflow-hidden">
                    {loadingLogs.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className={log.startsWith(">") ? "text-[#E8600A]" : log.startsWith("[!") ? "text-[#C0392B]" : "text-[#D3C9B6]"}
                      >
                        {log}
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E8600A] animate-ping" />
                      <span className="text-[#A8A096]">executing background procedures...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {showDone && localMarketingResult && (
                <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mt-5">
                  
                  {/* Competitor selection tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(localMarketingResult.competitors || []).slice(0, 3).map((comp: any, idx: number) => {
                      const isActive = idx === activeCompIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveCompIdx(idx)}
                          className="rounded px-4 py-2 border transition-all duration-150"
                          style={{
                            background: isActive ? "#1A1714" : "transparent",
                            borderColor: isActive ? "#1A1714" : "#E5DDCB",
                            color: isActive ? "#FAF7F2" : "#5A5247",
                            fontFamily: "Space Grotesk",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "1px",
                          }}
                        >
                          0{idx + 1} / {comp.name.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Competitor profile card */}
                  {localMarketingResult.competitors?.[activeCompIdx] && (() => {
                    const activeComp = localMarketingResult.competitors[activeCompIdx];
                    const threatLabel = (activeComp.threat_level || 'low').toUpperCase();
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCompIdx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Profile Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-[#E5DDCB]">
                            <div className="flex items-center gap-3">
                              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1px" }}>
                                DETAILED COMPETITOR SCAN
                              </span>
                              <h3 style={{ fontFamily: "Instrument Serif", fontSize: 28, color: "#1A1714", fontWeight: 600 }}>
                                {activeComp.name}
                              </h3>
                            </div>
                            <span
                              className="rounded-full px-2.5 py-0.5"
                              style={{
                                background: threatLabel === "HIGH" ? "#FBE5E0" : threatLabel === "MED" || threatLabel === "MEDIUM" ? "#FFF1E5" : "#EFF6F1",
                                color: threatLabel === "HIGH" ? "#C0392B" : threatLabel === "MED" || threatLabel === "MEDIUM" ? "#E8600A" : "#2D7A4F",
                                fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 600, letterSpacing: "1px",
                              }}
                            >
                              {threatLabel} THREAT
                            </span>
                          </div>

                          {/* Leader Reason Callout */}
                          <div className="rounded-xl p-4 bg-white shadow-paper border-l-4 border-[#1A1714]">
                            <div style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: "#1A1714", letterSpacing: "1px", textTransform: "uppercase" }}>
                              Why they are leading
                            </div>
                            <p className="mt-1.5 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 1.5 }}>
                              {activeComp.reason_leading || `${activeComp.name} has captured significant market share in this segment.`}
                            </p>
                          </div>

                          {/* Two-column layout: strategies vs weaknesses */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Best Strategies */}
                            <div className="rounded-xl p-4 bg-white shadow-paper" style={{ border: "1px solid #E5DDCB" }}>
                              <div style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: "#2D7A4F", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                Best Strategies Applied
                              </div>
                              <ul className="mt-3 space-y-2">
                                {(activeComp.best_strategies || [activeComp.strategy]).filter(Boolean).map((s: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 items-start text-xs text-[#5A5247] font-medium" style={{ fontFamily: "Inter", lineHeight: 1.45 }}>
                                    <span className="text-[#2D7A4F] font-bold">✓</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Critical Weakness */}
                            <div className="rounded-xl p-4 bg-white shadow-paper" style={{ border: "1px solid #E5DDCB" }}>
                              <div style={{ fontFamily: "Space Grotesk", fontSize: 9, fontWeight: 700, color: "#C0392B", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                Identified Weakness
                              </div>
                              <p className="mt-3 text-xs text-[#5A5247]" style={{ fontFamily: "Inter", lineHeight: 1.45 }}>
                                {activeComp.weakness}
                              </p>
                            </div>
                          </div>

                          {/* AI Suggestions Wedge */}
                          <div className="rounded-xl p-5" style={{ background: "rgba(232,96,10,0.05)", border: "1px solid rgba(232,96,10,0.22)" }}>
                            <div style={{ fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 700, color: "#E8600A", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                              ★ AI Recommended Counter-Move
                            </div>
                            <ul className="mt-3 space-y-2">
                              {(activeComp.ai_suggestion || []).map((s: string, idx: number) => (
                                <li key={idx} className="flex gap-2.5 items-start text-[#1A1714]" style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 1.5 }}>
                                  <span className="text-[#E8600A] font-bold">🎯</span>
                                  <span className="font-medium">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()}

                  {/* Startup GTM Wedge */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-5 mt-6"
                    style={{ background: "#FAF7F2", border: "1px solid #E5DDCB" }}
                  >
                    <div style={{ fontFamily: "Space Grotesk", fontSize: 10, color: "#E8600A", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>
                      // SUGGESTED MOAT POSITION
                    </div>
                    {localMarketingResult.positioning && (
                      <div className="mt-2" style={{ fontFamily: "Instrument Serif", fontSize: 24, fontStyle: "italic", color: "#1A1714", lineHeight: 1.3 }}>
                        &ldquo;{localMarketingResult.positioning}&rdquo;
                      </div>
                    )}
                    <p className="mt-3 text-xs text-[#5A5247]" style={{ fontFamily: "Inter", lineHeight: 1.55 }}>
                      <strong>Optimal Opening Wedge:</strong> {localMarketingResult.optimal_opening}
                    </p>
                    <div style={{ borderTop: "1px dashed #E5DDCB", marginTop: 14, paddingTop: 12 }}>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1px" }}>suggested_gtm_blueprint</span>
                      <ul className="mt-2.5 space-y-2 text-[#1A1714]" style={{ fontFamily: "Inter", fontSize: 12.5, lineHeight: 1.5 }}>
                        {(localMarketingResult.go_to_market || []).map((p: string, i: number) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="text-[#E8600A] font-bold">0{i + 1}.</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
