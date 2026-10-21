import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FocusEvent, PointerEvent } from "react";
import type { Highlight } from "./mapHighlights";
import { assetBase } from "./data";
import "./map-preview.css";

// Fixed portal stays outside the SVG and clipped scroll viewport.
export function useMapPreview(resetKey: string) {
  const id = useId();
  const [preview, setPreview] = useState<{ item: Highlight; left: number; top: number }>();
  const anchorRef = useRef<{ item: Highlight; target: Element } | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => { clearTimeout(timer.current); };
  const close = () => { cancel(); anchorRef.current = undefined; setPreview(undefined); };
  const leave = () => { cancel(); timer.current = setTimeout(() => { anchorRef.current = undefined; setPreview(undefined); }, 180); };
  useEffect(() => {
    anchorRef.current = undefined;
    setPreview(undefined);
    const main = document.getElementById("main");
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { clearTimeout(timer.current); anchorRef.current = undefined; setPreview(undefined); } };
    const dismiss = () => { clearTimeout(timer.current); anchorRef.current = undefined; setPreview(undefined); };
    const reposition = () => {
      const current = anchorRef.current;
      if (!current) return;
      const rect = current.target.getBoundingClientRect();
      const bounds = main?.getBoundingClientRect();
      if (bounds && (rect.bottom < bounds.top || rect.top > bounds.bottom)) dismiss();
      else show(current.item, current.target);
    };
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", dismiss);
    main?.addEventListener("scroll", reposition, { passive: true });
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", dismiss);
      main?.removeEventListener("scroll", reposition);
    };
  }, [resetKey]);
  function show(item: Highlight, target: Element) {
    cancel();
    anchorRef.current = { item, target };
    const anchor = target.getBoundingClientRect();
    const bounds = document.getElementById("main")?.getBoundingClientRect();
    const leftEdge = Math.max(8, bounds?.left ?? 8);
    const rightEdge = Math.min(window.innerWidth - 8, bounds?.right ?? window.innerWidth - 8);
    const topEdge = Math.max(8, bounds?.top ?? 8);
    const bottomEdge = Math.min(window.innerHeight - 8, bounds?.bottom ?? window.innerHeight - 8);
    const width = Math.min(210, rightEdge - leftEdge - 16);
    const height = 198;
    const right = anchor.right + 10;
    const left = right + width <= rightEdge ? right : anchor.left - width - 10;
    setPreview({ item, left: Math.max(leftEdge + 8, Math.min(left, rightEdge - width - 8)), top: Math.max(topEdge + 8, Math.min(anchor.top, bottomEdge - height - 8)) });
  }
  function bindings(item: Highlight) {
    return {
      "aria-describedby": preview?.item.id === item.id ? id : undefined,
      onPointerEnter: (e: PointerEvent<SVGGElement>) => {
        if (e.pointerType === "mouse" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) show(item, e.currentTarget);
      },
      onPointerLeave: leave,
      onFocus: (e: FocusEvent<SVGGElement>) => {
        // Touch-generated focus must not add an extra interaction layer.
        if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) show(item, e.currentTarget);
      },
      onBlur: leave,
    };
  }
  return {
    bindings, close,
    layer: preview ? createPortal(
      <div id={id} role="tooltip" className="map-object-preview" style={{ left: preview.left, top: preview.top }} onPointerEnter={cancel} onPointerLeave={leave}>
        <PreviewImage key={preview.item.id} item={preview.item} />
        <strong>{preview.item.short}</strong>
      </div>, document.body) : null,
  };
}
function PreviewImage({ item }: { item: Highlight }) {
  const [failed, setFailed] = useState(false);
  return <div className="map-preview-image">{item.image && !failed ? <img src={assetBase + "highlights/" + item.image} alt={item.name} onError={() => setFailed(true)} /> : <span>暂无图片</span>}</div>;
}
