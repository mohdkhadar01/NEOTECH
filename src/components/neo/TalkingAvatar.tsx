import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { runTtsAction } from "../../lib/api/simulate.functions";

const EMOTION_COLORS: Record<string, string> = {
  neutral: "#E8600A",
  alert: "#C0392B",
  happy: "#2D7A4F",
  serious: "#FFB800",
};

function Head({ emotion, isSpeaking }: { emotion: string; isSpeaking: boolean }) {
  const headRef = useRef<THREE.Group>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const leftEyeRef = useRef<THREE.Mesh>(null!);
  const rightEyeRef = useRef<THREE.Mesh>(null!);
  const blinkTimer = useRef(0);
  const mouthTimer = useRef(0);
  const { pointer } = useThree();
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  useFrame((_, delta) => {
    // Mouse parallax
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, pointer.x * 0.26, 0.05);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -pointer.y * 0.18, 0.05);
    }

    // Blink
    blinkTimer.current += delta;
    if (blinkTimer.current > 4) {
      blinkTimer.current = 0;
    }
    const blinkPhase = blinkTimer.current > 3.85 && blinkTimer.current < 4;
    const eyeScaleY = blinkPhase ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, eyeScaleY, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, eyeScaleY, 0.3);

    // Mouth
    if (mouthRef.current) {
      mouthTimer.current += delta;
      if (isSpeaking && mouthTimer.current > 0.12) {
        mouthTimer.current = 0;
        mouthRef.current.scale.y = 0.4 + Math.random() * 1.2;
      } else if (!isSpeaking) {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.3, 0.1);
      }
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={headRef}>
        {/* Head sphere */}
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial color="#1A1714" roughness={0.85} />
        </mesh>
        {/* Wireframe overlay */}
        <mesh>
          <sphereGeometry args={[0.92, 16, 16]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
        </mesh>
        {/* Left eye */}
        <mesh ref={leftEyeRef} position={[-0.28, 0.18, 0.78]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSpeaking ? 2.5 : 1.2} />
        </mesh>
        {/* Right eye */}
        <mesh ref={rightEyeRef} position={[0.28, 0.18, 0.78]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSpeaking ? 2.5 : 1.2} />
        </mesh>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.2, 0.82]}>
          <capsuleGeometry args={[0.06, 0.18, 8, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSpeaking ? 1.8 : 0.5} />
        </mesh>
        {/* Ring 1 */}
        <mesh rotation={[0.4, 0, 0.2]}>
          <torusGeometry args={[1.25, 0.012, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        {/* Ring 2 */}
        <mesh rotation={[-0.3, 0.8, 0]}>
          <torusGeometry args={[1.35, 0.01, 8, 64]} />
          <meshBasicMaterial color="#FFB37A" transparent opacity={0.3} />
        </mesh>
        {/* Orbit particles */}
        <OrbitParticles color={color} active={isSpeaking} />
      </group>
    </Float>
  );
}

function OrbitParticles({ color, active }: { color: string; active: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * 1.5;
      arr[i * 3 + 1] = Math.sin(a) * 0.4;
      arr[i * 3 + 2] = Math.sin(a) * 1.5;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * (active ? 0.8 : 0.2);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} sizeAttenuation transparent opacity={active ? 0.9 : 0.4} />
    </points>
  );
}

export function TalkingAvatar({
  text = "",
  emotion = "neutral",
  autoSpeak = true,
  size = 240,
  showSubtitle = true,
}: {
  text?: string;
  emotion?: "neutral" | "alert" | "happy" | "serious";
  autoSpeak?: boolean;
  size?: number;
  showSubtitle?: boolean;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (t: string) => {
    if (!t || t.length < 3) return;
    setIsSpeaking(true);
    try {
      const result = await runTtsAction({ data: { text: t } });
      if (result.audio) {
        const binary = atob(result.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: result.contentType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { fallbackSpeak(t); URL.revokeObjectURL(url); };
        await audio.play();
        return;
      }
    } catch { /* fall through to fallback */ }
    fallbackSpeak(t);
  }, []);

  const fallbackSpeak = useCallback((t: string) => {
    if (!("speechSynthesis" in window)) { setIsSpeaking(false); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(t);
    utter.rate = 1; utter.pitch = 0.85;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => {
    if (autoSpeak && text && text !== lastSpokenRef.current) {
      lastSpokenRef.current = text;
      speak(text);
    }
  }, [text, autoSpeak, speak]);

  const handleClick = () => {
    if (lastSpokenRef.current) speak(lastSpokenRef.current);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{ width: size, height: size, cursor: "pointer" }}
        onClick={handleClick}
        title="Click to replay"
      >
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} style={{ background: "transparent" }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 3, 5]} intensity={0.8} />
          <Head emotion={emotion} isSpeaking={isSpeaking} />
        </Canvas>
      </div>

      {/* Speaking waveform */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-end gap-1"
            style={{ height: 16 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 14, 6, 12, 4] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1, ease: "easeInOut" }}
                style={{ width: 3, borderRadius: 2, background: "#E8600A" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle */}
      {showSubtitle && text && (
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xs text-center rounded-full px-4 py-1.5"
          style={{
            background: "#F4EFE5",
            border: "1px solid #E8600A",
            color: "#1A1714",
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}

export default TalkingAvatar;
