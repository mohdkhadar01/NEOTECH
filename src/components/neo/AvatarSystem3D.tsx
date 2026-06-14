import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { runTtsAction } from '../../lib/api/simulate.functions';

const EMOTION_COLORS: Record<string, string> = {
  neutral: '#E8600A',
  alert: '#C0392B',
  happy: '#2D7A4F',
  serious: '#FFB800',
  excited: '#8B5CF6',
};

function AvatarHead({ emotion, isSpeaking }: { emotion: string; isSpeaking: boolean }) {
  const headRef = useRef<THREE.Group>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const leftEyeRef = useRef<THREE.Mesh>(null!);
  const rightEyeRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const scanRef = useRef<THREE.Mesh>(null!);
  const blinkTimer = useRef(0);
  const blinkInterval = useRef(3 + Math.random() * 2);
  const mouthTimer = useRef(0);
  const { pointer } = useThree();
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Mouse parallax — max ±12 degrees
    if (headRef.current) {
      const maxRot = (12 * Math.PI) / 180;
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y, pointer.x * maxRot, 0.05
      );
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x, -pointer.y * maxRot, 0.05
      );
    }

    // Blink every 3-5 seconds
    blinkTimer.current += delta;
    if (blinkTimer.current > blinkInterval.current) {
      blinkTimer.current = 0;
      blinkInterval.current = 3 + Math.random() * 2;
    }
    const inBlink = blinkTimer.current > blinkInterval.current - 0.15;
    const eyeY = inBlink ? 0.05 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, eyeY, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, eyeY, 0.3);

    // Mouth animation
    if (mouthRef.current) {
      mouthTimer.current += delta;
      if (isSpeaking) {
        if (mouthTimer.current > 0.08 + Math.random() * 0.07) {
          mouthTimer.current = 0;
          mouthRef.current.scale.y = 0.3 + Math.random() * 1.5;
        }
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.4, 0.25);
      }
    }

    // Orbiting rings
    const speakPulse = isSpeaking ? 1 + Math.sin(t * 8) * 0.04 : 1;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += 0.007;
      ring1Ref.current.scale.setScalar(speakPulse);
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += 0.005;
      ring2Ref.current.scale.setScalar(speakPulse);
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z -= 0.004;
      ring3Ref.current.scale.setScalar(speakPulse);
    }

    // Holographic scan line
    if (scanRef.current) {
      const scanY = ((t % 3) / 3) * 3.2 - 1.6;
      scanRef.current.position.y = scanY;
    }
  });

  const emissiveIntensity = isSpeaking ? 3 : 1.5;

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
      <group ref={headRef}>
        {/* Head sphere */}
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color="#1A1714" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Wireframe overlay */}
        <mesh>
          <sphereGeometry args={[1.52, 12, 12]} />
          <meshBasicMaterial color="#E8600A" wireframe transparent opacity={0.18} />
        </mesh>

        {/* Left eye */}
        <mesh ref={leftEyeRef} position={[-0.32, 0.22, 1.38]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* Right eye */}
        <mesh ref={rightEyeRef} position={[0.32, 0.22, 1.38]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.3, 1.38]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.07, 0.35, 8, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSpeaking ? 2 : 0.8} />
        </mesh>

        {/* Ring 1 */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.1, 0.02, 8, 80]} />
          <meshBasicMaterial color="#E8600A" transparent opacity={0.5} />
        </mesh>
        {/* Ring 2 */}
        <mesh ref={ring2Ref}>
          <torusGeometry args={[2.5, 0.015, 8, 80]} />
          <meshBasicMaterial color="#FFB800" transparent opacity={0.3} />
        </mesh>
        {/* Ring 3 */}
        <mesh ref={ring3Ref}>
          <torusGeometry args={[1.8, 0.01, 8, 80]} />
          <meshStandardMaterial color="#1A1714" emissive="#E8600A" emissiveIntensity={0.5} transparent opacity={0.2} />
        </mesh>

        {/* Speaking particles */}
        <SpeakingParticles color={color} active={isSpeaking} />

        {/* Holographic scan line */}
        <mesh ref={scanRef} position={[0, 0, 0]}>
          <planeGeometry args={[3, 0.02]} />
          <meshBasicMaterial color="#E8600A" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>
  );
}

function SpeakingParticles({ color, active }: { color: string; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const opacityRef = useRef(0);
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);

  const phases = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, active ? 1 : 0, 0.1);

    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = phases[i];
      mesh.position.x = Math.cos(t * 1.5 + phase) * 2;
      mesh.position.y = Math.sin(t * 2 + phase) * 0.6;
      mesh.position.z = Math.sin(t * 1.5 + phase) * 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacityRef.current;
    });
  });

  return (
    <group ref={groupRef}>
      {phases.map((_, i) => (
        <mesh key={i} ref={(el) => { particleRefs.current[i] = el; }}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function AvatarLighting() {
  return (
    <>
      <pointLight position={[2, 2, 3]} intensity={1.5} color="white" />
      <pointLight position={[-2, -1, 2]} intensity={1} color="#E8600A" />
      <ambientLight intensity={0.4} />
      <spotLight position={[0, 4, 2]} intensity={0.8} angle={0.5} penumbra={0.5} />
    </>
  );
}

let currentActiveAudio: HTMLAudioElement | null = null;
let latestSpeakRequestId = 0;

async function speak(
  text: string,
  onStart: () => void,
  onEnd: () => void
) {
  const thisRequestId = ++latestSpeakRequestId;

  // Stop and clear any ongoing audio
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
    } catch (e) {
      console.warn('[TTS] failed to pause previous audio:', e);
    }
    currentActiveAudio = null;
  }

  // Cancel any ongoing browser SpeechSynthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  onStart();
  try {
    const result = await runTtsAction({ data: { text } });
    if (thisRequestId !== latestSpeakRequestId) {
      onEnd();
      return;
    }

    if (result.audio) {
      const binary = atob(result.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: result.contentType || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentActiveAudio = audio;

      audio.onended = () => { 
        if (currentActiveAudio === audio) currentActiveAudio = null;
        onEnd(); 
        URL.revokeObjectURL(url); 
      };
      audio.onerror = () => { 
        if (currentActiveAudio === audio) currentActiveAudio = null;
        fallbackSpeak(text, onEnd); 
        URL.revokeObjectURL(url); 
      };
      await audio.play();
      return;
    }
    throw new Error('no audio');
  } catch {
    if (thisRequestId !== latestSpeakRequestId) {
      onEnd();
      return;
    }
    fallbackSpeak(text, onEnd);
  }
}


function fallbackSpeak(text: string, onEnd: () => void) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 0.85;
    u.onend = onEnd;
    u.onerror = onEnd;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } else {
    onEnd();
  }
}

export interface AvatarSystemProps {
  text?: string;
  emotion?: 'neutral' | 'alert' | 'happy' | 'serious' | 'excited';
  autoSpeak?: boolean;
  size?: number;
  showSubtitle?: boolean;
  className?: string;
}

export function AvatarSystem3D({
  text = '',
  emotion = 'neutral',
  autoSpeak = true,
  size = 240,
  showSubtitle = true,
  className = '',
}: AvatarSystemProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenRef = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetIsSpeaking = useCallback((val: boolean) => {
    if (isMountedRef.current) {
      setIsSpeaking(val);
    }
  }, []);

  const doSpeak = useCallback((t: string) => {
    if (!t || t.length < 3) return;
    speak(t, () => safeSetIsSpeaking(true), () => safeSetIsSpeaking(false));
  }, [safeSetIsSpeaking]);

  useEffect(() => {
    if (autoSpeak && text && text !== lastSpokenRef.current) {
      lastSpokenRef.current = text;
      doSpeak(text);
    }
    return () => {
      // Stop ongoing speaking when component unmounts or text changes
      if (currentActiveAudio) {
        try {
          currentActiveAudio.pause();
          currentActiveAudio.currentTime = 0;
        } catch (e) {}
        currentActiveAudio = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, autoSpeak, doSpeak]);

  const handleReplay = () => {
    if (lastSpokenRef.current) doSpeak(lastSpokenRef.current);
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        style={{ width: size, height: size, cursor: 'pointer' }}
        onClick={handleReplay}
        title="Click to replay"
      >
        <Canvas
          camera={{ position: [0, 0, 6], fov: 40 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true }}
        >
          <AvatarLighting />
          <AvatarHead emotion={emotion} isSpeaking={isSpeaking} />
        </Canvas>
      </div>

      {/* Speaking waveform */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-end gap-[3px]"
            style={{ height: 18 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [3, 16, 6, 14, 3] }}
                transition={{ repeat: Infinity, duration: 0.55, delay: i * 0.08, ease: 'easeInOut' }}
                style={{ width: 3, borderRadius: 2, background: '#E8600A' }}
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
          transition={{ duration: 0.3 }}
          onClick={handleReplay}
          className="cursor-pointer"
          style={{
            background: '#F4EFE5',
            border: '1px solid rgba(232,96,10,0.3)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#1A1714',
            maxWidth: 280,
            textAlign: 'center',
            padding: '6px 14px',
            borderRadius: 99,
            lineHeight: 1.4,
          }}
        >
          {isSpeaking ? '▶ ' : ''}{text}
        </motion.div>
      )}
    </div>
  );
}

export default AvatarSystem3D;
