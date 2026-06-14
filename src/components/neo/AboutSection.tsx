import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { X, Check } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { ViewportCanvas } from "./ViewportCanvas";

const Avatar3D = lazy(() => import("./Avatar3D"));

const PROBLEMS = [
  "42% of startups die from no market need — not bad ideas, but bad decision visibility.",
  "68% of founders are misled by vanity metrics before collapse.",
  "Today's AI gives advice. Nobody shows you consequences.",
];

const WITHOUT = ["Ask experts → expensive, slow, biased", "Ask AI → advice only, no simulation", "Use spreadsheets → static, no agents", "Guess → hope for the best"];
const WITHIT = ["Enter any decision", "AI generates the stakeholder world", "Watch consequences across simulated years", "Branch timelines. Compare futures."];

export default function AboutSection() {
  return (
    <section id="about" className="relative py-28" style={{ background: "#F4EFE5" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader index="02 / PROBLEM" title="Every major decision is made blind." subtitle="Founders, operators, investors — guessing at consequences with no rehearsal." />

        <div className="mt-20 grid lg:grid-cols-3 gap-10 items-start">
          {/* Left: problems */}
          <div className="flex flex-col gap-4">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="rounded-r-lg p-5 bg-white shadow-paper"
                style={{ borderLeft: "3px solid #E8600A" }}
              >
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", letterSpacing: "1px" }}>
                  FACT-0{i + 1}
                </span>
                <p className="mt-2" style={{ fontFamily: "Inter", fontSize: 14.5, color: "#1A1714", lineHeight: 1.55 }}>{p}</p>
              </motion.div>
            ))}
          </div>

          {/* Center: Avatar */}
          <div className="flex justify-center">
            <div className="w-[360px] h-[360px] relative">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(232,96,10,0.10), transparent 70%)" }} />
              <ViewportCanvas className="w-full h-full">
                <Suspense fallback={null}>
                  <Avatar3D className="w-full h-full" />
                </Suspense>
              </ViewportCanvas>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white" style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#5A5247", letterSpacing: "1px", border: "1px solid #E5DDCB" }}>
                fig.02 — agent.face
              </span>
            </div>
          </div>

          {/* Right: comparison */}
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-lg p-6 bg-white shadow-paper">
              <span className="inline-block rounded-full px-2.5 py-0.5" style={{ background: "#FAEFEC", color: "#C0392B", fontFamily: "Space Grotesk", fontSize: 10, letterSpacing: "1.5px", fontWeight: 600 }}>
                WITHOUT NEO-VERSE
              </span>
              <ul className="mt-4 space-y-2.5">
                {WITHOUT.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 13.5 }}>
                    <X size={14} className="text-[#C0392B] mt-0.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg p-6 bg-white shadow-accent-soft" style={{ border: "1px solid rgba(232,96,10,0.25)" }}>
              <span className="inline-block rounded-full px-2.5 py-0.5" style={{ background: "#FFF1E5", color: "#E8600A", fontFamily: "Space Grotesk", fontSize: 10, letterSpacing: "1.5px", fontWeight: 600 }}>
                WITH NEO-VERSE
              </span>
              <ul className="mt-4 space-y-2.5">
                {WITHIT.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-[#1A1714]" style={{ fontFamily: "Inter", fontSize: 13.5 }}>
                    <Check size={14} className="text-[#E8600A] mt-0.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
