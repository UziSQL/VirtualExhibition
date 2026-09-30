import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const gallery = {
  wall: "#F3F0E9",
  ceiling: "#FAFAFA",
  stone: "#DDD8CE",
  // Compensated for the stronger overhead light; the rendered floor is grey-beige.
  floor: "#C4C0B7",
  joint: "#B5B0A6",
  gold: "#B99A59",
  accent: "#23474C",
  panel: "#FFFFFF",
  text: "#292B2D",
  secondary: "#62625D",
};

const Surfaces = createContext<{
  stone: THREE.CanvasTexture;
  environment: THREE.Texture | null;
} | null>(null);

function stoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d")!;
  const pixels = c.createImageData(256, 256);
  // Low-amplitude, seamless mineral variation; no high-contrast marble veins.
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const u = (x / 256) * Math.PI * 2,
        v = (y / 256) * Math.PI * 2;
      const value =
        128 +
        8 * Math.sin(u * 3 + Math.sin(v * 2)) +
        5 * Math.cos(v * 7 - Math.sin(u * 5)) +
        2 * Math.sin(u * 41 + v * 37);
      const i = (y * 256 + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
  c.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

export function GallerySurfaces({ children }: { children: ReactNode }) {
  const { gl, scene, invalidate } = useThree();
  const stone = useMemo(stoneTexture, []);
  const [environment, setEnvironment] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    stone.needsUpdate = true;
    stone.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    // A small, locally generated studio map supplies broad metallic reflections.
    const studio = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    const target = generator.fromScene(studio, 0.06, 0.1, 100, { size: 128 });
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = target.texture;
    scene.environmentIntensity = 0.25;
    setEnvironment(target.texture);
    invalidate();
    studio.dispose();
    generator.dispose();
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
      target.dispose();
      stone.dispose();
    };
  }, [gl, scene, stone, invalidate]);
  return (
    <Surfaces.Provider value={{ stone, environment }}>
      {children}
    </Surfaces.Provider>
  );
}

export function GalleryMaterial({
  color = gallery.wall,
  gold = false,
  stone = false,
}: {
  color?: string;
  gold?: boolean;
  stone?: boolean;
}) {
  const surfaces = useContext(Surfaces);
  return (
    <meshStandardMaterial
      color={gold ? gallery.gold : color}
      roughness={gold ? 0.42 : stone ? 0.78 : 0.9}
      metalness={gold ? 0.45 : 0}
      envMap={surfaces?.environment}
      envMapIntensity={gold ? 1 : stone ? 0.22 : 0.7}
      bumpMap={stone ? surfaces?.stone : undefined}
      bumpScale={stone ? 0.015 : 0}
    />
  );
}
