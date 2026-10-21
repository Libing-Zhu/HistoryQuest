import { describe, it, expect } from "vitest";
import { fresh, parseProgress, toggle, searchText } from "../src/state";
import { topics, artifacts, sources } from "../src/data";
describe("browser progress", () => {
  it("recovers malformed or wrong-version storage", () => {
    for (const raw of ["{", "null", '{"version":1}', null])
      expect(parseProgress(raw)).toEqual(fresh());
  });
  it("round-trips and rejects invalid fields", () => {
    const p = fresh();
    p.saved = ["chair"];
    p.answers = { chair: 1 };
    p.notes = { chair: "我的问题" };
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(
      parseProgress('{"version":2,"saved":"bad","answers":{"x":99}}').saved,
    ).toEqual([]);
  });
  it("toggles bookmarks without duplication", () => {
    expect(toggle(["chair"], "chair")).toEqual([]);
    expect(toggle([], "chair")).toEqual(["chair"]);
  });
  it("searches Chinese keywords and respects category", () => {
    expect(searchText(topics, "邮票", "全部").map((t) => t.id)).toContain(
      "post",
    );
    expect(searchText(topics, "邮票", "人物")).toHaveLength(0);
    expect(searchText(topics, "   ", "全部")).toHaveLength(topics.length);
  });
  it("maintains content source and relationship integrity", () => {
    const ids = [...artifacts, ...topics].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of [...artifacts, ...topics]) {
      for (const s of c.sourceIds)
        expect(sources.some((x) => x.id === s)).toBe(true);
      for (const id of c.related)
        expect(topics.some((x) => x.id === id)).toBe(true);
    }
    for (const s of sources) expect(new URL(s.url).protocol).toBe("https:");
  });
});

it("invalidates the old chair puzzle answer while retaining other progress", () => {
  const original = {
    version: 2,
    puzzleVersion: 2,
    saved: ["chair", "craft"],
    answers: { chair: 1, radio: 1 },
    notes: { chair: "继续了解木雕" },
  };
  const migrated = parseProgress(JSON.stringify(original));
  expect(migrated.answers).toEqual({ radio: 1 });
  expect(migrated.saved).toEqual(original.saved);
  expect(migrated.notes).toEqual(original.notes);
  migrated.answers.chair = 1;
  expect(parseProgress(JSON.stringify(migrated)).answers.chair).toBe(1);
});
