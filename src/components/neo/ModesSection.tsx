import { motion } from "framer-motion";
import { Rocket, BrainCircuit, Swords, Radar, ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

const MODES = [
  {
    n: "01",
    icon: Rocket,
    title: "Autopilot",
    tag: "PASSIVE · WATCH",
    desc: "Click once. The AI becomes your founder and runs your startup for 5 simulated years. No input needed — watch it unfold.",
    cta: "Launch autopilot",
    featured: false,
  },
  {
    n: "02",
    icon: BrainCircuit,
    title: "Founder",
    tag: "INTERACTIVE · DECIDE",
    desc: "You're in control. The simulation pauses at every crisis — competitor launch, funding crunch, bad press — and asks what you do.",
    cta: "Become the founder",
    featured: true,
  },
  {
    n: "03",
    icon: Radar,
    title: "Marketing",
    tag: "RESEARCH · RADAR",
    desc: "AI competitor radar. Analyze top players, their strategies and weaknesses, and map your optimal opening move.",
    cta: "Launch radar",
    featured: false,
    href: "#marketing",
  },
];

function Mini({ kind }: { kind: string }) {
  if (kind === "01")
    return (
      <svg viewBox="0 0 64 32" className="w-16 h-8">
        <polyline points="0,28 12,22 22,24 32,14 44,16 54,6 64,8" stroke="#E8600A" strokeWidth="1.5" fill="none" />
      </svg>
    );
  if (kind === "02")
    return (
      <svg viewBox="0 0 64 32" className="w-16 h-8">
        {[8, 22, 36, 50].map((x, i) => (
          <circle key={i} cx={x} cy={16} r="3" fill="#E8600A" />
        ))}
        <line x1="8" y1="16" x2="50" y2="16" stroke="#E8600A" strokeWidth="1" opacity="0.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 32" className="w-16 h-8">
      <circle cx="32" cy="16" r="13" fill="none" stroke="#E8600A" strokeWidth="0.8" />
      <circle cx="32" cy="16" r="7" fill="none" stroke="#E8600A" strokeWidth="0.8" />
      <line x1="32" y1="16" x2="32" y2="3" stroke="#E8600A" strokeWidth="1.2">
        <animateTransform attributeName="transform" type="rotate" from="0 32 16" to="360 32 16" dur="4s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

export default function ModesSection() {
  return (
    <section id="modes" className="relative py-28" style={{ background: "#FAF7F2" }}>
      <div className="absolute inset-0 paper-grain opacity-50" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          index="03 / MODES"
          title="Three modes. One unwritten future."
          subtitle="One engine, three temperaments. Pick how much control you want."
        />

        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {MODES.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl p-8 transition-all duration-300 bg-white group"
                style={{
                  border: m.featured ? "1px solid rgba(232,96,10,0.55)" : "1px solid #E5DDCB",
                  boxShadow: m.featured
                    ? "0 1px 0 #E5DDCB, 0 30px 70px -30px rgba(232,96,10,0.40)"
                    : "0 1px 0 #E5DDCB, 0 24px 48px -32px rgba(26,23,20,0.18)",
                }}
              >
                {m.featured && (
                  <div
                    className="absolute -top-3 left-6 rounded-full px-3 py-1"
                    style={{
                      background: "#1A1714",
                      color: "#FAF7F2",
                      fontFamily: "Space Grotesk",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "1.5px",
                    }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#A8A096", letterSpacing: "1px" }}>
                    /mode/{m.n}
                  </span>
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center"
                    style={{ background: "#FFF1E5", border: "1px solid rgba(232,96,10,0.25)" }}
                  >
                    <Icon size={20} color="#E8600A" strokeWidth={1.6} />
                  </div>
                </div>

                <div className="mt-7 flex items-end justify-between gap-4">
                  <h3 style={{ fontFamily: "Instrument Serif", fontSize: 42, color: "#1A1714", lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {m.title}<span className="text-[#E8600A]">.</span>
                  </h3>
                  <Mini kind={m.n} />
                </div>

                <span
                  className="mt-2 inline-block"
                  style={{ color: "#A8A096", fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "1.5px" }}
                >
                  {m.tag}
                </span>
                <p className="mt-4 text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 14, lineHeight: 1.6 }}>
                  {m.desc}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <a
                    href={m.href ?? "#simulate"}
                    className="inline-flex items-center gap-1.5 transition-all duration-200 group-hover:gap-2.5 text-[#1A1714] hover:text-[#E8600A]"
                    style={{ fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}
                  >
                    {m.cta} <ArrowUpRight size={14} />
                  </a>
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#2D7A4F", letterSpacing: "1.5px" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse-dot" />
                    READY
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
