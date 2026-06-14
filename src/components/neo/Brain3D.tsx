import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function WireSphere({ radius, detail, color, opacity, speed, axis = "y" }: { radius: number; detail: number; color: string; opacity: number; speed: number; axis?: "x" | "y" | "z" }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    if (axis === "y") ref.current.rotation.y += speed;
    if (axis === "x") ref.current.rotation.x += speed;
    if (axis === "z") ref.current.rotation.z += speed;
    ref.current.rotation.x += speed * 0.3;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[radius, detail]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}

function Nodes({ count = 100 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 2.05;
      arr.push([
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ]);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 0.15;
    group.current.children.forEach((m, i) => {
      const s = 1 + Math.sin(clock.elapsedTime * 2 + i) * 0.3;
      m.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={i % 4 === 0 ? "#B8860B" : "#E8600A"} />
        </mesh>
      ))}
    </group>
  );
}

export default function Brain3D({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          {/* Ink-colored wireframe — reads like technical diagram on paper */}
          <WireSphere radius={2} detail={3} color="#1A1714" opacity={0.32} speed={0.003} />
          <WireSphere radius={2.4} detail={2} color="#E8600A" opacity={0.18} speed={-0.0018} axis="x" />
          <WireSphere radius={1.5} detail={4} color="#1A1714" opacity={0.18} speed={0.005} axis="z" />
          <Nodes count={110} />
          <OrbitControls autoRotate autoRotateSpeed={0.6} enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
