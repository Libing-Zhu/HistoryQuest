import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HighlightCarousel from "../src/HighlightCarousel";
import { highlights } from "../src/mapHighlights";
function pointer(el: Element, type: string, x: number) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, button: 0 });
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: "mouse" } });
  fireEvent(el, event);
}
it("keeps ten accessible choices, preserves clicks and suppresses a click after dragging", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const select = vi.fn();
  render(<HighlightCarousel items={highlights} selected="" select={select} />);
  const region = screen.getByRole("region", { name: "重点文物横向列表" });
  const cards = screen.getAllByRole("button");
  expect(cards).toHaveLength(10);
  cards.forEach((card, index) => expect(card.textContent?.startsWith(highlights[index].short)).toBe(true));
  expect(region.querySelector(".index-point-number")).toBeNull();
  fireEvent.click(cards[0]); expect(select).toHaveBeenCalledWith(highlights[0]);
  select.mockClear();
  Object.assign(region, { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: vi.fn() });
  pointer(region, "pointerdown", 250);
  pointer(region, "pointermove", 150);
  pointer(region, "pointerup", 150);
  fireEvent.click(cards[0]); expect(select).not.toHaveBeenCalled();
  expect(region.scrollLeft).toBe(100);
  expect(screen.queryByText("暂停滚动")).toBeNull();
  vi.unstubAllGlobals();
});
it("moves at 20px/s, pauses for focus, loops without an accessible duplicate and respects reduced motion", () => {
  let frame: FrameRequestCallback = () => {};
  const listeners: Array<() => void> = [];
  let reduced = false;
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    get matches() { return query.includes("prefers-reduced") ? reduced : true; },
    addEventListener: (_: string, callback: () => void) => listeners.push(callback), removeEventListener: vi.fn(),
  })));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) { this.callback = callback; } callback; observe() { this.callback([{ isIntersecting: true }]); } disconnect() {} });
  const width = vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(1000);
  const scroll = vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(function () { return (this as Element).classList.contains("highlight-carousel-group") ? 2920 : 8760; });
  const view = render(<HighlightCarousel items={highlights} selected="" select={vi.fn()} />);
  const region = screen.getByRole("region", { name: "重点文物横向列表" });
  expect(screen.getAllByRole("button")).toHaveLength(11); // Ten cards plus pause; copies are hidden.
  const start = region.scrollLeft;
  let time = 1000;
  act(() => frame(time));
  for (let n = 0; n < 60; n++) act(() => { time += 1000 / 60; frame(time); });
  expect(region.scrollLeft - start).toBeCloseTo(20, 1);
  fireEvent.focus(screen.getAllByRole("button")[1]);
  const stopped = region.scrollLeft;
  for (let n = 0; n < 10; n++) act(() => { time += 16; frame(time); });
  expect(region.scrollLeft).toBe(stopped);
  fireEvent.blur(screen.getAllByRole("button")[1]);
  region.scrollLeft = 5839.9;
  // A paused frame reads a native manual scroll before continuing.
  fireEvent.focus(region); act(() => { time += 16; frame(time); }); fireEvent.blur(region);
  act(() => { time += 16; frame(time); });
  expect(region.scrollLeft).toBeLessThan(3000);
  act(() => { reduced = true; listeners.forEach(callback => callback()); });
  expect(screen.queryByText("暂停滚动")).toBeNull();
  expect(screen.getAllByRole("button")).toHaveLength(10);
  view.unmount(); width.mockRestore(); scroll.mockRestore(); vi.unstubAllGlobals();
});
