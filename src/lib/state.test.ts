import { describe, expect, it } from "vitest";
import { exhibits, halls } from "../data/museum";
import {
  advanceTour,
  emptyProgress,
  isCorrect,
  parseProgress,
  stampedHalls,
  visit,
} from "./state";
describe("Паспорт", () => {
  it("Не даёт отметку за вход и неизвестный экспонат", () => {
    const initial = emptyProgress();
    expect(stampedHalls(initial)).toEqual([]);
    expect(visit(initial, "region-placeholder")).toBe(initial);
  });
  it("Ставит одну отметку за несколько экспонатов одного зала", () => {
    let p = visit(emptyProgress(), "declaration");
    p = visit(p, "independence");
    p = visit(p, "declaration");
    expect(stampedHalls(p)).toEqual(["history"]);
    expect(p.visited).toHaveLength(2);
  });
  it("Не засчитывает незаполненный регион и сохраняет доступные залы", () => {
    const p = exhibits.reduce((p, e) => visit(p, e.id), emptyProgress());
    expect(stampedHalls(p)).toHaveLength(5);
    expect(stampedHalls(p)).not.toContain("region");
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });
  it("Восстанавливается после повреждённых или устаревших данных", () => {
    for (const raw of ["null", "bad", "[]", "42"])
      expect(parseProgress(raw)).toEqual(emptyProgress());
    const p = parseProgress(
      JSON.stringify({
        visited: ["declaration", "deleted", null, "declaration"],
        wish: "a".repeat(500),
        answers: { history: 2, symbols: 1 },
      }),
    );
    expect(p.visited).toEqual(["declaration"]);
    expect(p.wish).toHaveLength(400);
    expect(p.answers).toEqual({ symbols: 1 });
  });
});
describe("Вопросы", () => {
  it.each(halls.filter((h) => h.question))("Валидный ответ в $id", (h) => {
    const q = h.question!;
    expect(q.options[q.correct]).toBeTruthy();
    q.options.forEach((_, i) => expect(isCorrect(q, i)).toBe(i === q.correct));
    expect(isCorrect(q, -1)).toBe(false);
    expect(isCorrect(q, NaN)).toBe(false);
  });
});
describe("Состояния экскурсии", () => {
  it("Сохраняет паузу, ограничивает назад и завершает последний шаг", () => {
    expect(advanceTour({ index: 0, paused: true }, -1, 3)).toEqual({
      index: 0,
      paused: true,
    });
    expect(advanceTour({ index: 0, paused: true }, 1, 3)).toEqual({
      index: 1,
      paused: true,
    });
    expect(advanceTour({ index: 2, paused: false }, 1, 3)).toBeNull();
    expect(advanceTour(null, 1, 3)).toBeNull();
  });
});
