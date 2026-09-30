import { useEffect, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { atrium } from "../data/museum";
import { exhibition } from "../data/config";
import { gallery } from "./GalleryMaterial";

function makeArtwork() {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 896;
  const c = canvas.getContext("2d")!;
  c.strokeStyle = "#CFBA8D";
  c.lineWidth = 5;
  // Paired scrolls echo the ornament on the yurt, without adding unrelated objects.
  for (const side of [-1, 1]) {
    c.save();
    c.translate(768, 148);
    c.scale(side, 1);
    c.beginPath();
    c.moveTo(28, 0);
    c.lineTo(390, 0);
    c.bezierCurveTo(445, 0, 462, -56, 422, -70);
    c.bezierCurveTo(388, -83, 368, -38, 400, -30);
    c.moveTo(244, 0);
    c.bezierCurveTo(290, 0, 307, 49, 269, 57);
    c.bezierCurveTo(239, 64, 230, 26, 254, 24);
    c.stroke();
    c.restore();
  }
  c.beginPath();
  c.moveTo(768, 127);
  c.lineTo(789, 148);
  c.lineTo(768, 169);
  c.lineTo(747, 148);
  c.closePath();
  c.stroke();
  c.textAlign = "center";
  c.fillStyle = "#F3F0E9";
  c.font = '500 148px "Noto Serif Variable"';
  c.fillText(exhibition.title, 768, 340);
  c.fillStyle = gallery.gold;
  c.fillRect(632, 390, 272, 3);
  c.font = '500 64px "Noto Serif Variable"';
  c.fillStyle = "#F3F0E9";
  c.fillText(atrium.names.kk, 768, 510);
  c.font = '400 42px "Noto Serif Variable"';
  c.fillText(atrium.names.ru, 768, 574);
  c.fillStyle = "#D7C59D";
  c.font = '400 43px "Noto Serif Variable"';
  c.fillText("25 қазан — Республика күні", 768, 720);
  c.font = '400 28px "Noto Serif Variable"';
  c.fillText("25 октября — День Республики", 768, 765);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function AtriumBackdrop() {
  const { invalidate, gl } = useThree();
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let active = true;
    const draw = () => {
      if (!active) return;
      const texture = makeArtwork();
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      setMap(texture);
    };
    const text = `${exhibition.title} ${atrium.names.kk} ${atrium.names.ru} қазан`;
    Promise.all([
      document.fonts.load('500 132px "Noto Serif Variable"', text),
      document.fonts.load('400 42px "Noto Serif Variable"', text),
    ]).then(draw, draw);
    return () => {
      active = false;
    };
  }, [gl]);
  useLayoutEffect(() => {
    if (!map) return;
    map.needsUpdate = true;
    invalidate();
    return () => map.dispose();
  }, [map, invalidate]);
  return map ? (
    <mesh position={[0, 4.15, -11.745]} name="atrium-artwork">
      <planeGeometry args={[8, (8 * 896) / 1536]} />
      <meshBasicMaterial
        map={map}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  ) : null;
}
