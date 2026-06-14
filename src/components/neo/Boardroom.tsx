import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { BoardroomSession, SimAgent } from '../../lib/ai/types';

const AvatarSystem3D = lazy(() => import('./AvatarSystem3D'));

const AVATAR_EMOJI: Record<string, string> = {
  investor: '\u{1F4B0}',
  customer: '\u{1F464}',
  competitor: '\u2694\uFE0F',
  regulator: '\u{1F3DB}\uFE0F',
  employee: '\u{1F465}',
  media: '\u{1F4F0}',
  founder: '\u{1F680}',
  generic: '\u{1F916}',
};

const STATE_COLORS: Record<string, string> = {
  supportive: '#2D7A4F',
  neutral: '#888',
  concerned: '#C0392B',
  influencing: '#8B5CF6',
  collaborative: '#2563EB',
};

const EMOTION_COLORS: Record<string, string> = {
  alert: '#C0392B',
  happy: '#2D7A4F',
  serious: '#FFB800',
  excited: '#8B5CF6',
  neutral: '#888',
};

interface BoardroomProps {
  session: BoardroomSession;
  agents: SimAgent[];
  open: boolean;
  onClose: () => void;
  onDecide: (decisionPrompt: string, chosenOption: string) => void;
}

export function Boardroom({ session, agents, open, onClose, onDecide }: BoardroomProps) {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showVotes, setShowVotes] = useState(false);
  const [activeAgentIdx, setActiveAgentIdx] = useState(-1);
  const [avatarText, setAvatarText] = useState('');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'alert' | 'happy' | 'serious' | 'excited'>('neutral');
  const feedRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!open || !session) return;
    const msgs = session.messages ?? [];
    setVisibleMessages(0);
    setShowVotes(false);
    setActiveAgentIdx(-1);
    setAvatarText(session.narrator_line ?? '');
    setAvatarEmotion('serious');

    if (msgs.length === 0) {
      setTimeout(() => setShowVotes(true), 800);
      return;
    }

    const timer = setInterval(() => {
      setVisibleMessages(prev => {
        const next = prev + 1;
        if (next >= msgs.length) {
          clearInterval(timer);
          setTimeout(() => setShowVotes(true), 1500);
          return msgs.length;
        }
        const msg = msgs[next];
        setAvatarText(msg?.message ?? '');
        setAvatarEmotion((msg?.emotion as any) || 'neutral');
        const agentIdx = agents.findIndex(a => a.role === msg?.agent);
        setActiveAgentIdx(agentIdx);
        return next;
      });
    }, 2500);
    timerRef.current = timer;

    return () => clearInterval(timer);
  }, [open, session, agents]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  if (!open || !session) return null;

  const cx = 250, cy = 250, radius = 180;
  const voteCounts: Record<string, number> = {};
  if (session.votes && Object.keys(session.votes).length > 0) {
    Object.values(session.votes).forEach(v => {
      if (v) voteCounts[v] = (voteCounts[v] || 0) + 1;
    });
  }
  if (Object.keys(voteCounts).length === 0 && session.messages) {
    session.messages.forEach(msg => {
      if (msg.vote) {
        voteCounts[msg.vote] = (voteCounts[msg.vote] || 0) + 1;
      }
    });
  }
  if (Object.keys(voteCounts).length === 0) {
    voteCounts["Negotiate and Compromise"] = 1;
    voteCounts["Aggressive Countermeasure"] = 1;
    voteCounts["Focus on Core Operations"] = 1;
  }
  const topVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const totalVotes = Object.values(voteCounts).reduce((sum, val) => sum + val, 0) || 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex"
        style={{ background: 'rgba(26,23,20,0.92)', backdropFilter: 'blur(8px)' }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white hover:text-orange-400 transition-colors">
          <X size={28} />
        </button>

        {/* Avatar top-right */}
        <div className="absolute top-4 right-16 hidden md:block">
          <Suspense fallback={null}>
            <AvatarSystem3D text={avatarText} emotion={avatarEmotion} size={160} showSubtitle={false} />
          </Suspense>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Circular agent layout */}
          <div className="relative" style={{ width: 500, height: 500 }}>
            {/* Center card */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute flex flex-col items-center justify-center text-center"
              style={{
                left: cx - 60, top: cy - 40, width: 120, height: 80,
                background: '#FAF7F2', borderRadius: 12,
                border: '2px solid #E8600A',
              }}
            >
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 11, color: '#E8600A', fontWeight: 700 }}>
                CRISIS
              </span>
              <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#1A1714', marginTop: 4, lineHeight: 1.2, padding: '0 6px' }}>
                {session.trigger}
              </span>
            </motion.div>

            {/* Agent cards */}
            {agents.slice(0, 8).map((agent, i) => {
              const angle = (2 * Math.PI * i) / Math.min(agents.length, 8);
              const x = cx + radius * Math.cos(angle) - 40;
              const y = cy + radius * Math.sin(angle) - 40;
              const isActive = i === activeAgentIdx;
              const borderColor = STATE_COLORS[agent.state] || '#888';

              return (
                <div key={`${agent.role || agent.short_role || i}`} className="absolute" style={{ left: x, top: y, width: 80, height: 80 }}>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0.6, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full"
                        style={{ border: `3px solid ${borderColor}`, pointerEvents: 'none' }}
                      />
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1, scale: 1,
                      boxShadow: isActive ? `0 0 24px ${borderColor}` : 'none',
                    }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full h-full flex flex-col items-center justify-center rounded-full"
                    style={{
                      background: '#FAF7F2',
                      border: `2px solid ${isActive ? '#E8600A' : borderColor}`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{AVATAR_EMOJI[agent.avatar_type] || '\u{1F916}'}</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: 8, color: '#1A1714',
                      marginTop: 2, textAlign: 'center', lineHeight: 1.1,
                    }}>
                      {agent.short_role}
                    </span>
                  </motion.div>
                </div>
              );
            })}

            {/* Speech bubble for current message */}
            <AnimatePresence mode="wait">
              {visibleMessages > 0 && visibleMessages <= session.messages.length && (() => {
                const msg = session.messages[visibleMessages - 1];
                const agentIdx = agents.findIndex(a => a.role === msg.agent);
                if (agentIdx < 0) return null;
                const angle = (2 * Math.PI * agentIdx) / Math.min(agents.length, 8);
                const bx = cx + (radius * 0.55) * Math.cos(angle);
                const by = cy + (radius * 0.55) * Math.sin(angle);
                return (
                  <motion.div
                    key={visibleMessages}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute"
                    style={{
                      left: bx - 100, top: by - 30, width: 200,
                      background: '#FAF7F2', borderRadius: 12,
                      padding: '8px 12px',
                      border: '1px solid rgba(232,96,10,0.2)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      zIndex: 10,
                    }}
                  >
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 10, color: '#E8600A', fontWeight: 600 }}>
                      {msg.agent}
                      <span
                        className="ml-2 inline-block rounded-full px-1.5 py-0.5"
                        style={{
                          fontSize: 8,
                          background: EMOTION_COLORS[msg.emotion] || '#888',
                          color: 'white',
                        }}
                      >
                        {msg.emotion}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Inter', fontSize: 11, color: '#1A1714', marginTop: 4, lineHeight: 1.3 }}>
                      {msg.message}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side message feed */}
        <div
          className="w-72 border-l flex flex-col"
          style={{ borderColor: 'rgba(232,96,10,0.2)', background: 'rgba(26,23,20,0.6)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'rgba(232,96,10,0.2)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk', color: '#E8600A', fontSize: 13, fontWeight: 700 }}>
              BOARDROOM LOG
            </h3>
            <p style={{ fontFamily: 'Inter', color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 }}>
              Month {session.trigger_month}
            </p>
          </div>

          <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {(session.messages ?? []).slice(0, visibleMessages).map((msg, i) => {
              const isNewest = i === visibleMessages - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-left"
                  style={{
                    borderLeft: isNewest ? '2px solid #E8600A' : '2px solid transparent',
                    paddingLeft: 8,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{AVATAR_EMOJI[msg.avatar_type] || '\u{1F916}'}</span>
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: 10, color: '#E8600A', marginLeft: 4 }}>
                    {msg.agent}
                  </span>
                  <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, lineHeight: 1.3 }}>
                    {msg.message}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Voting results */}
          <AnimatePresence>
            {showVotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t"
                style={{ borderColor: 'rgba(232,96,10,0.2)' }}
              >
                <h4 style={{ fontFamily: 'Space Grotesk', color: '#E8600A', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                  VOTING RESULTS
                </h4>
                <div className="space-y-2">
                  {topVotes.map(([vote, count], i) => (
                    <div key={vote} className="flex items-center gap-2">
                      <div className="flex-1">
                        <span style={{ fontFamily: 'Inter', fontSize: 10, color: 'white' }}>{vote}</span>
                        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / totalVotes) * 100}%` }}
                            className="h-full rounded-full"
                            style={{ background: i === 0 ? '#E8600A' : 'rgba(232,96,10,0.4)' }}
                          />
                        </div>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <p style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                    FOUNDER DECIDES
                  </p>
                  {topVotes.map(([vote], i) => (
                    <button
                      key={`${vote || i}`}
                      onClick={() => { onDecide(session.trigger, vote); onClose(); }}
                      className="w-full py-2 rounded-lg transition-colors"
                      style={{
                        fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600,
                        background: 'rgba(232,96,10,0.15)', color: '#E8600A',
                        border: '1px solid rgba(232,96,10,0.3)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#E8600A';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(232,96,10,0.15)';
                        e.currentTarget.style.color = '#E8600A';
                      }}
                    >
                      {vote}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          {showVotes ? (
            <div className="p-3" style={{ borderTop: '1px solid rgba(232,96,10,0.15)' }}>
              <p style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                {session.summary}
              </p>
            </div>
          ) : (
            <div className="p-4 text-center" style={{ borderTop: '1px solid rgba(232,96,10,0.15)' }}>
              <p className="animate-pulse" style={{ fontFamily: 'Space Grotesk', fontSize: 11, color: '#E8600A', fontWeight: 600, letterSpacing: '1px' }}>
                DEBATE IN PROGRESS...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Boardroom;
