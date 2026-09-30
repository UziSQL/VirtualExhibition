import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelShowcase } from "./Models";
export default function ModelViewer({ kind }: { kind: "dombra" | "yurt" }) {
  const [angle, setAngle] = useState(0);
  return (
    <div className="model-viewer">
      <div className="model-canvas">
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [0, 1, 3.8], fov: 45 }}
        >
          <ambientLight intensity={2} />
          <directionalLight position={[3, 4, 3]} intensity={3} />
          <ModelShowcase kind={kind} angle={angle} />
          <OrbitControls enablePan={false} minDistance={2.3} maxDistance={6} />
        </Canvas>
      </div>
      <label className="model-range">
        Повернуть экспонат{" "}
        <input
          aria-label="Поворот модели"
          type="range"
          min="0"
          max="6.28"
          step=".02"
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </label>
      <p className="fineprint">
        Вращайте мышью или пальцем. Стилизованная модель.
      </p>
    </div>
  );
}
