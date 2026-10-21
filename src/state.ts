export const STORAGE_KEY = "historyquest-v2";
export type Progress = {
  version: 2;
  puzzleVersion: 3;
  saved: string[];
  viewed: string[];
  observed: string[];
  // Latest historical submissions only; never restore current puzzle controls from this field.
  answers: Record<string, number>;
  skipped: string[];
  read: string[];
  events: { type: string; id: string; at: string }[];
  notes: Record<string, string>;
};
export const fresh = (): Progress => ({
  version: 2,
  puzzleVersion: 3,
  saved: [],
  viewed: [],
  observed: [],
  answers: {},
  skipped: [],
  read: [],
  events: [],
  notes: {},
});
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
export function parseProgress(raw: string | null): Progress {
  try {
    const p = JSON.parse(raw || "null");
    if (p?.version !== 2) return fresh();
    const n = fresh();
    for (const k of ["saved", "viewed", "observed", "skipped", "read"] as const)
      if (strings(p[k])) n[k] = p[k];
    for (const [k, v] of Object.entries(p.answers || {}))
      if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 3)
        n.answers[k] = v;
    // Only the changed chair answer is invalidated; all bookmarks and notes survive.
    if (p.puzzleVersion !== 3) delete n.answers.chair;
    for (const [k, v] of Object.entries(p.notes || {}))
      if (typeof v === "string") n.notes[k] = v.slice(0, 2000);
    if (Array.isArray(p.events))
      n.events = p.events
        .filter(
          (e: Progress["events"][number]) =>
            e &&
            typeof e.type === "string" &&
            typeof e.id === "string" &&
            typeof e.at === "string",
        )
        .slice(-500);
    return n;
  } catch {
    return fresh();
  }
}
export const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
export function searchText(
  items: import("./data").Topic[],
  query: string,
  type: string,
) {
  const q = query.trim().toLocaleLowerCase();
  return items.filter(
    (t) =>
      (type === "全部" || t.type === type) &&
      `${t.title} ${t.summary} ${t.body} ${t.sections?.map((s) => s.title + " " + s.text).join(" ") ?? ""} ${t.observations?.join(" ") ?? ""} ${t.reflection ?? ""} ${t.keywords.join(" ")}`
        .toLocaleLowerCase()
        .includes(q),
  );
}
