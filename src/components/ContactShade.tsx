import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Static soft contact occlusion, also available when mobile shadow maps are off. */
export function ContactShade({
  x,
  z,
  width,
  depth,
  round = false,
  opacity = 0.2,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  round?: boolean;
  opacity?: number;
}) {
  const softness = 0.38;
  const w = width + softness * 2,
    d = depth + softness * 2;
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(1024, Math.max(64, Math.ceil(w * 64)));
    canvas.height = Math.min(1024, Math.max(64, Math.ceil(d * 64)));
    const c = canvas.getContext("2d")!;
    const pixels = c.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const px = ((x + 0.5) / canvas.width - 0.5) * w;
        const pz = ((y + 0.5) / canvas.height - 0.5) * d;
        const distance = round
          ? Math.max(0, Math.hypot(px, pz) - width / 2)
          : Math.hypot(
              Math.max(0, Math.abs(px) - width / 2),
              Math.max(0, Math.abs(pz) - depth / 2),
            );
        const i = (y * canvas.width + x) * 4;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
        pixels.data[i + 3] = 255 * Math.exp(-Math.pow(distance / 0.16, 2));
      }
    c.putImageData(pixels, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }, [width, depth, round, w, d]);
  useEffect(() => {
    map.needsUpdate = true;
    return () => map.dispose();
  }, [map]);
  return (
    <mesh
      position={[x, 0.016, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => {}}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial
        map={map}
        color="#393A39"
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
