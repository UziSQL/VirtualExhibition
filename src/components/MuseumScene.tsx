import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { exhibits, hallExhibits, halls, type HallId } from "../data/museum";
import { HallSign } from "./HallSign";
import {
  canStand,
  columns,
  hallPoint,
  moveWithCollision,
  roomAt,
  route,
  walls,
  type Point,
} from "../lib/world";
import { Dombra, Yurt } from "./Models";
import { ExhibitPanel } from "./ExhibitPanel";
import type { ImageStatus } from "./ExhibitPanel";
import { gallery, GalleryMaterial, GallerySurfaces } from "./GalleryMaterial";
import { ContactShade } from "./ContactShade";
import { AtriumBackdrop } from "./AtriumBackdrop";
export type Navigation = {
  id: number;
  room: HallId | "atrium";
  exhibit?: string;
};
export type Controls = {
  forward: number;
  strafe: number;
  yaw: number;
  pitch: number;
};
export type SceneProps = {
  walking: boolean;
  blocked: boolean;
  intro: boolean;
  navigation: Navigation;
  paused: boolean;
  quality: string;
  imageRetry: number;
  onImageStatus: (id: string, status: ImageStatus) => void;
  controls: React.RefObject<Controls>;
  onRoom: (id: HallId | "atrium") => void;
  onTarget: (id: string | null) => void;
  onOpen: (id: string) => void;
  onArrive: () => void;
  onReady: () => void;
  onFailure: () => void;
  onEscape: () => void;
};
function Box({
  position,
  size,
  color = gallery.wall,
  gold = false,
  stone = false,
  castShadow = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  gold?: boolean;
  stone?: boolean;
  castShadow?: boolean;
}) {
  return (
    <mesh position={position} receiveShadow castShadow={castShadow}>
      <boxGeometry args={size} />
      <GalleryMaterial color={color} gold={gold} stone={stone} />
    </mesh>
  );
}
function labelTexture(text: string, sub = "", accent = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = gallery.panel;
  c.fillRect(0, 0, 1024, 256);
  c.fillStyle = gallery.gold;
  c.fillRect(24, 16, 976, accent ? 6 : 3);
  c.textAlign = "center";
  c.fillStyle = gallery.text;
  c.font = "52px Georgia, serif";
  c.fillText(text, 512, 115, 980);
  c.fillStyle = gallery.secondary;
  c.font = "23px Arial";
  c.fillText(sub, 512, 183, 960);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function Label({
  text,
  sub = "",
  position,
  rotation = 0,
  width = 3,
  accent = false,
}: {
  text: string;
  sub?: string;
  position: [number, number, number];
  rotation?: number;
  width?: number;
  accent?: boolean;
}) {
  const map = useMemo(
    () => labelTexture(text, sub, accent),
    [text, sub, accent],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <planeGeometry args={[width, width / 4]} />
      <meshBasicMaterial map={map} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
function HallLight({ side, z }: { side: number; z: number }) {
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(side * 12.7, 2, z);
    return object;
  }, [side, z]);
  return (
    <>
      <primitive object={target} />
      <spotLight
        position={[side * 10.6, 4.35, z]}
        target={target}
        color="#ffffff"
        intensity={12}
        distance={8}
        angle={1.05}
        penumbra={0.7}
        decay={2}
      />
    </>
  );
}
function Architecture({
  onOpen,
  enabled,
  imageRetry,
  onImageStatus,
}: {
  onOpen: (id: string) => void;
  enabled: boolean;
  imageRetry: number;
  onImageStatus: (id: string, status: ImageStatus) => void;
}) {
  return (
    <>
      <color attach="background" args={[gallery.wall]} />
      <fog attach="fog" args={[gallery.wall, 40, 75]} />
      <ambientLight color="#ffffff" intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#dedbd5", 0.5]} />
      {/* Broad upward fill approximates the light reflected by the pale floor. */}
      <directionalLight position={[0, -8, 0]} color="#ffffff" intensity={1.1} />
      <directionalLight
        position={[7, 7, -8]}
        color="#ffffff"
        intensity={0.45}
      />
      <directionalLight
        position={[-3, 10, 6]}
        color="#ffffff"
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
        shadow-radius={4}
        shadow-intensity={0.7}
        shadow-autoUpdate={false}
        shadow-needsUpdate
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 24]} />
        <GalleryMaterial color={gallery.floor} stone />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => (
        <Box
          key={"joint" + i}
          position={[0, 0.012, i * 2 - 12]}
          size={[26, 0.005, 0.017]}
          color={gallery.joint}
          stone
        />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <Box
          key={"jointx" + i}
          position={[i * 2 - 12, 0.012, 0]}
          size={[0.014, 0.005, 24]}
          color={gallery.joint}
          stone
        />
      ))}
      {[-4.55, 4.55].map((x) => (
        <Box key={x} position={[x, 0.018, 0]} size={[0.045, 0.02, 23.6]} gold />
      ))}
      {walls.map((w, i) => (
        <group key={i}>
          <Box position={[w.x, 2.35, w.z]} size={[w.w, 4.7, w.d]} />
          <ContactShade
            x={w.x}
            z={w.z}
            width={w.w}
            depth={w.d}
            opacity={0.19}
          />
        </group>
      ))}
      <Box
        position={[0, 3.45, -11.82]}
        size={[9.6, 6.9, 0.12]}
        color={gallery.accent}
      />
      <ContactShade x={0} z={-11.82} width={9.6} depth={0.12} />
      <AtriumBackdrop />
      {halls.map((h) => (
        <group key={h.id}>
          <Box
            position={[h.side * 12.85, 2.35, h.z]}
            size={[0.04, 4.6, 7.75]}
            color={gallery.wall}
          />
          <HallLight side={h.side} z={h.z} />
          <Box
            position={[h.side * 9, 4.8, h.z]}
            size={[8, 0.18, 8]}
            color={gallery.ceiling}
          />
          <Box
            position={[h.side * 5, 4, h.z]}
            size={[0.4, 1.4, 2.6]}
            color={gallery.stone}
            stone
          />
          {[-1.4, 1.4].map((o) => (
            <group key={o}>
              <Box
                position={[h.side * 4.88, 1.65, h.z + o]}
                size={[0.32, 3.3, 0.19]}
                color={gallery.stone}
                stone
              />
              <Box
                position={[h.side * 4.7, 1.65, h.z + o]}
                size={[0.025, 3.3, 0.035]}
                gold
              />
              <ContactShade
                x={h.side * 4.88}
                z={h.z + o}
                width={0.32}
                depth={0.19}
                opacity={0.16}
              />
            </group>
          ))}
          <HallSign
            place={h}
            position={[h.side * 4.75, 3.97, h.z]}
            rotation={(-h.side * Math.PI) / 2}
          />
          <Box
            position={[h.side * 8.8, 4.61, h.z]}
            size={[3.3, 0.04, 0.1]}
            color={gallery.ceiling}
          />
          {hallExhibits(h.id).map((e, j, items) => (
            <ExhibitPanel
              key={e.id}
              exhibit={e}
              side={h.side}
              z={h.z + (j - (items.length - 1) / 2) * 2.45}
              onOpen={onOpen}
              enabled={enabled}
              retryToken={imageRetry}
              onImageStatus={onImageStatus}
            />
          ))}
        </group>
      ))}
      <Box
        position={[0, 7.12, 0]}
        size={[10, 0.18, 24]}
        color={gallery.ceiling}
      />
      {/* Stone columns, champagne-gold shanyrak and quiet contact shadows. */}
      {columns.map(({ x, z, w, d }) => (
        <group key={`${x}-${z}`}>
          <Box
            position={[x, 3.25, z]}
            size={[0.42, 6.5, 0.42]}
            color={gallery.stone}
            stone
            castShadow
          />
          <Box
            position={[x, 0.16, z]}
            size={[w, 0.3, d]}
            color={gallery.stone}
            stone
            castShadow
          />
          <Box position={[x, 0.32, z]} size={[w, 0.035, d]} gold />
          <ContactShade x={x} z={z} width={w} depth={d} opacity={0.27} />
        </group>
      ))}
      {[3.45, 2.65, 1.25].map((r) => (
        <mesh key={r} position={[0, 6.65, -2]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.07, 8, 64]} />
          <GalleryMaterial gold />
        </mesh>
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12;
        return (
          <group key={i} position={[0, 6.63, -2]} rotation={[0, a, 0]}>
            <Box position={[0, 0, 2.1]} size={[0.065, 0.065, 2.6]} gold />
          </group>
        );
      })}
      {[-0.5, 0, 0.5].map((o) => (
        <group key={o}>
          <Box position={[o, 6.68, -2]} size={[0.05, 0.07, 2.3]} gold />
          <Box position={[0, 6.69, -2 + o]} size={[2.3, 0.07, 0.05]} gold />
        </group>
      ))}
      {[-8, 4, 10].map((z) => (
        <group key={z}>
          <Box position={[0, 6.05, z]} size={[9.8, 0.16, 0.25]} gold />
          <Box
            position={[0, 5.96, z]}
            size={[8.3, 0.025, 0.07]}
            color={gallery.ceiling}
          />
        </group>
      ))}
      <ContactShade
        x={0}
        z={-2}
        width={3.66}
        depth={3.66}
        round
        opacity={0.28}
      />
      <mesh position={[0, 0.16, -2]} receiveShadow castShadow>
        <cylinderGeometry args={[1.75, 1.83, 0.3, 64]} />
        <GalleryMaterial color={gallery.stone} stone />
      </mesh>
      <mesh position={[0, 0.36, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[1.55, 1.55, 0.14, 64]} />
        <GalleryMaterial color={gallery.stone} stone />
      </mesh>
      <group position={[0, 0.44, -2]}>
        <Yurt scale={1.48} />
      </group>
      <Label
        text="Шаңырақ"
        sub="Общий дом. Общая история."
        position={[0, 0.61, -0.43]}
        width={1.48}
      />
      <mesh position={[0, 0.028, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.25, 2.28, 64]} />
        <GalleryMaterial gold />
      </mesh>
      <ContactShade x={-7.1} z={1.9} width={1.25} depth={1.25} opacity={0.25} />
      <Box
        position={[-7.1, 0.5, 1.9]}
        size={[1.25, 1, 1.25]}
        color={gallery.stone}
        stone
        castShadow
      />
      <group position={[-7.1, 2, 1.9]} rotation={[0, Math.PI / 3, 0]}>
        <Dombra />
      </group>
      <mesh position={[-7.1, 1.9, 1.9]}>
        <boxGeometry args={[1.3, 1.9, 1.3]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.075}
          depthWrite={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.6, 0, -9.7]}>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.35, 0.24, 0.65, 16]} />
            <GalleryMaterial color={gallery.stone} stone />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 2) * 0.23,
                0.8 + i * 0.13,
                Math.cos(i * 2) * 0.22,
              ]}
              rotation={[i * 0.2, 0, i * 0.6]}
              scale={[0.23, 0.55, 0.17]}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color={i % 2 ? "#6b8063" : "#899671"} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
function CameraController(props: SceneProps) {
  const { camera, gl, scene, invalidate } = useThree();
  const state = useRef(props);
  state.current = props;
  const keys = useRef(new Set<string>()),
    path = useRef<Point[]>([]),
    destination = useRef<Navigation>(props.navigation),
    angles = useRef({ yaw: 0, pitch: 0 });
  const target = useRef<string | null>(null),
    lastRoom = useRef<HallId | "atrium">("atrium"),
    lastCheck = useRef(0);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const orient = useMemo(() => new THREE.PerspectiveCamera(), []);
  useEffect(() => {
    camera.position.set(3.1, 2.7, 9.8);
    camera.lookAt(-0.6, 2.8, -4);
    camera.rotation.order = "YXZ";
    angles.current = { yaw: camera.rotation.y, pitch: camera.rotation.x };
    props.onReady();
    const lost = (e: Event) => {
      e.preventDefault();
      state.current.onFailure();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, []);
  useEffect(() => {
    destination.current = props.navigation;
    const end = hallPoint(props.navigation.room);
    if (props.navigation.exhibit) {
      const e = exhibits.find((e) => e.id === props.navigation.exhibit)!;
      const h = halls.find((h) => h.id === e.hall)!;
      const j = hallExhibits(h.id).findIndex((x) => x.id === e.id);
      end[0] = h.side * 10;
      end[1] = h.z + (j - (hallExhibits(h.id).length - 1) / 2) * 2.45;
    }
    path.current = route([camera.position.x, camera.position.z], end);
    invalidate();
  }, [props.navigation.id]);
  useEffect(() => {
    invalidate();
  }, [props.walking, props.blocked, props.paused, props.intro, invalidate]);
  useEffect(() => {
    keys.current.clear();
    props.controls.current.forward = 0;
    props.controls.current.strafe = 0;
    if (props.blocked && document.pointerLockElement)
      document.exitPointerLock();
  }, [props.blocked, props.walking]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (state.current.blocked || !state.current.walking) return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        e.preventDefault();
        keys.current.add(e.code);
      }
      if (e.code === "KeyE" && target.current)
        state.current.onOpen(target.current);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const move = (e: MouseEvent) => {
      if (
        document.pointerLockElement === gl.domElement &&
        state.current.walking &&
        !state.current.blocked
      ) {
        angles.current.yaw -= e.movementX * 0.002;
        angles.current.pitch = Math.max(
          -1.1,
          Math.min(1.1, angles.current.pitch - e.movementY * 0.002),
        );
      }
    };
    const lock = () => {
      if (
        !document.pointerLockElement &&
        state.current.walking &&
        !state.current.blocked
      )
        state.current.onEscape();
    };
    const click = () => {
      if (!state.current.walking || state.current.blocked) return;
      if (document.pointerLockElement) {
        if (target.current) state.current.onOpen(target.current);
      } else if (matchMedia("(pointer:fine)").matches) {
        gl.domElement.requestPointerLock()?.catch(() => {});
      }
    };
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("blur", blur);
    document.addEventListener("pointerlockchange", lock);
    gl.domElement.addEventListener("click", click);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("blur", blur);
      document.removeEventListener("pointerlockchange", lock);
      gl.domElement.removeEventListener("click", click);
    };
  }, [camera, gl]);
  useFrame(({ clock }, delta) => {
    const p = state.current,
      dt = Math.min(delta, 0.15),
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (
      !p.blocked &&
      !p.intro &&
      (p.walking || (path.current.length && !p.paused))
    )
      invalidate();
    if (path.current.length && !p.paused && !p.blocked && !p.intro) {
      if (reduced) {
        const end = path.current.at(-1)!;
        camera.position.set(end[0], 1.7, end[1]);
        path.current = [];
      } else {
        let budget = dt * 7;
        while (path.current.length && budget > 0.001) {
          const next = path.current[0],
            dx = next[0] - camera.position.x,
            dz = next[1] - camera.position.z,
            d = Math.hypot(dx, dz),
            amount = Math.min(d, budget);
          const [x, z] = moveWithCollision(
            [camera.position.x, camera.position.z],
            (dx / (d || 1)) * amount,
            (dz / (d || 1)) * amount,
          );
          camera.position.set(
            x,
            THREE.MathUtils.lerp(camera.position.y, 1.7, Math.min(1, dt * 3)),
            z,
          );
          budget -= amount;
          if (d <= amount + 0.001) path.current.shift();
          else break;
        }
      }
      const hall = halls.find((h) => h.id === destination.current.room);
      orient.position.copy(camera.position);
      orient.lookAt(
        hall ? hall.side * 13 : 0,
        2.15,
        hall ? camera.position.z : -2,
      );
      camera.quaternion.slerp(orient.quaternion, reduced ? 1 : dt * 3);
      angles.current = { yaw: camera.rotation.y, pitch: camera.rotation.x };
      if (!path.current.length) p.onArrive();
    } else if (p.walking && !p.blocked && !path.current.length) {
      const k = keys.current,
        joy = p.controls.current;
      angles.current.yaw -= joy.yaw;
      angles.current.pitch = Math.max(
        -1.1,
        Math.min(1.1, angles.current.pitch - joy.pitch),
      );
      joy.yaw = 0;
      joy.pitch = 0;
      camera.rotation.set(angles.current.pitch, angles.current.yaw, 0, "YXZ");
      let f =
        Number(k.has("KeyW") || k.has("ArrowUp")) -
        Number(k.has("KeyS") || k.has("ArrowDown")) +
        joy.forward;
      let s =
        Number(k.has("KeyD") || k.has("ArrowRight")) -
        Number(k.has("KeyA") || k.has("ArrowLeft")) +
        joy.strafe;
      const len = Math.max(1, Math.hypot(f, s));
      f /= len;
      s /= len;
      const yaw = angles.current.yaw;
      const [x, z] = moveWithCollision(
        [camera.position.x, camera.position.z],
        (-Math.sin(yaw) * f + Math.cos(yaw) * s) * dt * 2.6,
        (-Math.cos(yaw) * f - Math.sin(yaw) * s) * dt * 2.6,
      );
      camera.position.set(x, 1.7, z);
    }
    if (clock.elapsedTime - lastCheck.current > 0.12) {
      lastCheck.current = clock.elapsedTime;
      const room = roomAt(camera.position.x, camera.position.z);
      if (room !== lastRoom.current) {
        lastRoom.current = room;
        p.onRoom(room);
      }
      let next: string | null = null;
      if (p.walking && !p.blocked && !path.current.length) {
        ray.setFromCamera(new THREE.Vector2(0, 0), camera);
        ray.far = 4.5;
        const hits = ray.intersectObjects(scene.children, true);
        const hit = hits.find((h) => h.object instanceof THREE.Mesh);
        next = hit?.object.userData.exhibit || null;
      }
      if (next !== target.current) {
        target.current = next;
        p.onTarget(next);
      }
      gl.domElement.dataset.position = `${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`;
      gl.domElement.dataset.walkable = String(
        canStand(camera.position.x, camera.position.z),
      );
    }
  });
  return null;
}
export default function MuseumScene(props: SceneProps) {
  const low =
    props.quality === "low" ||
    (props.quality === "auto" && matchMedia("(max-width:700px)").matches);
  return (
    <Canvas
      frameloop="demand"
      shadows={!low}
      dpr={low ? 1 : [1, 1.5]}
      camera={{ fov: 59, near: 0.1, far: 75 }}
      gl={{ antialias: !low, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <GallerySurfaces>
        <Architecture
          onOpen={props.onOpen}
          enabled={props.walking && !props.blocked}
          imageRetry={props.imageRetry}
          onImageStatus={props.onImageStatus}
        />
        <CameraController {...props} />
      </GallerySurfaces>
    </Canvas>
  );
}
