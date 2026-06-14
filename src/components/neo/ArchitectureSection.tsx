import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Sparkles, Users, Cpu, GitBranch } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { ViewportCanvas } from "./ViewportCanvas";

const ArchNetwork3D = lazy(() => import("./ArchNetwork3D"));

const BLOCKS = [
  { n: "01", Icon: Sparkles, title: "Scenario Generator", desc: "Understands the decision. Creates 3–5 branching futures.", pills: ["Gemini API", "Claude API"] },
  { n: "02", Icon: Users, title: "Agent Society", desc: "Spawns AI personas: customers, investors, rivals, journalists. Each with memory and goals.", pills: ["Multi-agent LLM", "Dynamic spawn"] },
  { n: "03", Icon: Cpu, title: "Simulation Engine", desc: "Runs thousands of agent interactions across simulated months. Tracks revenue, trust, risk, adoption.", pills: ["Custom logic", "LLM chains"] },
  { n: "04", Icon: GitBranch, title: "Future Visualizer", desc: "Branching timelines. Outcome comparisons. Alternate reality explorer.", pills: ["React", "Framer Motion"] },
];

export default function ArchitectureSection() {
  return (
    <section className="relative py-28" style={{ background: "#F4EFE5" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader index="04 / ARCHITECTURE" title="Four layers. One living simulation." subtitle="API-first, agent-native, designed to scale as LLMs get cheaper." />

        <div className="mt-16 grid lg:grid-cols-4 gap-4 relative">
          {BLOCKS.map((b, i) => {
            const Icon = b.Icon;
            return (
              <motion.div
                key={b.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-xl p-6 group transition-all duration-300 hover:-translate-y-1 bg-white shadow-paper"
                style={{ minHeight: 240 }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#A8A096", letterSpacing: "1px" }}>L{b.n}</span>
                  <Icon size={20} className="text-[#E8600A]" strokeWidth={1.6} />
                </div>
                <h4 className="mt-5" style={{ fontFamily: "Instrument Serif", fontSize: 24, color: "#1A1714", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                  {b.title}
                </h4>
                <p className="mt-2 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 1.55 }}>
                  {b.desc}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {b.pills.map((p) => (
                    <span
                      key={p}
                      className="rounded px-2 py-0.5"
                      style={{ background: "#F4EFE5", color: "#5A5247", fontFamily: "JetBrains Mono", fontSize: 9, letterSpacing: "0.5px" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>

                {i < BLOCKS.length - 1 && (
                  <svg className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:block z-10" width="24" height="12" viewBox="0 0 24 12">
                    <line x1="0" y1="6" x2="22" y2="6" stroke="#E8600A" strokeWidth="1.5" className="dash-flow" />
                    <polyline points="18,2 22,6 18,10" stroke="#E8600A" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-14 mx-auto w-full max-w-3xl h-[240px] rounded-2xl bg-white shadow-paper p-4">
          <ViewportCanvas className="w-full h-full">
            <Suspense fallback={null}>
              <ArchNetwork3D className="w-full h-full" />
            </Suspense>
          </ViewportCanvas>
        </div>
      </div>
    </section>
  );
}
