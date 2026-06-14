import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import type { useSimulation } from "@/hooks/useSimulation";
import type { SimAgent } from "@/lib/ai/types";

const SECTORS: Record<string, string[]> = {
  "FOOD APP": ["Customer", "Investor", "Competitor", "Food Regulator", "Delivery Partner", "App Store", "Media", "Nutritionist", "Supplier"],
  "HOSPITAL": ["Patient", "Doctor", "Insurance Co.", "Health Regulator", "Pharma Supplier", "Govt. Agency", "Media", "Lab Partner", "Nurse Union"],
  "EDTECH": ["Student", "Parent", "Teacher", "School Board", "Investor", "Competitor", "Content Partner", "Platform Store", "Media"],
};

const THREAT_COLORS: Record<string, string> = {
  low: '#2D7A4F',
  medium: '#B8860B',
  high: '#C0392B',
};

const STATE_COLORS: Record<string, string> = {
  supportive: '#2D7A4F',
  neutral: '#888',
  concerned: '#C0392B',
  influencing: '#8B5CF6',
  collaborative: '#2563EB',
};

export default function AgentFactory({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const [sector, setSector] = useState("FOOD APP");
  const [customAgents, setCustomAgents] = useState<SimAgent[]>([]);
  const { result, currentIdea } = sim;

  // Auto-populate custom agents when simulation runs
  useEffect(() => {
    if (result?.agents && result.agents.length > 0) {
      setCustomAgents(result.agents);
      setSector("YOUR STARTUP");
    }
  }, [result?.agents]);

  const allSectors = { ...SECTORS };
  if (currentIdea || customAgents.length > 0) {
    allSectors["YOUR STARTUP"] = [];
  }

  const isCustom = sector === "YOUR STARTUP";
  const nodes = isCustom ? [] : (SECTORS[sector] || []);

  return (
    <section className="relative py-28" style={{ background: "#FAF7F2" }}>
      <div className="absolute inset-0 paper-grain opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeader index="07 / AGENT FACTORY" title="No hardcoded roles. Everything emerges from the idea." subtitle="Switch industries \u2014 watch the agent topology rewrite itself." />

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Object.keys(allSectors).map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className="rounded-full px-4 py-2 transition-all"
              style={{
                background: sector === s ? "#1A1714" : "transparent",
                border: sector === s ? "1px solid #1A1714" : "1px solid #E5DDCB",
                color: sector === s ? "#FAF7F2" : "#5A5247",
                fontFamily: "Space Grotesk", fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-14 relative mx-auto" style={{ width: "min(560px, 100%)", height: 560 }}>
          {/* center */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full flex items-center justify-center animate-soft-pulse bg-white"
            style={{
              width: 150, height: 150,
              border: "1.5px solid #E8600A",
              color: "#1A1714",
              fontFamily: "Instrument Serif",
              fontSize: isCustom ? 16 : 22,
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.05,
              padding: isCustom ? 12 : 0,
            }}
          >
            {isCustom ? (
              <span className="text-[#E8600A]" style={{ fontSize: 14 }}>
                {currentIdea ? currentIdea.slice(0, 40) + (currentIdea.length > 40 ? '...' : '') : 'Your idea.'}
              </span>
            ) : (
              <>Your<br /><span className="italic text-[#E8600A]">idea.</span></>
            )}
          </motion.div>

          {/* Static sector nodes */}
          {!isCustom && nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 220;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.div
                key={`${sector}-${n}`}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                whileInView={{ opacity: 1, x, y, scale: 1 }}
                viewport={{ once: false, margin: "-120px" }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 110, damping: 14 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  className="rounded-full px-4 py-2 bg-white shadow-paper"
                  style={{
                    border: "1px solid #E5DDCB",
                    color: "#1A1714",
                    fontFamily: "Space Grotesk", fontSize: 12, letterSpacing: "0.5px", fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {n}
                </div>
              </motion.div>
            );
          })}

          {/* Custom AI-generated agent nodes */}
          {isCustom && customAgents.map((agent, i) => {
            const angle = (i / customAgents.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 220;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const stateColor = STATE_COLORS[agent.state] || '#888';
            const threatColor = THREAT_COLORS[agent.threat_level] || '#888';

            return (
              <motion.div
                key={`custom-${agent.role || agent.short_role || i}`}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{ opacity: 1, x, y, scale: 1 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 110, damping: 14 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  className="rounded-full px-4 py-2 bg-white shadow-paper relative"
                  style={{
                    border: `2px solid ${stateColor}`,
                    color: "#1A1714",
                    fontFamily: "Space Grotesk", fontSize: 11, letterSpacing: "0.5px", fontWeight: 600,
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <span
                    className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
                    style={{ background: threatColor }}
                  />
                  {agent.short_role}
                </div>
              </motion.div>
            );
          })}

          {/* No agents placeholder for YOUR STARTUP */}
          {isCustom && customAgents.length === 0 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-16 text-center">
              <p style={{ fontFamily: "Inter", fontSize: 13, color: "#A8A096" }}>
                Run a simulation to generate AI agents
              </p>
            </div>
          )}

          {/* Connecting lines */}
          <svg className="absolute inset-0 -z-0" viewBox="-280 -280 560 560" preserveAspectRatio="none">
            {(isCustom ? customAgents : nodes).map((_, i) => {
              const total = isCustom ? customAgents.length : nodes.length;
              const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 220;
              const y = Math.sin(angle) * 220;
              return <line key={i} x1="0" y1="0" x2={x} y2={y} stroke="#1A1714" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="3 4" />;
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
