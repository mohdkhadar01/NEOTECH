import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Shard({ color, position, speed }: { color: string; position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.x = t * speed;
    ref.current.rotation.y = t * speed * 1.3;
    ref.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.2;
  });
  return (
    <mesh ref={ref} position={position}>
      <tetrahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} metalness={0.7} transparent opacity={0.95} />
    </mesh>
  );
}

export default function Prism3D({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <pointLight position={[3, 3, 3]} intensity={1.6} color="#B8860B" />
          <pointLight position={[-3, -2, 2]} intensity={1.2} color="#E8600A" />
          <Shard color="#B8860B" position={[-0.6, 0.3, 0]} speed={0.8} />
          <Shard color="#E8600A" position={[0.6, -0.2, 0.3]} speed={-0.6} />
          <Shard color="#1A1714" position={[0.0, 0.6, -0.4]} speed={0.5} />
          <Shard color="#C9A84C" position={[0.2, -0.5, 0.5]} speed={-0.7} />
        </Suspense>
      </Canvas>
    </div>
  );
}
