import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, History } from "lucide-react";
import type { useSimulation } from "@/hooks/useSimulation";
import { runSimulateAction } from "@/lib/api/simulate.functions";

const LINKS = [
  { id: "home", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "modes", label: "MODES" },
  { id: "marketing", label: "MARKETING" },
  { id: "simulate", label: "SIMULATE" },
];

interface SessionItem {
  session_id: string;
  idea: string;
  created_at: string;
}

export default function Navbar({ sim }: { sim: ReturnType<typeof useSimulation> }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const fetchSessions = async () => {
    if (showSessions) { setShowSessions(false); return; }
    setLoadingSessions(true);
    setShowSessions(true);
    try {
      const data = await runSimulateAction({ data: { action: 'sessions' } });
      setSessions(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setSessions([]);
    } finally { setLoadingSessions(false); }
  };

  const restoreSession = (sid: string) => {
    sim.loadSession(sid);
    setShowSessions(false);
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[1000] h-16 backdrop-blur-xl"
      style={{
        background: "rgba(250,247,242,0.82)",
        borderBottom: `1px solid ${scrolled ? "rgba(26,23,20,0.10)" : "transparent"}`,
        transition: "border-color 300ms",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="relative h-7 w-7 flex items-center justify-center">
            <span className="absolute inset-0 border border-[#1A1714] rounded-sm" />
            <span className="absolute left-0 top-0 h-2 w-2 border-t border-l border-[#1A1714]" />
            <span className="absolute right-0 top-0 h-2 w-2 border-t border-r border-[#1A1714]" />
            <span className="absolute left-0 bottom-0 h-2 w-2 border-b border-l border-[#1A1714]" />
            <span className="absolute right-0 bottom-0 h-2 w-2 border-b border-r border-[#1A1714]" />
            <span className="h-2 w-2 rounded-full bg-[#E8600A] animate-pulse-dot" />
          </div>
          <span style={{ fontFamily: "Space Grotesk", letterSpacing: "3px", fontSize: 13, fontWeight: 700 }} className="text-[#1A1714]">
            NEO-VERSE
          </span>
          <span
            className="hidden sm:inline-block rounded-full px-2 py-[2px]"
            style={{
              background: "#FFF1E5", color: "#E8600A", fontSize: 9,
              fontFamily: "JetBrains Mono", border: "1px solid rgba(232,96,10,0.25)", letterSpacing: "0.5px",
            }}
          >
            v2.35
          </span>
        </a>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="relative group text-[#5A5247] hover:text-[#E8600A] transition-colors"
              style={{ fontFamily: "Space Grotesk", fontSize: 11, letterSpacing: "2px", fontWeight: 500 }}
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-full bg-[#E8600A] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </a>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Load session button */}
          <div className="relative">
            <button
              onClick={fetchSessions}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all hover:bg-[#F4EFE5]"
              style={{
                border: "1px solid #E5DDCB", color: "#5A5247",
                fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 600, letterSpacing: "1px",
              }}
            >
              <History size={12} />
              LOAD SESSION
            </button>

            <AnimatePresence>
              {showSessions && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 w-72 rounded-lg overflow-hidden shadow-lg"
                  style={{ background: "#FAF7F2", border: "1px solid #E5DDCB", zIndex: 10 }}
                >
                  <div className="p-3 border-b" style={{ borderColor: "#E5DDCB" }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#E8600A", letterSpacing: "1px" }}>
                      recent_sessions
                    </span>
                  </div>
                  {loadingSessions && (
                    <div className="p-4 text-center" style={{ fontFamily: "Inter", fontSize: 11, color: "#A8A096" }}>
                      Loading...
                    </div>
                  )}
                  {!loadingSessions && sessions.length === 0 && (
                    <div className="p-4 text-center" style={{ fontFamily: "Inter", fontSize: 11, color: "#A8A096" }}>
                      No sessions found
                    </div>
                  )}
                  {sessions.map((s) => (
                    <button
                      key={s.session_id}
                      onClick={() => restoreSession(s.session_id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#F4EFE5] transition-colors border-b last:border-b-0"
                      style={{ borderColor: "#E5DDCB" }}
                    >
                      <div className="truncate" style={{ fontFamily: "Inter", fontSize: 12, color: "#1A1714" }}>
                        {s.idea || 'Untitled'}
                      </div>
                      <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "#A8A096", marginTop: 2 }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F] animate-pulse-dot" />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.5px" }} className="text-[#2D7A4F]">
              sys.online
            </span>
          </div>
          <a
            href="#simulate"
            className="hidden sm:inline-flex items-center justify-center rounded-md border border-[#1A1714] text-[#1A1714] hover:bg-[#1A1714] hover:text-[#FAF7F2] transition-all duration-200 px-4 py-2"
            style={{ fontFamily: "Space Grotesk", fontSize: 10, fontWeight: 600, letterSpacing: "1.5px" }}
          >
            LAUNCH DEMO {'\u2192'}
          </a>
          <button onClick={() => setOpen(!open)} className="lg:hidden text-[#1A1714]">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden absolute top-16 left-0 right-0 bg-[#FAF7F2] border-b border-[#E5DDCB] p-6 flex flex-col gap-4"
        >
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              className="text-[#5A5247] hover:text-[#E8600A]"
              style={{ fontFamily: "Space Grotesk", letterSpacing: "2px", fontSize: 12 }}
            >
              {l.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
