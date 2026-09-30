import { halls, type HallId } from "../data/museum";
export type Point = [number, number];
export type Wall = { x: number; z: number; w: number; d: number };
export const walls: Wall[] = [
  { x: 0, z: -12, w: 26, d: 0.25 },
  { x: 0, z: 12, w: 26, d: 0.25 },
  { x: -13, z: 0, w: 0.25, d: 24 },
  { x: 13, z: 0, w: 0.25, d: 24 },
];
for (const side of [-1, 1]) {
  for (const z of [-4, 4]) walls.push({ x: side * 9, z, w: 8, d: 0.22 });
  for (const z of [-8, 0, 8])
    for (const offset of [-2.65, 2.65])
      walls.push({ x: side * 5, z: z + offset, w: 0.22, d: 2.7 });
}
export const obstacles = [
  { x: 0, z: -2, r: 1.75 },
  { x: -7.1, z: 1.9, r: 1.05 },
  { x: -3.6, z: -9.7, r: 0.35 },
  { x: 3.6, z: -9.7, r: 0.35 },
];
export const columns: Wall[] = [-4.65, 4.65].flatMap((x) =>
  [-11.5, -4, 4, 11.5].map((z) => ({ x, z, w: 0.62, d: 0.62 })),
);
const solidBoxes = [...walls, ...columns];
export function canStand(x: number, z: number, r = 0.28) {
  if (Math.abs(x) > 12.7 - r || Math.abs(z) > 11.7 - r) return false;
  return (
    !solidBoxes.some(
      (w) => Math.abs(x - w.x) < w.w / 2 + r && Math.abs(z - w.z) < w.d / 2 + r,
    ) && !obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + r)
  );
}
export function moveWithCollision(start: Point, dx: number, dz: number): Point {
  let [x, z] = start;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx / steps, z)) x += dx / steps;
    if (canStand(x, z + dz / steps)) z += dz / steps;
  }
  return [x, z];
}
export function roomAt(x: number, z: number): HallId | "atrium" {
  return Math.abs(x) < 5
    ? "atrium"
    : halls.find((h) => h.side === Math.sign(x) && Math.abs(h.z - z) < 4)?.id ||
        "atrium";
}
export function hallPoint(id: HallId | "atrium"): Point {
  const h = halls.find((h) => h.id === id);
  return h ? [h.side * 8.9, h.z] : [2.8, 8.5];
}
// Breadth-first search on a walkable grid, using the same collisions as walking.
export function route(start: Point, end: Point): Point[] {
  const step = 0.5,
    key = (x: number, z: number) => `${x},${z}`;
  const visible = (a: Point, b: Point) => {
    const samples = Math.max(
      1,
      Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05),
    );
    for (let i = 0; i <= samples; i++)
      if (
        !canStand(
          a[0] + ((b[0] - a[0]) * i) / samples,
          a[1] + ((b[1] - a[1]) * i) / samples,
        )
      )
        return false;
    return true;
  };
  const snap = (p: Point): Point | null => {
    const gx = Math.round(p[0] / step),
      gz = Math.round(p[1] / step),
      candidates: Point[] = [];
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++) candidates.push([gx + dx, gz + dz]);
    return (
      candidates
        .sort(
          (a, b) =>
            Math.hypot(a[0] * step - p[0], a[1] * step - p[1]) -
            Math.hypot(b[0] * step - p[0], b[1] * step - p[1]),
        )
        .find((a) => visible(p, [a[0] * step, a[1] * step])) || null
    );
  };
  const first = snap(start),
    last = snap(end);
  if (!first || !last) return [];
  const [sx, sz] = first,
    [ex, ez] = last;
  const queue: [[number, number]] | [number, number][] = [[sx, sz]],
    seen = new Set([key(sx, sz)]),
    prev = new Map<string, Point>();
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    if (x === ex && z === ez) {
      const path: Point[] = [end];
      let p: Point = [x, z];
      while (p[0] !== sx || p[1] !== sz) {
        path.unshift([p[0] * step, p[1] * step]);
        p = prev.get(key(...p))!;
      }
      path.unshift([sx * step, sz * step]);
      return path;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k = key(nx, nz);
      if (
        !seen.has(k) &&
        canStand(nx * step, nz * step) &&
        canStand((x + dx * 0.5) * step, (z + dz * 0.5) * step)
      ) {
        seen.add(k);
        prev.set(k, [x, z]);
        queue.push([nx, nz]);
      }
    }
  }
  return [];
}
