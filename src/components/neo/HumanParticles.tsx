import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function buildHumanShape(count: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const r = Math.random();
    if (r < 0.15) {
      const a = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const rad = 0.35;
      x = rad * Math.sin(ph) * Math.cos(a);
      y = 1.2 + rad * Math.cos(ph);
      z = rad * Math.sin(ph) * Math.sin(a);
    } else if (r < 0.55) {
      x = (Math.random() - 0.5) * 0.7;
      y = (Math.random() - 0.5) * 1.2 + 0.2;
      z = (Math.random() - 0.5) * 0.3;
    } else if (r < 0.75) {
      const side = Math.random() < 0.5 ? -1 : 1;
      x = side * (0.4 + Math.random() * 0.6);
      y = 0.5 - Math.random() * 1.0;
      z = (Math.random() - 0.5) * 0.2;
    } else {
      const side = Math.random() < 0.5 ? -1 : 1;
      x = side * (0.15 + Math.random() * 0.15);
      y = -1.0 - Math.random() * 1.0;
      z = (Math.random() - 0.5) * 0.2;
    }
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
}

function Body({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => buildHumanShape(600), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.3;
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.045} transparent opacity={0.95} />
    </points>
  );
}

export default function HumanParticles({ color = "#1A1714", className = "" }: { color?: string; className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <Body color={color} />
        </Suspense>
      </Canvas>
    </div>
  );
}
