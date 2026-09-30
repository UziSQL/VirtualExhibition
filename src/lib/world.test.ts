import { describe, expect, it } from "vitest";
import { halls } from "../data/museum";
import {
  canStand,
  columns,
  hallPoint,
  moveWithCollision,
  obstacles,
  roomAt,
  route,
  walls,
  type Point,
} from "./world";
describe("Архитектура и маршруты", () => {
  it("Стены и витрины непроходимы, дверные проёмы открыты", () => {
    walls.forEach((w) => expect(canStand(w.x, w.z)).toBe(false));
    obstacles.forEach((o) => expect(canStand(o.x, o.z)).toBe(false));
    columns.forEach((c) => expect(canStand(c.x, c.z)).toBe(false));
    halls.forEach((h) => expect(canStand(h.side * 5, h.z)).toBe(true));
  });
  it("Даже большой шаг не проходит через стену или витрину", () => {
    expect(moveWithCollision([4, 3], 4, 0)[0]).toBeLessThan(4.7);
    expect(moveWithCollision([0, 2], 0, -8)[1]).toBeGreaterThan(0);
    expect(moveWithCollision([0, 10], 0, 100)[1]).toBeLessThan(11.5);
  });
  it("Все залы достижимы из любого другого через свободное пространство", () => {
    const points = [hallPoint("atrium"), ...halls.map((h) => hallPoint(h.id))];
    for (const a of points)
      for (const b of points) {
        const path = route(a, b);
        expect(path.length).toBeGreaterThan(0);
        let prev: Point = a;
        for (const point of path) {
          for (let j = 0; j <= 10; j++) {
            const t = j / 10;
            expect(
              canStand(
                prev[0] + (point[0] - prev[0]) * t,
                prev[1] + (point[1] - prev[1]) * t,
              ),
            ).toBe(true);
          }
          prev = point;
        }
      }
  });
  it("Определяет зал по положению, атриум отдельно", () => {
    halls.forEach((h) => expect(roomAt(...hallPoint(h.id))).toBe(h.id));
    expect(roomAt(0, 8)).toBe("atrium");
  });
  it("Находит выход даже вплотную к внешней стене", () => {
    const path = route([12.4, 8], hallPoint("history"));
    expect(path.length).toBeGreaterThan(0);
    expect(path.every((p) => canStand(...p))).toBe(true);
  });
});
