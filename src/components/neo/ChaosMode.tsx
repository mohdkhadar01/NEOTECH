import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import type { ChaosEvent } from '../../lib/ai/types';

const AvatarSystem3D = lazy(() => import('./AvatarSystem3D'));

interface ChaosModeProps {
  onInitiate: () => void;
  chaosEvent: ChaosEvent | null;
  open: boolean;
  onClose: (absorb: boolean) => void;
  loading: boolean;
  visible: boolean;
  hideTrigger?: boolean;
}

export function ChaosMode({ onInitiate, chaosEvent, open, onClose, loading, visible, hideTrigger }: ChaosModeProps) {
  const [flash, setFlash] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (open && chaosEvent) {
      setFlash(true);
      setShaking(true);
      setTimeout(() => setFlash(false), 100);
      setTimeout(() => setShaking(false), 600);
      setTimeout(() => setShowRipple(true), 3000);
    } else {
      setShowRipple(false);
    }
  }, [open, chaosEvent]);

  // Inject screen shake
  useEffect(() => {
    if (shaking) {
      document.body.style.animation = 'nv-shake 0.6s ease-out';
    } else {
      document.body.style.animation = '';
    }
    return () => { document.body.style.animation = ''; };
  }, [shaking]);

  if (!visible) return null;

  return (
    <>
      {/* Shake keyframes injected once */}
      <style>{`
        @keyframes nv-shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>

      {/* Initiate Chaos button */}
      {!open && !hideTrigger && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onInitiate}
          disabled={loading}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-shadow"
          style={{
            fontFamily: 'Space Grotesk',
            fontSize: 13,
            background: '#C0392B',
            color: 'white',
            boxShadow: '0 0 20px rgba(192,57,43,0.4)',
            border: 'none',
          }}
        >
          <Zap size={16} />
          {loading ? 'GENERATING...' : 'INITIATE CHAOS'}
        </motion.button>
      )}

      {/* White flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[200] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Chaos overlay */}
      <AnimatePresence>
        {open && chaosEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] overflow-y-auto"
            style={{
              background: 'rgba(192,57,43,0.08)',
              boxShadow: 'inset 0 0 0 3px rgba(192,57,43,0.6)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => onClose(false)}
              className="absolute top-6 right-6 z-10 p-2 rounded-full hover:bg-red-100 transition-colors"
              style={{ color: '#C0392B' }}
            >
              <X size={24} />
            </button>

            <div className="max-w-2xl mx-auto pt-12 pb-20 px-6">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <Suspense fallback={null}>
                  <AvatarSystem3D
                    text={chaosEvent.narrator_line}
                    emotion="alert"
                    size={200}
                    showSubtitle
                  />
                </Suspense>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#1A1714',
                  lineHeight: 1.1,
                }}
              >
                {chaosEvent.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center"
                style={{ fontFamily: 'Inter', fontSize: 16, color: '#5A5247', lineHeight: 1.6 }}
              >
                {chaosEvent.description}
              </motion.p>

              {/* Affected agents */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6"
              >
                <p className="text-center mb-2" style={{ fontFamily: 'Space Grotesk', fontSize: 11, color: '#C0392B', fontWeight: 700 }}>
                  AFFECTED AGENTS
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(chaosEvent.affected_agents || []).map(agent => (
                    <span
                      key={agent}
                      className="px-3 py-1 rounded-full"
                      style={{
                        fontFamily: 'JetBrains Mono', fontSize: 10,
                        background: 'rgba(192,57,43,0.1)', color: '#C0392B',
                        border: '1px solid rgba(192,57,43,0.3)',
                      }}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* KPI Impact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {Object.entries(chaosEvent.kpi_impact || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: '#FAF7F2',
                      border: `1px solid ${(value as number) < 0 ? 'rgba(192,57,43,0.3)' : 'rgba(45,122,79,0.3)'}`,
                    }}
                  >
                    <span
                      className="block"
                      style={{
                        fontFamily: 'Space Grotesk',
                        fontSize: 20,
                        fontWeight: 700,
                        color: (value as number) < 0 ? '#C0392B' : '#2D7A4F',
                      }}
                    >
                      {(value as number) > 0 ? '+' : ''}{value as number}%
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5A5247', textTransform: 'uppercase' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Ripple events */}
              <AnimatePresence>
                {showRipple && (chaosEvent.continuation_events || []).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-10"
                  >
                    <p className="text-center mb-4" style={{ fontFamily: 'Space Grotesk', fontSize: 12, color: '#C0392B', fontWeight: 700 }}>
                      RIPPLE EVENTS
                    </p>
                    <div className="space-y-3">
                      {chaosEvent.continuation_events.map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.6 }}
                          className="rounded-xl p-4"
                          style={{
                            background: '#FAF7F2',
                            border: '1px solid rgba(192,57,43,0.15)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#C0392B' }}>
                              M{event.month}
                            </span>
                            <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, color: '#1A1714' }}>
                              {event.title}
                            </span>
                          </div>
                          <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#5A5247', lineHeight: 1.4 }}>
                            {event.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Absorb button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-10 flex justify-center"
              >
                <button
                  onClick={() => onClose(true)}
                  className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontSize: 14,
                    background: '#1A1714',
                    color: '#FAF7F2',
                  }}
                >
                  ABSORB CHAOS
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChaosMode;
