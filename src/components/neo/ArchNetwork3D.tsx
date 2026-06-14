import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";

const NODES: [number, number, number][] = [
  [-2.4, 0, 0],
  [-0.8, 0.2, 0],
  [0.8, -0.2, 0],
  [2.4, 0, 0],
];

function Network() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.3;
  });
  return (
    <group ref={ref}>
      {NODES.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#E8600A" emissive="#E8600A" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {NODES.slice(0, -1).map((p, i) => {
        const next = NODES[i + 1];
        const positions = new Float32Array([...p, ...next]);
        return (
          <line key={`l-${i}`}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#1A1714" transparent opacity={0.5} />
          </line>
        );
      })}
    </group>
  );
}

export default function ArchNetwork3D({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0.4, 5], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <pointLight position={[0, 3, 3]} intensity={1.6} color="#E8600A" />
          <Network />
        </Suspense>
      </Canvas>
    </div>
  );
}
