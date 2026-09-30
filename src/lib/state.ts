import { exhibits, halls, type HallId, type Question } from "../data/museum";
export type Progress = {
  visited: string[];
  answers: Partial<Record<HallId, number>>;
  wish: string;
};
export const emptyProgress = (): Progress => ({
  visited: [],
  answers: {},
  wish: "",
});
export const STORAGE_KEY = "uly-dala-passport-v1";
export function parseProgress(raw: string | null): Progress {
  try {
    const data = JSON.parse(raw || "{}");
    const answers: Progress["answers"] = {};
    for (const hall of halls)
      if (hall.question && data?.answers?.[hall.id] === hall.question.correct)
        answers[hall.id] = hall.question.correct;
    return {
      visited: Array.isArray(data?.visited)
        ? [
            ...new Set<string>(
              data.visited.filter(
                (id: unknown) =>
                  typeof id === "string" && exhibits.some((e) => e.id === id),
              ),
            ),
          ]
        : [],
      answers,
      wish: typeof data?.wish === "string" ? data.wish.slice(0, 400) : "",
    };
  } catch {
    return emptyProgress();
  }
}
export function visit(progress: Progress, id: string): Progress {
  if (!exhibits.some((e) => e.id === id) || progress.visited.includes(id))
    return progress;
  return { ...progress, visited: [...progress.visited, id] };
}
export function stampedHalls(progress: Progress): HallId[] {
  return halls
    .filter((h) =>
      exhibits.some((e) => e.hall === h.id && progress.visited.includes(e.id)),
    )
    .map((h) => h.id);
}
export function isCorrect(question: Question, answer: number) {
  return Number.isInteger(answer) && answer === question.correct;
}
export type TourState = { index: number; paused: boolean } | null;
export function advanceTour(
  tour: TourState,
  direction: number,
  count: number,
): TourState {
  if (!tour || count < 1) return null;
  if (tour.index + direction >= count) return null;
  return { ...tour, index: Math.max(0, tour.index + direction) };
}
