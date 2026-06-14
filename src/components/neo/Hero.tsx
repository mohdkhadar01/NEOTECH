import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { ArrowUpRight, BrainCircuit } from "lucide-react";
import Counter from "./Counter";
import { ViewportCanvas } from "./ViewportCanvas";

const Brain3D = lazy(() => import("./Brain3D"));

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden pt-24 pb-16">
      {/* Background layers */}
      <div className="absolute inset-0 paper-grain opacity-60" />
      <div className="absolute inset-0 ruled opacity-50" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 40%, rgba(232,96,10,0.10), transparent 60%)",
        }}
      />

      {/* Editorial top meta strip */}
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between" style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1px" }}>
          <span>// VOL.01 · ISSUE 2026</span>
          <span className="hidden md:inline">DECISION SIMULATION ENGINE / EST. 2026</span>
          <span>EDITION — N°001</span>
        </div>
        <div className="mt-3 h-px w-full bg-[#E5DDCB]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mt-10 lg:mt-14">
        {/* Left: text */}
        <div className="flex flex-col gap-7">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5"
            style={{
              border: "1px solid rgba(232,96,10,0.30)",
              background: "#FFF1E5",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8600A] animate-pulse-dot" />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "1px", color: "#E8600A" }}>
              ai_decision_simulation_engine
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
            style={{
              fontFamily: "Instrument Serif",
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: "#1A1714",
            }}
          >
            <span style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontStyle: "italic", color: "#5A5247", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              Simulate your —
            </span>
            <span style={{ fontSize: "clamp(4.5rem, 12vw, 9.5rem)", whiteSpace: "nowrap" }}>NEO</span>
            <span
              style={{
                fontSize: "clamp(4.5rem, 12vw, 9.5rem)",
                whiteSpace: "nowrap",
                fontStyle: "italic",
                color: "#E8600A",
              }}
            >
              -verse<span className="text-[#E8600A]">.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-lg"
            style={{ fontFamily: "Inter", fontSize: 17, lineHeight: 1.55, color: "#5A5247" }}
          >
            Watch AI build your startup across <span className="text-[#1A1714] underline decoration-[#E8600A] decoration-2 underline-offset-4">simulated years</span>. Then step in — and try to beat it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex flex-wrap gap-3"
          >
            <a
              href="#simulate"
              className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5 shadow-accent-soft"
              style={{
                background: "#1A1714",
                color: "#FAF7F2",
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "1.5px",
              }}
            >
              AUTOPILOT MODE <ArrowUpRight size={14} />
            </a>
            <a
              href="#modes"
              className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "transparent",
                border: "1px solid #1A1714",
                color: "#1A1714",
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "1.5px",
              }}
            >
              <BrainCircuit size={14} /> FOUNDER MODE
            </a>
          </motion.div>

          {/* Stats strip — in flow, no overlap */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-y-5"
            style={{ borderTop: "1px solid #E5DDCB", paddingTop: 18 }}
          >
            {[
              { n: 90, suffix: "%", l: "STARTUPS FAIL" },
              { n: 20, prefix: "$", suffix: "B+", l: "MARKET SIZE" },
              { n: 4, l: "SIM MODES" },
              { n: 140, suffix: "+", l: "PARALLEL REALITIES" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span style={{ fontFamily: "Instrument Serif", fontSize: 32, color: "#1A1714", lineHeight: 1 }}>
                  <Counter to={s.n} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
                </span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1.5px", marginTop: 6 }}>
                  {s.l}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: 3D brain */}
        <div className="relative h-[420px] lg:h-[560px] hidden md:block">
          <ViewportCanvas className="absolute inset-0">
            <Suspense fallback={null}>
              <Brain3D className="w-full h-full" />
            </Suspense>
          </ViewportCanvas>
          {/* Editorial caption */}
          <div className="absolute bottom-2 right-2 max-w-[180px] text-right" style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "0.5px", lineHeight: 1.4 }}>
            FIG. 01 — agent topology<br />
            <span className="text-[#E8600A]">●</span> stakeholder node
          </div>
          {/* Corner crosshairs */}
          <span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-[#1A1714]" />
          <span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-[#1A1714]" />
          <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-[#1A1714]" />
          <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[#1A1714]" />
        </div>
      </div>

      {/* Fixed scroll indicator — right edge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="hidden lg:flex fixed right-6 bottom-8 z-10 flex-col items-center gap-3"
        style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "2px", writingMode: "vertical-rl" }}
      >
        <span>SCROLL — DEEP SCAN</span>
        <span className="h-10 w-px bg-[#E8600A] animate-float-y" />
      </motion.div>
    </section>
  );
}
