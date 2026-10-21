import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ScrollBackdrop } from "../src/ScrollBackdrop";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.getElementById("main")?.remove();
});
function environment(reduced = false) {
  vi.spyOn(performance, "now").mockReturnValue(0);
  const pending = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  const preference = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => preference);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pending.set(++sequence, callback);
    return sequence;
  });
  const cancel = vi.fn((id: number) => pending.delete(id));
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const disconnect = vi.fn();
  let observeResize: ResizeObserverCallback;
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { observeResize = callback; }
    observe = vi.fn();
    disconnect = disconnect;
  });
  const scroller = document.createElement("main");
  scroller.id = "main";
  scroller.innerHTML = '<div class="scroll-content"></div>';
  document.body.append(scroller);
  const height = vi.spyOn(scroller, "scrollHeight", "get").mockReturnValue(2000);
  vi.spyOn(scroller, "clientHeight", "get").mockReturnValue(1000);
  const y = (value: number) => { scroller.scrollTop = value; };
  y(0);
  return { pending, cancel, disconnect, preference, height, y, scroller,
    resize: () => observeResize([], {} as ResizeObserver),
    flush: (now?: number) => {
      const run = (time: number) => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(cb => cb(time)); };
      if (now === undefined) { run(1800); run(2050); run(2300); }
      else run(now);
    },
  };
}
it("follows native scrolling in both directions and coalesces events without adding page content", () => {
  const e = environment();
  const { container } = render(<ScrollBackdrop />);
  const layer = container.firstElementChild as HTMLElement;
  expect(layer).toHaveAttribute("aria-hidden", "true");
  expect(layer.textContent).toBe("");
  e.y(750);
  e.scroller.dispatchEvent(new Event("scroll"));
  e.scroller.dispatchEvent(new Event("scroll"));
  expect(e.pending.size).toBe(1);
  e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.75000");
  e.y(250); e.scroller.dispatchEvent(new Event("scroll")); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.25000");
});
it("recalculates short pages, expanded content and route changes, then cleans up observers and frames", () => {
  const e = environment();
  const { container, unmount } = render(<ScrollBackdrop />);
  const layer = container.firstElementChild as HTMLElement;
  e.y(500); e.resize(); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.50000");
  e.height.mockReturnValue(1000); window.dispatchEvent(new Event("hashchange")); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.00000");
  e.scroller.dispatchEvent(new Event("scroll"));
  unmount();
  expect(e.disconnect).toHaveBeenCalled();
  expect(e.pending.size).toBe(0);
  e.scroller.dispatchEvent(new Event("scroll"));
  expect(e.pending.size).toBe(0);
});
it("keeps the scroll static when reduced motion is enabled, including a live preference change", () => {
  const e = environment(true);
  const { container } = render(<ScrollBackdrop />);
  const layer = container.firstElementChild as HTMLElement;
  e.y(900); e.scroller.dispatchEvent(new Event("scroll")); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.00000");
  e.preference.matches = false;
  const onChange = e.preference.addEventListener.mock.calls[0][1] as () => void;
  onChange(); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.90000");
});

it("opens once in 1.8 seconds, keeps horizontal rollers, and never restarts on route changes", () => {
  const e = environment();
  const { container } = render(<ScrollBackdrop />);
  const layer = container.firstElementChild as HTMLElement;
  expect(layer).toHaveAttribute("data-opening", "true");
  expect(layer.style.getPropertyValue("--scroll-open")).toBe("0.00000");
  expect(container.querySelectorAll(".scroll-roller-top, .scroll-roller-bottom")).toHaveLength(2);
  expect(container.querySelector(".scroll-roller-left, .scroll-roller-right")).toBeNull();
  e.flush(900);
  expect(layer.style.getPropertyValue("--scroll-open")).toBe("0.50000");
  e.flush(1800);
  expect(layer).toHaveAttribute("data-opening", "false");
  expect(layer.style.getPropertyValue("--scroll-open")).toBe("1");
  window.dispatchEvent(new Event("hashchange")); e.flush(2500);
  expect(layer).toHaveAttribute("data-opening", "false");
  expect(e.pending.size).toBe(0);
});
it("smoothly expedites on input without cancelling it, and a new document mount starts closed again", () => {
  const e = environment();
  const first = render(<ScrollBackdrop />);
  e.flush(600);
  const before = Number((first.container.firstElementChild as HTMLElement).style.getPropertyValue("--scroll-open"));
  const wheel = new Event("wheel", { cancelable: true });
  window.dispatchEvent(wheel);
  expect(wheel.defaultPrevented).toBe(false);
  e.flush(110);
  const middle = Number((first.container.firstElementChild as HTMLElement).style.getPropertyValue("--scroll-open"));
  expect(middle).toBeGreaterThan(before); expect(middle).toBeLessThan(1);
  e.flush(220);
  expect(first.container.firstElementChild).toHaveAttribute("data-opening", "false");
  first.unmount();
  const second = render(<ScrollBackdrop />);
  expect(second.container.firstElementChild).toHaveAttribute("data-opening", "true");
  expect((second.container.firstElementChild as HTMLElement).style.getPropertyValue("--scroll-open")).toBe("0.00000");
});
it("skips opening immediately for reduced motion and cancels an in-progress intro when enabled", () => {
  const e = environment(true);
  const { container, unmount } = render(<ScrollBackdrop />);
  expect(container.firstElementChild).toHaveAttribute("data-opening", "false");
  expect(e.pending.size).toBe(0);
  unmount();
  e.preference.matches = false;
  const second = render(<ScrollBackdrop />);
  e.flush(900);
  e.preference.matches = true;
  const handler = e.preference.addEventListener.mock.calls.at(-1)![1] as () => void;
  handler();
  expect(second.container.firstElementChild).toHaveAttribute("data-opening", "false");
  e.flush(1000);
  e.preference.matches = false; handler(); e.flush(1200);
  expect(second.container.firstElementChild).toHaveAttribute("data-opening", "false");
});

it("uses only the internal viewport scroll range and ignores window scroll events", () => {
  const e = environment();
  const { container } = render(<ScrollBackdrop />);
  e.flush();
  const layer = container.firstElementChild as HTMLElement;
  e.y(600);
  window.dispatchEvent(new Event("scroll"));
  expect(e.pending.size).toBe(0);
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.00000");
  e.scroller.dispatchEvent(new Event("scroll")); e.flush();
  expect(layer.style.getPropertyValue("--scroll-progress")).toBe("0.60000");
});

it("keeps the entire header inert until the scroll opens and its separate 250ms fade completes", () => {
  const e = environment();
  const { container } = render(<><ScrollBackdrop /><header className="header"><a href="#home">Home</a></header></>);
  const layer = container.firstElementChild as HTMLElement;
  const header = container.querySelector("header")!;
  expect(layer).toHaveAttribute("data-header-state", "hidden");
  expect(header).toHaveAttribute("inert");
  expect(header).toHaveAttribute("aria-hidden", "true");
  e.flush(1790);
  expect(layer).toHaveAttribute("data-header-state", "hidden");
  e.flush(1800);
  expect(layer).toHaveAttribute("data-opening", "false");
  expect(layer).toHaveAttribute("data-header-state", "fading");
  expect(container.style.getPropertyValue("--scroll-header-reveal")).toBe("0.00000");
  e.flush(1925);
  expect(Number(container.style.getPropertyValue("--scroll-header-reveal"))).toBeGreaterThan(0);
  expect(header).toHaveAttribute("inert");
  e.flush(2050);
  expect(layer).toHaveAttribute("data-header-state", "ready");
  expect(header).not.toHaveAttribute("inert");
  expect(header).not.toHaveAttribute("aria-hidden");
  window.dispatchEvent(new Event("hashchange")); e.flush(3000);
  expect(layer).toHaveAttribute("data-header-state", "ready");
  expect(e.pending.size).toBe(0);
});
it("shows navigation immediately for reduced motion and restores header attributes on teardown", () => {
  const e = environment(true);
  const first = render(<><ScrollBackdrop /><header className="header"><a href="#home">Home</a></header></>);
  expect(first.container.firstElementChild).toHaveAttribute("data-header-state", "ready");
  expect(first.container.querySelector("header")).not.toHaveAttribute("inert");
  first.unmount();
  e.preference.matches = false;
  const second = render(<><ScrollBackdrop /><header className="header"><a href="#home">Home</a></header></>);
  const header = second.container.querySelector("header")!;
  expect(header).toHaveAttribute("inert");
  second.unmount();
  expect(header).not.toHaveAttribute("inert");
  expect(header).not.toHaveAttribute("aria-hidden");
});
it("can skip the navigation fade when reduced motion is enabled mid-intro", () => {
  const e = environment();
  const { container } = render(<><ScrollBackdrop /><header className="header"><a href="#home">Home</a></header></>);
  e.flush(1800);
  expect(container.firstElementChild).toHaveAttribute("data-header-state", "fading");
  e.preference.matches = true;
  const handler = e.preference.addEventListener.mock.calls[0][1] as () => void;
  handler();
  expect(container.firstElementChild).toHaveAttribute("data-header-state", "ready");
  expect(container.querySelector("header")).not.toHaveAttribute("inert");
  e.flush(1900);
  e.preference.matches = false; handler(); e.flush(2500);
  expect(container.firstElementChild).toHaveAttribute("data-header-state", "ready");
});
