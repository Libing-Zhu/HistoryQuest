import { useEffect, useId, useRef } from "react";
import { Expand, X } from "lucide-react";

import { assetBase, chairPhoto } from "./media";
export { chairPhoto } from "./media";
export function ChairImage({
  priority = false,
  sizes = "(max-width: 700px) 92vw, 600px",
}: {
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <img
      src={assetBase + chairPhoto.image}
      srcSet={chairPhoto.widths
        .map((w) => `${assetBase}chair-${w}.webp ${w}w`)
        .join(", ")}
      sizes={sizes}
      alt={chairPhoto.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      width={1920}
      height={2560}
    />
  );
}
export function ChairPhoto({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );
  function close() {
    dialog.current?.close();
  }
  return (
    <>
      <button
        type="button"
        className={`chair-photo ${className}`}
        aria-label="查看百子大礼轿高清照片"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          document.body.style.overflow = "hidden";
        }}
      >
        <ChairImage priority={priority} />
        <span className="photo-zoom">
          <Expand size={15} /> 查看高清
        </span>
      </button>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-labelledby={id}
        onClose={() => {
          document.body.style.overflow = "";
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="photo-toolbar">
          <h2 id={id}>百子大礼轿 · 高清实拍</h2>
          <button
            type="button"
            onClick={close}
            autoFocus
            aria-label="关闭高清照片"
          >
            <X /> 关闭
          </button>
        </div>
        <div className="photo-scroll">
          <img
            src={assetBase + chairPhoto.full}
            alt={chairPhoto.alt}
            width={4284}
            height={5712}
          />
        </div>
        <p>双指缩放或滚动查看细节 · 点击关闭，或按 Esc 返回。</p>
        <a href={assetBase + chairPhoto.full} target="_blank" rel="noreferrer">
          在新窗口打开原尺寸图片
        </a>
      </dialog>
    </>
  );
}
