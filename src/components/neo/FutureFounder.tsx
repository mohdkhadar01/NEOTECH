import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Phone, PhoneOff, MessageSquare, Volume2, Loader2 } from "lucide-react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { runSimulateAction } from "../../lib/api/simulate.functions";
import type { SimResult } from "../../lib/ai/types";

const AvatarSystem3D = lazy(() => import("./AvatarSystem3D"));

interface FutureFounderProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  idea: string;
  simResult: SimResult | null;
}

interface ChatMsg {
  role: "user" | "founder";
  text: string;
}

const STARTERS = [
  "What almost killed us?",
  "What was your biggest mistake?",
  "Which decision changed everything?",
  "What do you regret?",
  "Did we survive?",
];

function getEmotion(question: string): "neutral" | "alert" | "happy" | "serious" | "excited" {
  const q = question.toLowerCase();
  if (q.includes("kill") || q.includes("fail") || q.includes("die") || q.includes("mistake")) return "serious";
  if (q.includes("success") || q.includes("grow") || q.includes("survi")) return "happy";
  if (q.includes("mistake") || q.includes("wrong") || q.includes("regret")) return "alert";
  return "neutral";
}

// ─── Inner component that uses the hook (must be inside ConversationProvider) ───
function FutureFounderInner({ open, onClose, sessionId, idea, simResult }: FutureFounderProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarText, setAvatarText] = useState("Ask me anything about the journey. I lived through it all.");
  const [avatarEmotion, setAvatarEmotion] = useState<"neutral" | "alert" | "happy" | "serious" | "excited">("serious");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);
  const connectionAttemptRef = useRef<'webrtc' | 'websocket' | null>(null);
  const resRef = useRef<{ token: string | null; signedUrl: string | null } | null>(null);
  const dynamicVarsRef = useRef<any>(null);

  // ElevenLabs Conversational hook — now correctly inside ConversationProvider
  const conversation = useConversation({
    onConnect: () => {
      setVoiceError("");
      setAvatarText("Connection established. Speak when ready.");
      setAvatarEmotion("neutral");
    },
    onDisconnect: () => {
      setAvatarText("Call disconnected.");
    },
    onMessage: (message) => {
      if (message.message) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.text === message.message && lastMsg.role === (message.source === "user" ? "user" : "founder")) {
            return prev;
          }
          return [...prev, {
            role: message.source === "user" ? "user" : "founder",
            text: message.message
          }];
        });

        if (message.source === "ai") {
          setAvatarText(message.message);
          setAvatarEmotion(getEmotion(message.message));
        }
      }
    },
    onError: (error: any) => {
      console.error("[elevenlabs error]", error);
      const errMsg = error?.message || String(error);
      
      // Auto fallback to WebSocket if WebRTC fails
      if (connectionAttemptRef.current === 'webrtc' && resRef.current?.signedUrl) {
        console.warn("WebRTC connection failed. Falling back to WebSocket...");
        connectionAttemptRef.current = 'websocket';
        setVoiceError("WebRTC connection failed. Retrying via WebSocket...");
        
        setTimeout(async () => {
          try {
            await conversation.startSession({
              signedUrl: resRef.current!.signedUrl!,
              connectionType: "websocket"
            });
          } catch (err: any) {
            console.error("Fallback failed:", err);
            setVoiceError(err.message || "WebSocket fallback connection failed.");
          }
        }, 800);
      } else {
        setVoiceError(errMsg);
      }
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setAvatarText("Ask me anything about the journey. I lived through it all.");
      setAvatarEmotion("serious");
      setVoiceError("");
    } else {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    }
  }, [open]);

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason && (
        (reason.message && (reason.message.includes("error_type") || reason.message.includes("DataChannel") || reason.message.includes("undefined"))) ||
        (reason.stack && reason.stack.includes("elevenlabs"))
      )) {
        console.warn("Caught ElevenLabs WebRTC connection rejection:", reason);
        setVoiceError("Connection closed. This voice Agent ID may be unauthorized or invalid for your ElevenLabs account.");
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      const message = event.message || "";
      if (
        message.includes("error_type") ||
        message.includes("DataChannel") ||
        message.includes("WebSocket") ||
        (error && error.stack && error.stack.includes("elevenlabs"))
      ) {
        console.warn("Caught ElevenLabs SDK exception:", error || message);
        setVoiceError("Voice Call Error: Connection failed. Check if this Agent ID is active under your ElevenLabs account.");
        event.preventDefault(); // Stop window logging
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  const formatINR = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const startVoiceCall = async () => {
    try {
      setVoiceError("");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const timelineStr = (simResult?.timeline || [])
        .map(e => `Month ${e.month}: ${e.title}`)
        .join(", ");

      const compNames = (simResult?.agents || [])
        .filter(a => a.avatar_type === "competitor")
        .map(a => a.short_role)
        .join(", ") || "Local competitors";

      const dynamicVars = {
        startup_idea: idea,
        survival_probability: String(simResult?.outcome?.survival_probability ?? 30) + "%",
        final_revenue: formatINR(simResult?.outcome?.final_revenue_inr ?? 500000),
        biggest_mistake: simResult?.outcome?.biggest_mistake ?? "Ignored critical product issues.",
        best_decision: simResult?.outcome?.best_decision ?? "Invested in demand analytics.",
        key_lesson: simResult?.outcome?.key_lesson ?? "Move fast but build retention first.",
        timeline_summary: timelineStr,
        competitor_names: compNames
      };

      // Fetch credentials from our backend
      const res = await runSimulateAction({
        data: {
          action: "elevenlabs_signed_url",
          agentId: "agent_2501kv2hf52vef7vp3zpkzy2var5"
        }
      }) as { token: string | null; signedUrl: string | null };

      resRef.current = res;
      dynamicVarsRef.current = dynamicVars;

      if (!res || (!res.token && !res.signedUrl)) {
        throw new Error("Failed to retrieve connection credentials from backend.");
      }

      // Try WebRTC if token is available
      if (res.token) {
        connectionAttemptRef.current = 'webrtc';
        await conversation.startSession({
          conversationToken: res.token
        });
      } else {
        // Otherwise use WebSocket immediately
        connectionAttemptRef.current = 'websocket';
        await conversation.startSession({
          signedUrl: res.signedUrl!,
          connectionType: "websocket"
        });
      }
    } catch (err: any) {
      console.error(err);
      setVoiceError(err.message || "Microphone access is required to make voice calls.");
    }
  };

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setAvatarEmotion(getEmotion(question));

    try {
      const data = await runSimulateAction({
        data: {
          action: "future_founder",
          sessionId,
          idea,
          userQuestion: question,
          chatHistory: messages,
          simResult,
        },
      }) as any;
      const answer = data?.answer || data?.error || "I... I can't remember that part clearly.";

      // Stream word-by-word
      const words = answer.split(" ");
      let displayed = "";
      setMessages(prev => [...prev, { role: "founder", text: "" }]);

      for (let i = 0; i < words.length; i++) {
        displayed += (i > 0 ? " " : "") + words[i];
        const d = displayed;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "founder", text: d };
          return copy;
        });
        await new Promise(r => setTimeout(r, 80));
      }

      setAvatarText(answer);
    } catch {
      setMessages(prev => [...prev, { role: "founder", text: "Something went wrong. The future is... uncertain." }]);
      setAvatarText("Something went wrong.");
      setAvatarEmotion("alert");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(26,23,20,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="relative flex overflow-hidden shadow-paper-lg"
          style={{
            width: 600, height: 460,
            background: "#FAF7F2",
            border: "1px solid rgba(232,96,10,0.3)",
            borderRadius: 16,
          }}
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-3 right-3 z-20 hover:text-orange-600 transition-colors" style={{ color: "#5A5247" }}>
            <X size={20} />
          </button>

          {/* Left - Avatar Column */}
          <div className="w-48 flex-shrink-0 flex flex-col items-center justify-start pt-8 px-2" style={{ background: "#F4EFE5" }}>
            <Suspense fallback={null}>
              <AvatarSystem3D
                text={avatarText}
                emotion={avatarEmotion}
                size={160}
                showSubtitle={false}
                autoSpeak={!isVoiceMode}
              />
            </Suspense>
            <div className="mt-3 text-center">
              <span style={{ fontFamily: "Space Grotesk", fontSize: 12, fontWeight: 700, color: "#1A1714" }}>
                FUTURE FOUNDER
              </span>
              <br />
              <span style={{ fontFamily: "Inter", fontSize: 10, color: "#5A5247" }}>
                5 years from now
              </span>
            </div>
          </div>

          {/* Right - Interactive Chat or Voice Column */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-[#E5DDCB] bg-[#FAF7F2]">
              <button
                onClick={() => {
                  if (isConnected) conversation.endSession();
                  setIsVoiceMode(false);
                }}
                className={`flex-1 py-3 text-[10px] font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all ${!isVoiceMode ? "bg-white text-[#E8600A] font-bold border-b-2 border-[#E8600A]" : "text-[#5A5247]"}`}
                style={{ fontFamily: "Space Grotesk" }}
              >
                <MessageSquare size={12} /> TEXT CONVERSATION
              </button>
              <button
                onClick={() => setIsVoiceMode(true)}
                className={`flex-1 py-3 text-[10px] font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all ${isVoiceMode ? "bg-white text-[#E8600A] font-bold border-b-2 border-[#E8600A]" : "text-[#5A5247]"}`}
                style={{ fontFamily: "Space Grotesk" }}
              >
                <Volume2 size={12} /> VOICE DIALOGUE
              </button>
            </div>

            {/* ── VOICE CALL INTERFACE ── */}
            {isVoiceMode ? (
              <div className="flex-1 flex flex-col items-center justify-between p-6">
                <div className="text-center w-full">
                  <span className="inline-block rounded px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-wider" style={{
                    background: isConnected ? "#EFF6F1" : isConnecting ? "#FCFAF2" : "#FAF7F2",
                    color: isConnected ? "#2D7A4F" : isConnecting ? "#B8860B" : "#5A5247"
                  }}>
                    {isConnected ? "ACTIVE CONVERSATION" : isConnecting ? "CONNECTING SECURE STREAM..." : "VOICE SESSION TERMINATED"}
                  </span>
                </div>

                {/* Pulsing Visual Orb */}
                <PulsingVoiceOrb
                  isConnecting={isConnecting}
                  isConnected={isConnected}
                  isSpeaking={conversation.isSpeaking}
                />

                {voiceError && (
                  <div className="text-center mt-2 max-w-xs">
                    <p className="text-[10px] text-[#C0392B] font-mono leading-relaxed">
                      {voiceError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsVoiceMode(false)}
                      className="mt-2 text-[9px] font-bold text-[#E8600A] underline hover:text-orange-700 transition-colors cursor-pointer"
                      style={{ fontFamily: "Space Grotesk", letterSpacing: "0.5px" }}
                    >
                      SWITCH TO TEXT CONVERSATION
                    </button>
                  </div>
                )}

                {/* Call Controls */}
                <div className="w-full flex justify-center pt-4 border-t border-[#E5DDCB]/50">
                  {isConnected ? (
                    <button
                      onClick={() => conversation.endSession()}
                      className="flex items-center gap-2 rounded-full px-6 py-2.5 text-white bg-[#C0392B] hover:bg-red-700 transition-all font-bold text-xs tracking-wider"
                      style={{ fontFamily: "Space Grotesk" }}
                    >
                      <PhoneOff size={14} /> DISCONNECT CONVERSATION
                    </button>
                  ) : (
                    <button
                      onClick={startVoiceCall}
                      disabled={isConnecting}
                      className="flex items-center gap-2 rounded-full px-6 py-2.5 text-white bg-[#E8600A] hover:bg-orange-600 transition-all font-bold text-xs tracking-wider disabled:opacity-40"
                      style={{ fontFamily: "Space Grotesk" }}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          SECURING TUNNEL...
                        </>
                      ) : (
                        <>
                          <Phone size={14} />
                          CALL FUTURE FOUNDER
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // ── TEXT CHAT ──
              <div className="flex-1 flex flex-col min-h-0">
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <p style={{ fontFamily: "Inter", fontSize: 12, color: "#5A5247" }}>
                        Ask your future self about the failures, mistakes, or decisions.
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className="rounded-xl px-3 py-2 max-w-[85%]"
                        style={{
                          background: msg.role === "user" ? "rgba(232,96,10,0.08)" : "#F4EFE540",
                          border: msg.role === "user" ? "1px solid rgba(232,96,10,0.2)" : "1px solid #E5DDCB",
                          fontFamily: "Inter",
                          fontSize: 11.5,
                          color: "#1A1714",
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex gap-1 px-3 py-2">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: "#E8600A" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Starter Chips */}
                {messages.length === 0 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {STARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        className="px-3 py-1.5 rounded-full transition-colors hover:bg-orange-50"
                        style={{
                          fontFamily: "Inter",
                          fontSize: 10,
                          color: "#E8600A",
                          border: "1px solid rgba(232,96,10,0.3)",
                          background: "transparent",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text Input Form */}
                <div className="p-3 border-t border-[#E5DDCB]" style={{ background: "#FAF7F2" }}>
                  <form
                    onSubmit={e => { e.preventDefault(); ask(input); }}
                    className="flex gap-2"
                  >
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask your future self..."
                      disabled={loading}
                      className="flex-1 px-3 py-2 rounded-lg outline-none bg-white border border-[#E5DDCB] text-xs focus:border-[#E8600A]"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="p-2.5 rounded-lg transition-colors disabled:opacity-40"
                      style={{ background: "#E8600A", color: "white" }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Pulsing Voice Orb ───────────────────────────────────────────────────────
const PulsingVoiceOrb = ({ isConnecting, isConnected, isSpeaking }: { isConnecting: boolean; isConnected: boolean; isSpeaking: boolean }) => {
  return (
    <div className="relative flex items-center justify-center h-44 w-full my-4">
      {isConnected && (
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] } : { scale: [1, 1.2, 1], opacity: [0.3, 0.05, 0.3] }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 1.2 : 2.5, ease: "easeInOut" }}
          className="absolute h-32 w-32 rounded-full pointer-events-none"
          style={{ border: "2px solid #E8600A", filter: "blur(2px)" }}
        />
      )}
      {isConnected && isSpeaking && (
        <motion.div
          animate={{ scale: [1, 1.9, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut", delay: 0.3 }}
          className="absolute h-32 w-32 rounded-full pointer-events-none"
          style={{ border: "1px dashed #E8600A" }}
        />
      )}

      <motion.div
        animate={isConnecting ? { rotate: 360 } : {}}
        transition={isConnecting ? { repeat: Infinity, duration: 2.5, ease: "linear" } : {}}
        className="h-24 w-24 rounded-full flex items-center justify-center shadow-lg relative z-10"
        style={{
          border: isConnected ? "3.5px solid #E8600A" : "3px solid #E5DDCB",
          background: isConnected ? "#FFFDF9" : "#FAF7F2"
        }}
      >
        {isConnecting ? (
          <Loader2 className="animate-spin text-[#E8600A]" size={28} />
        ) : isConnected ? (
          <motion.span
            animate={isSpeaking ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="text-4xl"
          >
            🚀
          </motion.span>
        ) : (
          <span className="text-4xl grayscale opacity-75">🚀</span>
        )}
      </motion.div>
    </div>
  );
};

// ─── Exported wrapper that provides the ConversationProvider context ──────────
// The client-only guard prevents ConversationProvider (which uses useLayoutEffect)
// from running during SSR, avoiding "cannot call useLayoutEffect in server" errors.
export function FutureFounder(props: FutureFounderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <ConversationProvider>
      <FutureFounderInner {...props} />
    </ConversationProvider>
  );
}

export default FutureFounder;
