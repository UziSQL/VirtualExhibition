export function Yurt({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.96, 48]} />
        <meshStandardMaterial color="#e6dcc5" roughness={0.94} />
      </mesh>
      <mesh position={[0, 1.14, 0]} castShadow>
        <coneGeometry args={[0.93, 0.46, 48]} />
        <meshStandardMaterial color="#e9dfc7" roughness={0.92} />
      </mesh>
      {[0.12, 0.79].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.911, 0.911, 0.08, 48]} />
          <meshStandardMaterial color="#94644b" />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.907]}>
        <boxGeometry args={[0.37, 0.7, 0.03]} />
        <meshStandardMaterial color="#78523b" />
      </mesh>
      <mesh position={[0, 1.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.03, 8, 32]} />
        <meshStandardMaterial color="#9b7850" />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i * Math.PI) / 10) * 0.913,
            0.54,
            Math.cos((i * Math.PI) / 10) * 0.913,
          ]}
          rotation={[0, (i * Math.PI) / 10, Math.PI / 4]}
        >
          <boxGeometry args={[0.1, 0.1, 0.018]} />
          <meshStandardMaterial color="#af7c50" />
        </mesh>
      ))}
    </group>
  );
}
export function Dombra() {
  return (
    <group rotation={[0, 0, -0.2]}>
      <mesh position={[0, -0.4, 0]} scale={[0.43, 0.61, 0.16]} castShadow>
        <sphereGeometry args={[1, 28, 24]} />
        <meshStandardMaterial color="#94552c" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.4, 0.12]} scale={[0.38, 0.54, 0.06]}>
        <sphereGeometry args={[1, 28, 24]} />
        <meshStandardMaterial color="#deb776" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.57, 0]}>
        <boxGeometry args={[0.13, 1.55, 0.1]} />
        <meshStandardMaterial color="#654126" />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[0.18, 0.25, 0.12]} />
        <meshStandardMaterial color="#805332" />
      </mesh>
      <mesh position={[0, -0.21, 0.186]}>
        <circleGeometry args={[0.05, 24]} />
        <meshBasicMaterial color="#342219" />
      </mesh>
      {[-0.024, 0.024].map((x) => (
        <mesh key={x} position={[x, 0.38, 0.19]}>
          <boxGeometry args={[0.005, 2.1, 0.006]} />
          <meshStandardMaterial color="#eee0bb" />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.12, 0.063]}>
          <boxGeometry args={[0.14, 0.012, 0.015]} />
          <meshStandardMaterial color="#d6b77b" />
        </mesh>
      ))}
    </group>
  );
}
export function ModelShowcase({
  kind,
  angle,
}: {
  kind: "dombra" | "yurt";
  angle: number;
}) {
  return (
    <group
      rotation={[0, angle, 0]}
      position={[0, kind === "yurt" ? -0.7 : 0, 0]}
    >
      {kind === "dombra" ? <Dombra /> : <Yurt />}
    </group>
  );
}
