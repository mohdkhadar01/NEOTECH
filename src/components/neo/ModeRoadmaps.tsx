import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import SectionHeader from "./SectionHeader";

type Step = { n: string; title: string; desc: string };

const ROADMAPS: Record<string, { tag: string; blurb: string; steps: Step[] }> = {
  AUTOPILOT: {
    tag: "passive · observe",
    blurb: "Click once. The AI runs your startup for five simulated years while you watch the story unfold.",
    steps: [
      { n: "01", title: "Seed Idea", desc: "Drop your one-line concept. The kernel locks initial market, capital, team." },
      { n: "02", title: "World Spawn", desc: "140+ parallel agents instantiate: customers, hires, competitors, press." },
      { n: "03", title: "Decision Loop", desc: "AI takes every call — hiring, pricing, fundraise — at the right tick." },
      { n: "04", title: "Crisis Test", desc: "Markets crash, competitors launch, churn spikes. The agent adapts live." },
      { n: "05", title: "Verdict Engine", desc: "5-year report card: ARR, runway, dilution, exit valuation." },
    ],
  },
  FOUNDER: {
    tag: "interactive · decide",
    blurb: "You drive. The sim pauses at every crisis and asks: what do you do?",
    steps: [
      { n: "01", title: "Pin Vision", desc: "Lock founding thesis, target ICP, and starting cash." },
      { n: "02", title: "First 90 Days", desc: "Build vs buy, hire #1, beta vs stealth — your choices, your delta." },
      { n: "03", title: "Inflection Points", desc: "Crisis cards appear: pivot offer, term sheet, hostile competitor." },
      { n: "04", title: "Counter-Move", desc: "Pick a response. The world reshapes. Side-effects compound." },
      { n: "05", title: "Founder Score", desc: "Equity retained, mission integrity, team health — not just dollars." },
    ],
  },
  MARKETING: {
    tag: "research · radar",
    blurb: "Map the field before you ship — top 3 competitors, their book, their cracks, your opening.",
    steps: [
      { n: "01", title: "Define Protocol", desc: "Drop your idea into the terminal. The matrix tokenizes." },
      { n: "02", title: "Horizon Scan", desc: "AI scrapes 142 markets and tags closest competitors by intent." },
      { n: "03", title: "Strategy Audit", desc: "GTM, pricing, distribution, moat — distilled per competitor." },
      { n: "04", title: "Weakness Vector", desc: "Where each one is brittle — onboarding, pricing, infra, brand." },
      { n: "05", title: "Optimal Opening", desc: "The 3-step wedge with the highest probability of breaking through." },
    ],
  },
};

const TABS = Object.keys(ROADMAPS) as Array<keyof typeof ROADMAPS>;

export default function ModeRoadmaps() {
  const [active, setActive] = useState<string>("AUTOPILOT");
  const current = ROADMAPS[active];

  return (
    <section id="roadmaps" className="relative py-28" style={{ background: "#F4EFE5" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          index="04 / MODE ROADMAPS"
          title="How each mode unfolds."
          subtitle="Same engine, three temperaments. Here's the five-step arc inside each one."
        />

        {/* Tabs */}
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => {
            const isActive = t === active;
            return (
              <button
                key={t}
                onClick={() => setActive(t)}
                className="relative rounded-md px-5 py-2.5 transition-all"
                style={{
                  background: isActive ? "#1A1714" : "transparent",
                  color: isActive ? "#FAF7F2" : "#5A5247",
                  border: isActive ? "1px solid #1A1714" : "1px solid #E5DDCB",
                  fontFamily: "Space Grotesk",
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: "2px",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center max-w-2xl mx-auto">
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#E8600A", letterSpacing: "1.5px" }}>
            // {current.tag}
          </span>
          <p className="mt-2 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 15, lineHeight: 1.55 }}>
            {current.blurb}
          </p>
        </div>

        {/* Stepper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="relative mt-12"
          >
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-[28px] h-px bg-[#E5DDCB] hidden md:block" />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute left-0 right-0 top-[28px] h-px bg-[#E8600A] hidden md:block origin-left"
            />

            <div className="grid md:grid-cols-5 gap-5 relative">
              {current.steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative"
                >
                  {/* Node */}
                  <div className="flex md:justify-start justify-center">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center relative z-10"
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #E8600A",
                        boxShadow: "0 8px 24px -10px rgba(232,96,10,0.45)",
                      }}
                    >
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: "#E8600A", fontWeight: 700, letterSpacing: "1px" }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 rounded-lg p-4 bg-white shadow-paper" style={{ border: "1px solid #E5DDCB" }}>
                    <h4 style={{ fontFamily: "Instrument Serif", fontSize: 22, color: "#1A1714", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                      {s.title}
                    </h4>
                    <p className="mt-2 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 1.55 }}>
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
