import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus } from "lucide-react";
import SectionHeader from "./SectionHeader";

const QAS = [
  {
    q: "Isn't this just ChatGPT with a fancy UI?",
    a: "No. ChatGPT gives a paragraph of advice. NEO-VERSE runs a multi-agent simulation where AI personas — each with their own goals and memory — interact over simulated time. The output is a dynamic timeline, not text.",
  },
  {
    q: "How accurate are the simulations?",
    a: "We don't claim prediction accuracy — no tool can guarantee the future. We offer consequence exploration. Like a flight simulator: it doesn't guarantee a perfect flight, but it trains better pilots. NEO-VERSE trains better decision-makers.",
  },
  {
    q: "What's your monetization?",
    a: "Freemium: limited sims free. Pro at ₹999/month for founders. Enterprise for VCs and accelerators. B2B for MBA programs and startup bootcamps.",
  },
  {
    q: "Who are your competitors?",
    a: "Traditional: manual spreadsheet planning (slow, no agents). AI: ChatGPT advice (no simulation). Games: business strategy games (entertainment only). Nobody combines multi-agent simulation + branching futures + real decisions.",
  },
  {
    q: "Can you scale this?",
    a: "The architecture is fully API-based. As LLMs get cheaper, simulations get richer. The moat is the simulation design and agent behavioral frameworks — not the compute.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28" style={{ background: "#F4EFE5" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-4xl px-6">
        <SectionHeader index="08 / FAQ" title="Hard questions. Real answers." />

        <div className="mt-14 rounded-2xl overflow-hidden bg-white shadow-paper" style={{ border: "1px solid #E5DDCB" }}>
          {QAS.map((qa, i) => (
            <div key={i} style={{ borderBottom: i < QAS.length - 1 ? "1px solid #E5DDCB" : "none" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-7 py-6 text-left hover:bg-[#FAF7F2] transition-colors group"
              >
                <span className="flex items-baseline gap-4">
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#A8A096", letterSpacing: "0.5px" }}>
                    Q.0{i + 1}
                  </span>
                  <span style={{ fontFamily: "Instrument Serif", fontSize: 22, color: "#1A1714", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                    {qa.q}
                  </span>
                </span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 ml-4">
                  <Plus size={20} className="text-[#E8600A]" strokeWidth={1.5} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="px-7 pb-6 pl-[68px] text-[#5A5247]" style={{ fontFamily: "Inter", fontSize: 14.5, lineHeight: 1.65 }}>
                      {qa.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
