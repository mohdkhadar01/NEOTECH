export default function Footer() {
  const PILLS = ["React", "Three.js", "Gemini API", "Multi-agent LLM", "Framer Motion"];
  const NAV = ["HOME", "ABOUT", "MODES", "SIMULATE", "RESULTS"];
  return (
    <footer className="relative py-16" style={{ background: "#FAF7F2", borderTop: "1px solid #E5DDCB" }}>
      <div className="absolute inset-0 paper-grain opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-7 w-7 flex items-center justify-center">
                <span className="absolute inset-0 border border-[#1A1714] rounded-sm" />
                <span className="h-2 w-2 rounded-full bg-[#E8600A] animate-pulse-dot" />
              </div>
              <span style={{ fontFamily: "Space Grotesk", letterSpacing: "3px", fontSize: 13, fontWeight: 700 }} className="text-[#1A1714]">
                NEO-VERSE
              </span>
            </div>
            <p className="mt-5 max-w-sm" style={{ fontFamily: "Instrument Serif", fontSize: 22, color: "#1A1714", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              The world's first AI-powered decision simulation engine<span className="text-[#E8600A]">.</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {PILLS.map((p) => (
                <span key={p} className="rounded px-2 py-0.5" style={{ background: "#F4EFE5", color: "#5A5247", fontFamily: "JetBrains Mono", fontSize: 9, letterSpacing: "0.5px" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1.5px" }}>navigate</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <a key={n} href={`#${n.toLowerCase()}`} className="text-[#5A5247] hover:text-[#E8600A] transition-colors" style={{ fontFamily: "Space Grotesk", fontSize: 12, letterSpacing: "1.5px", fontWeight: 500 }}>
                  {n}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#A8A096", letterSpacing: "1.5px" }}>mission</div>
            <p className="mt-4 text-[#5A5247] max-w-xs" style={{ fontFamily: "Inter", fontSize: 13, lineHeight: 1.6 }}>
              Helping founders, operators, and students stress-test business decisions using multi-agent game-theoretic simulations before launching in the real world.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 flex flex-wrap justify-between gap-3" style={{ borderTop: "1px solid #E5DDCB" }}>
          <span className="text-[#A8A096]" style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.5px" }}>
            © 2026 neo-verse · simulate the future. before it happens.
          </span>
          <span className="text-[#2D7A4F]" style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.5px" }}>
            ● sys.online
          </span>
        </div>
      </div>
    </footer>
  );
}
