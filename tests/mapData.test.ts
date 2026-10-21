import { it, expect } from "vitest";
import { floors, footprint } from "../src/mapData";
it("matches the east-building floor and gallery index in the supplied guide", () => {
  expect(floors.map((f) => f.id)).toEqual(["1", "M", "2", "3", "4", "5"]);
  expect(
    floors.find((f) => f.id === "2")!.regions.map((r) => r.number),
  ).toEqual(["1", "2"]);
  expect(
    floors.find((f) => f.id === "3")!.regions.map((r) => r.number),
  ).toEqual(["3", "4", "5", "6"]);
  expect(
    floors.find((f) => f.id === "4")!.regions.map((r) => r.number),
  ).toEqual(["7", "8", "9"]);
});
it("uses valid vector polygons and unique room identities", () => {
  const regions = floors.flatMap((f) => f.regions);
  expect(new Set(regions.map((r) => r.id)).size).toBe(regions.length);
  for (const r of regions) {
    expect(r.points.length).toBeGreaterThanOrEqual(4);
    for (const [x, y] of r.points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(900);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(315);
    }
  }
  expect(footprint.length).toBeGreaterThan(10);
});

import { highlights } from "../src/mapHighlights";
it("assigns every highlight to an existing floor and region without claiming exact cases", () => {
  for (const h of highlights) {
    const floor = floors.find((f) => f.id === h.floor);
    expect(floor).toBeDefined();
    expect(floor!.regions.some((r) => r.id === h.region)).toBe(true);
    expect(h.imageSource).toBeTruthy();
    expect(h.image).toBeTruthy();
  }
});
