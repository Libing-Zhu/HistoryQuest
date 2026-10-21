import { useLayoutEffect, useRef } from "react";

/** A decorative vertical scroll. It never changes document flow or handles input. */
export function ScrollBackdrop() {
  const layer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const current = layer.current;
    if (!current) return;
    const element: HTMLDivElement = current;
    const root = element.parentElement;
    const scroller = document.getElementById("main");
    const header = root?.querySelector<HTMLElement>(".header");
    const hadInert = header?.hasAttribute("inert") || false;
    const previousAria = header?.getAttribute("aria-hidden") ?? null;
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = "";
    let disposed = false;
    let opening = !motion?.matches;
    let openness = opening ? 0 : 1;
    let from = 0;
    let started = performance.now();
    let duration = 1800;
    let accelerated = false;
    let headerState: "hidden" | "fading" | "ready" = "hidden";
    let headerFadeStarted = 0;
    const restoreHeaderInteraction = () => {
      if (!hadInert) header?.removeAttribute("inert");
      if (previousAria === null) header?.removeAttribute("aria-hidden");
      else header?.setAttribute("aria-hidden", previousAria);
    };
    const setHeader = (state: typeof headerState, reveal: number) => {
      headerState = state;
      element.dataset.headerState = state;
      root?.style.setProperty("--scroll-header-reveal", reveal.toFixed(5));
      if (state === "ready") restoreHeaderInteraction();
      else {
        header?.setAttribute("inert", "");
        header?.setAttribute("aria-hidden", "true");
      }
    };
    setHeader(opening ? "hidden" : "ready", opening ? 0 : 1);
    element.dataset.opening = String(opening);
    element.style.setProperty("--scroll-open", String(openness));

    const finish = (now: number) => {
      opening = false;
      openness = 1;
      element.style.setProperty("--scroll-open", "1");
      element.dataset.opening = "false";
      root?.style.removeProperty("--scroll-content-reveal");
      root?.style.removeProperty("--scroll-content-open");
      if (motion?.matches) setHeader("ready", 1);
      else if (headerState === "hidden") {
        headerFadeStarted = now;
        setHeader("fading", 0);
      }
    };
    const schedule = () => {
      if (!frame && !disposed) frame = window.requestAnimationFrame(paint);
    };
    function paint(now: number) {
      frame = 0;
      if (disposed) return;
      const height = scroller ? scroller.scrollHeight - scroller.clientHeight : 0;
      const progress = motion?.matches || height <= 1
        ? 0
        : Math.max(0, Math.min(1, (scroller?.scrollTop || 0) / height));
      const value = progress.toFixed(5);
      if (value !== previous) {
        element.style.setProperty("--scroll-progress", value);
        previous = value;
      }
      if (motion?.matches) {
        finish(now);
      } else if (opening) {
        const t = Math.max(0, Math.min(1, (now - started) / duration));
        const ease = accelerated
          ? 1 - (1 - t) ** 3
          : t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        openness = from + (1 - from) * ease;
        element.style.setProperty("--scroll-open", openness.toFixed(5));
        // Opacity only: text never scales, clips, moves or leaves the document flow.
        const reveal = Math.max(0, Math.min(1, (openness - 0.18) / 0.82));
        root?.style.setProperty("--scroll-content-reveal", reveal.toFixed(5));
        root?.style.setProperty("--scroll-content-open", openness.toFixed(5));
        if (t === 1) finish(now);
        else schedule();
      }
      if (!opening && headerState === "fading") {
        const t = Math.max(0, Math.min(1, (now - headerFadeStarted) / 250));
        setHeader(t === 1 ? "ready" : "fading", 1 - (1 - t) ** 3);
        if (t < 1) schedule();
      }
    }
    const expedite = () => {
      if (!opening || accelerated) return;
      from = openness;
      started = performance.now();
      duration = 220;
      accelerated = true;
      schedule();
    };
    const preferenceChanged = () => {
      // Turning motion back on must never replay the opening sequence.
      if (motion?.matches) finish(performance.now());
      schedule();
    };
    const resize = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(schedule);
    resize?.observe(document.documentElement);
    if (scroller) resize?.observe(scroller);
    const content = scroller?.querySelector(".scroll-content");
    if (content) resize?.observe(content);
    scroller?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("pageshow", schedule);
    const inputEvents = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputEvents.forEach(type => window.addEventListener(type, expedite, { passive: true }));
    motion?.addEventListener("change", preferenceChanged);
    paint(started);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resize?.disconnect();
      restoreHeaderInteraction();
      root?.style.removeProperty("--scroll-header-reveal");
      root?.style.removeProperty("--scroll-content-reveal");
      root?.style.removeProperty("--scroll-content-open");
      scroller?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("pageshow", schedule);
      inputEvents.forEach(type => window.removeEventListener(type, expedite));
      motion?.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return (
    <div ref={layer} className="scroll-backdrop" data-opening="true" data-header-state="hidden" aria-hidden="true">
      <div className="scroll-frame">
        <div className="scroll-paper-window">
          <div className="scroll-paper">
            <div className="scroll-paper-grain" />
            <div className="scroll-paper-light" />
          </div>
        </div>
        <div className="scroll-roller scroll-roller-top"><i /></div>
        <div className="scroll-roller scroll-roller-bottom"><i /></div>
      </div>
    </div>
  );
}
