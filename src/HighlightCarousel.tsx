import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Highlight } from "./mapHighlights";
import { assetBase } from "./data";
import "./highlight-carousel.css";

export default function HighlightCarousel({ items, selected, select }: {
  items: Highlight[]; selected: string; select: (item: Highlight) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLDivElement>(null);
  const flags = useRef({ hover: false, focus: false, visible: false, dragging: false, hidden: false, until: 0 });
  const drag = useRef<{ id: number; x: number; left: number; moved: boolean } | undefined>(undefined);
  const suppressClick = useRef(false);
  const cycle = useRef(0);
  const [eligible, setEligible] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [paused, setPaused] = useState(false);
  const looping = eligible && overflow;
  const key = items.map(h => h.id).join(":");
  useEffect(() => {
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const update = () => setEligible(!!pointer?.matches && !motion?.matches && window.innerWidth > 700);
    update();
    motion?.addEventListener("change", update); pointer?.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => { motion?.removeEventListener("change", update); pointer?.removeEventListener("change", update); window.removeEventListener("resize", update); };
  }, []);
  useLayoutEffect(() => {
    const el = viewport.current, group = original.current;
    if (!el || !group) return;
    const measure = () => { cycle.current = group.scrollWidth; setOverflow(group.scrollWidth > el.clientWidth + 1); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(el); observer?.observe(group);
    return () => observer?.disconnect();
  }, [key]);
  useLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollLeft = looping ? cycle.current : 0;
  }, [looping, key]);
  useEffect(() => {
    const el = viewport.current;
    if (!el || !looping) return;
    const observer = new IntersectionObserver(([entry]) => { flags.current.visible = entry.isIntersecting; }, { root: document.getElementById("main") });
    observer.observe(el);
    const visibility = () => { flags.current.hidden = document.hidden; };
    visibility(); document.addEventListener("visibilitychange", visibility);
    let frame = 0, last = 0, position = el.scrollLeft;
    const tick = (time: number) => {
      const elapsed = last ? Math.min(time - last, 64) : 0; last = time;
      const f = flags.current;
      if (!paused && !f.hover && !f.focus && !f.dragging && !f.hidden && f.visible && time > f.until && cycle.current > 0) {
        position += elapsed * 0.02; // Accumulate fractions even when the browser rounds scrollLeft.
        if (position >= cycle.current * 2) position -= cycle.current;
        if (position < cycle.current) position += cycle.current;
        el.scrollLeft = position;
      } else position = el.scrollLeft;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, [looping, paused, key]);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      flags.current.until = performance.now() + 1000;
      if (e.shiftKey && !e.deltaX && el.scrollWidth > el.clientWidth) { e.preventDefault(); el.scrollLeft += e.deltaY; }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [key]);
  const settle = () => {
    const el = viewport.current;
    if (looping && el && cycle.current) el.scrollLeft = cycle.current + ((el.scrollLeft % cycle.current) + cycle.current) % cycle.current;
  };
  function group(clone: boolean, suffix: string) {
    return <div className="highlight-carousel-group" ref={clone ? undefined : original} aria-hidden={clone || undefined} key={suffix}>
      {items.map(h => <button type="button" key={h.id} tabIndex={clone ? -1 : undefined} aria-pressed={h.id === selected}
        onMouseDown={clone ? e => e.preventDefault() : undefined}
        onClick={() => select(h)}>
        <img loading="lazy" draggable={false} src={assetBase + "highlights/" + h.image} alt="" />
        <span>{h.short}
          <small>{h.floor}F · {h.region === "lobby" ? "序厅参考" : h.region.slice(1) + "号展区参考"}</small>
        </span>
      </button>)}
    </div>;
  }
  if (!items.length) return null;
  return <div className="highlight-carousel" onPointerEnter={e => { if (e.pointerType === "mouse") flags.current.hover = true; }} onPointerLeave={() => { flags.current.hover = false; }}
    onFocusCapture={() => { flags.current.focus = true; }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) flags.current.focus = false; }}>
    {looping && <div className="highlight-carousel-controls"><button type="button" aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? "继续滚动" : "暂停滚动"}</button></div>}
    <div className="highlight-strip" ref={viewport} role="region" aria-label="重点文物横向列表" tabIndex={0}
      onFocusCapture={e => {
        const el = viewport.current, target = e.target as HTMLElement;
        if (!el || target === el) return;
        const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
        if (b.left < a.left + 6) el.scrollLeft += b.left - a.left - 6;
        else if (b.right > a.right - 6) el.scrollLeft += b.right - a.right + 6;
      }}
      onPointerDown={e => {
        suppressClick.current = false;
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        drag.current = { id: e.pointerId, x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 6) { d.moved = true; flags.current.dragging = true; suppressClick.current = true; e.currentTarget.setPointerCapture(e.pointerId); }
        if (d.moved) { e.preventDefault(); e.currentTarget.scrollLeft = d.left - dx; }
      }}
      onPointerUp={e => {
        if (drag.current?.id !== e.pointerId) return;
        drag.current = undefined; flags.current.dragging = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        flags.current.until = performance.now() + 600; settle();
      }}
      onPointerCancel={() => { drag.current = undefined; flags.current.dragging = false; }}
      onClickCapture={e => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}>
      <div className="highlight-carousel-track">
        {looping && group(true, "before")}{group(false, "original")}{looping && group(true, "after")}
      </div>
    </div>
  </div>;
}
