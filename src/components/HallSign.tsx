import { useEffect, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { NamedPlace } from "../data/museum";
import { gallery } from "./GalleryMaterial";

const primaryFont = '500 72px "Noto Serif Variable"';
const secondaryFont = '400 48px "Noto Serif Variable"';
const alphabet = "Ә Ғ Қ Ң Ө Ұ Ү Һ І ә ғ қ ң ө ұ ү һ і";

function linesFor(c: CanvasRenderingContext2D, text: string) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && c.measureText(next).width > 912) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return [...lines, line];
}

function makeSign(place: NamedPlace) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  const c = canvas.getContext("2d")!;
  const primary = `${place.number ? place.number + "  " : ""}${place.names.kk}`;
  c.font = primaryFont;
  const kk = linesFor(c, primary);
  c.font = secondaryFont;
  const ru = linesFor(c, place.names.ru);
  canvas.height = 44 + kk.length * 92 + 20 + ru.length * 62 + 32;
  c.fillStyle = gallery.panel;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = gallery.gold;
  c.fillRect(24, 16, 976, 4);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = gallery.text;
  c.font = primaryFont;
  kk.forEach((line, i) => c.fillText(line, 512, 44 + i * 92 + 46));
  c.fillStyle = "#4D4D48";
  c.font = secondaryFont;
  ru.forEach((line, i) =>
    c.fillText(line, 512, 44 + kk.length * 92 + 20 + i * 62 + 31),
  );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, aspect: canvas.height / canvas.width };
}

export function HallSign({
  place,
  position,
  rotation = 0,
  width = 3.2,
}: {
  place: NamedPlace;
  position: [number, number, number];
  rotation?: number;
  width?: number;
}) {
  const { gl, invalidate } = useThree();
  const [sign, setSign] = useState<ReturnType<typeof makeSign> | null>(null);
  useEffect(() => {
    let active = true;
    const draw = () => {
      if (!active) return;
      const next = makeSign(place);
      next.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      setSign(next);
    };
    // Canvas has no automatic font reflow: paint only after both subsets load.
    const text = `${place.names.kk} ${place.names.ru} ${alphabet}`;
    Promise.all([
      document.fonts.load(primaryFont, text),
      document.fonts.load(secondaryFont, text),
    ]).then(draw, draw);
    return () => {
      active = false;
    };
  }, [place, gl]);
  useLayoutEffect(() => {
    if (!sign) return;
    sign.texture.needsUpdate = true;
    invalidate();
    return () => sign.texture.dispose();
  }, [sign, invalidate]);
  if (!sign) return null;
  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      name={`hall-sign-${place.id}`}
      userData={{
        hallSign: place.id,
        primary: place.names.kk,
        secondary: place.names.ru,
      }}
    >
      <planeGeometry args={[width, width * sign.aspect]} />
      <meshBasicMaterial
        map={sign.texture}
        color="#ffffff"
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}
