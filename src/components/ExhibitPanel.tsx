import { useEffect, useLayoutEffect, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { asset, type Exhibit } from "../data/museum";
import { gallery, GalleryMaterial } from "./GalleryMaterial";

export type ImageStatus = "loading" | "loaded" | "error";
type Surface = {
  texture: THREE.CanvasTexture;
  width: number;
  height: number;
  status: ImageStatus;
};

function wrapText(c: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && c.measureText(next).width > width) {
      result.push(line);
      line = word;
    } else line = next;
  }
  result.push(line);
  return result;
}

function createSurface(
  exhibit: Exhibit,
  status: ImageStatus,
  image?: HTMLImageElement,
): Surface {
  const aspect = image ? image.naturalWidth / image.naturalHeight : 1.5;
  const photoHeight = Math.round(992 / Math.max(0.65, aspect));
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  const c = canvas.getContext("2d")!;
  c.font = "bold 56px Georgia, serif";
  const title = wrapText(c, exhibit.title, 952);
  c.font = "30px Arial";
  const caption = wrapText(c, exhibit.imageCaption || exhibit.caption, 952);
  // Adaptive caption height keeps the image at about 65–80% without cropping.
  const footerHeight = Math.max(
    184 + (title.length - 1) * 62 + (caption.length - 1) * 36,
    Math.ceil(photoHeight * 0.23),
  );
  canvas.height = photoHeight + footerHeight;
  c.fillStyle = gallery.panel;
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (image) {
    const scale = Math.min(
      992 / image.naturalWidth,
      photoHeight / image.naturalHeight,
    );
    const w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    c.drawImage(image, 16 + (992 - w) / 2, 16 + (photoHeight - h) / 2, w, h);
  } else {
    c.fillStyle = "#f4f3ef";
    c.fillRect(16, 16, 992, photoHeight);
    c.fillStyle = gallery.text;
    c.font = "38px Arial";
    c.textAlign = "center";
    c.fillText(
      status === "error"
        ? "Изображение не загрузилось"
        : "Загружаем изображение…",
      512,
      photoHeight / 2 - 20,
    );
    if (status === "error") {
      c.font = "28px Arial";
      c.fillText(
        "Нажмите «Повторить загрузку изображений»",
        512,
        photoHeight / 2 + 34,
      );
    }
    c.textAlign = "left";
  }
  const kind =
    exhibit.imageKind === "illustration"
      ? "ИЛЛЮСТРАЦИЯ"
      : exhibit.imageKind === "timeline"
        ? "ХРОНОЛОГИЯ"
        : exhibit.hall === "history" || exhibit.hall === "people"
          ? "АРХИВ"
          : exhibit.hall === "symbols"
            ? "СИМВОЛ"
            : "ФОТОГРАФИЯ";
  c.fillStyle = "#8b6b22";
  c.font = "bold 22px Arial";
  c.fillText(kind, 36, photoHeight + 48);
  c.fillStyle = gallery.text;
  c.font = "bold 56px Georgia, serif";
  title.forEach((line, i) => c.fillText(line, 36, photoHeight + 100 + i * 62));
  c.fillStyle = gallery.secondary;
  c.font = "30px Arial";
  caption.forEach((line, i) =>
    c.fillText(line, 36, photoHeight + 148 + (title.length - 1) * 62 + i * 36),
  );
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const width = aspect < 0.95 ? 1.82 : 2.25;
  return {
    texture,
    width,
    height: (width * canvas.height) / canvas.width,
    status,
  };
}

export function ExhibitPanel({
  exhibit,
  z,
  side,
  onOpen,
  enabled,
  retryToken,
  onImageStatus,
}: {
  exhibit: Exhibit;
  z: number;
  side: number;
  onOpen: (id: string) => void;
  enabled: boolean;
  retryToken: number;
  onImageStatus: (id: string, status: ImageStatus) => void;
}) {
  const { invalidate, gl } = useThree();
  const [surface, setSurface] = useState(() =>
    createSurface(exhibit, "loading"),
  );
  const [hover, setHover] = useState(false);
  useEffect(() => {
    let active = true;
    const img = new Image();
    onImageStatus(exhibit.id, "loading");
    if (retryToken) setSurface(createSurface(exhibit, "loading"));
    const timeout = window.setTimeout(() => finish(false), 15000);
    function finish(loaded: boolean) {
      if (!active) return;
      active = false;
      window.clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      const next = createSurface(
        exhibit,
        loaded ? "loaded" : "error",
        loaded ? img : undefined,
      );
      next.texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      setSurface(next);
      onImageStatus(exhibit.id, next.status);
    }
    img.onload = () => finish(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => finish(false);
    if (exhibit.image) {
      const url = new URL(asset(exhibit.image), document.baseURI);
      if (retryToken) url.searchParams.set("retry", String(retryToken));
      img.src = url.href;
    } else finish(false);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [exhibit, gl, retryToken, onImageStatus]);
  useLayoutEffect(() => {
    // Request a frame AFTER React attaches the newly painted canvas to the mesh.
    surface.texture.needsUpdate = true;
    invalidate();
    return () => surface.texture.dispose();
  }, [surface, invalidate]);
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (enabled && event.distance < 4.5) onOpen(exhibit.id);
  };
  const { width, height, texture } = surface;
  return (
    <group
      position={[side * 12.7, 3.55 - height / 2, z]}
      rotation={[0, (-side * Math.PI) / 2, 0]}
    >
      <mesh
        onClick={click}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        userData={{ exhibit: exhibit.id }}
      >
        <boxGeometry
          args={[width + (hover && enabled ? 0.13 : 0.1), height + 0.1, 0.1]}
        />
        <GalleryMaterial gold />
      </mesh>
      <mesh
        position={[0, 0, 0.058]}
        onClick={click}
        userData={{ exhibit: exhibit.id }}
        onAfterRender={() => {
          const states = JSON.parse(gl.domElement.dataset.panelImages || "{}");
          if (states[exhibit.id] !== surface.status) {
            states[exhibit.id] = surface.status;
            gl.domElement.dataset.panelImages = JSON.stringify(states);
          }
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          color="#ffffff"
          toneMapped={false}
          fog={false}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh position={[0, height / 2 + 0.2, 0.19]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[width * 0.7, 0.055, 0.24]} />
        <GalleryMaterial gold />
      </mesh>
      <mesh
        position={[0, height / 2 + 0.168, 0.22]}
        rotation={[-Math.PI / 2 + 0.3, 0, 0]}
      >
        <planeGeometry args={[width * 0.64, 0.13]} />
        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
