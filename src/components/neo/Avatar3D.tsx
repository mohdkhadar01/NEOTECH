import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function Head() {
  const inner = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (inner.current) inner.current.rotation.y = t * 0.3;
    if (wire.current) {
      wire.current.rotation.y = t * 0.3;
      wire.current.rotation.x = Math.sin(t * 0.4) * 0.1;
    }
    if (glow.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.04;
      glow.current.scale.setScalar(s);
    }
  });
  return (
    <group>
      {/* Soft inner glow */}
      <mesh ref={glow}>
        <sphereGeometry args={[1.42, 48, 48]} />
        <meshBasicMaterial color="#FFB37A" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Core orb */}
      <mesh ref={inner}>
        <sphereGeometry args={[1.46, 64, 64]} />
        <meshStandardMaterial color="#FFE5CC" emissive="#E8600A" emissiveIntensity={0.25} roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Orange wireframe */}
      <mesh ref={wire}>
        <sphereGeometry args={[1.5, 28, 28]} />
        <meshBasicMaterial color="#E8600A" wireframe transparent opacity={0.65} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.42, 0.18, 1.33]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#1A1714" />
      </mesh>
      <mesh position={[0.42, 0.18, 1.33]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#1A1714" />
      </mesh>
    </group>
  );
}

function Rings() {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) {
      r1.current.rotation.x = t * 0.5;
      r1.current.rotation.z = Math.sin(t * 0.3) * 0.2;
    }
    if (r2.current) r2.current.rotation.z = -t * 0.4;
    if (r3.current) {
      r3.current.rotation.y = t * 0.6;
      r3.current.rotation.x = Math.PI / 3;
    }
  });
  return (
    <>
      <mesh ref={r1}>
        <torusGeometry args={[2.05, 0.025, 8, 120]} />
        <meshBasicMaterial color="#E8600A" transparent opacity={0.85} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[2.45, 0.018, 8, 120]} />
        <meshBasicMaterial color="#FFB800" transparent opacity={0.6} />
      </mesh>
      <mesh ref={r3}>
        <torusGeometry args={[2.85, 0.012, 8, 120]} />
        <meshBasicMaterial color="#E8600A" transparent opacity={0.35} />
      </mesh>
    </>
  );
}

function Thoughts({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.0 + Math.random() * 1.4;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.18;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.4) * 0.15;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#E8600A" size={0.055} transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

export default function Avatar3D({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[3, 3, 3]} color="#E8600A" intensity={1.8} />
          <pointLight position={[-3, -2, 3]} color="#FFB800" intensity={1.0} />
          <Head />
          <Rings />
          <Thoughts />
        </Suspense>
      </Canvas>
    </div>
  );
}
