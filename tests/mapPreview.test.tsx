import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useMapPreview } from "../src/MapPreview";
import { highlights } from "../src/mapHighlights";
function Demo({ floor = "1" }: { floor?: string }) {
  const preview = useMapPreview(floor);
  return <><svg><g role="button" aria-label="marker" {...preview.bindings(highlights[0])} /><g role="button" aria-label="other" {...preview.bindings(highlights[1])} /></svg>{preview.layer}</>;
}
it("previews the correct existing image, survives transfer, supports Escape and floor changes", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  vi.useFakeTimers();
  const view = render(<Demo />);
  fireEvent.focus(screen.getByRole("button", { name: "marker" }));
  expect(screen.getByRole("img").getAttribute("src")).toContain(highlights[0].image);
  fireEvent.blur(screen.getByRole("button", { name: "marker" }));
  fireEvent.pointerEnter(screen.getByRole("tooltip"));
  act(() => vi.advanceTimersByTime(220));
  expect(screen.getByRole("tooltip")).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull();
  fireEvent.focus(screen.getByRole("button", { name: "other" }));
  expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByText("暂无图片")).toBeInTheDocument();
  view.rerender(<Demo floor="2" />);
  expect(screen.queryByRole("tooltip")).toBeNull();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
