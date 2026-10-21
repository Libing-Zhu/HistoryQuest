import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Camera, Send, Users, X, Video, Bookmark, Expand } from "lucide-react";
import {
  COMMUNITY_TOPICS,
  emptyDraft,
  readDraft,
  writeDraft,
  storageMessage,
  type Attachment,
  type Draft,
} from "./communityStore";
import { prepareAttachment, MEDIA_HINT } from "./communityMedia";
import {
  sharedSession,
  sharedPosts,
  publishShared,
  deleteShared,
  type SharedMedia,
  type SharedPost,
} from "./sharedCommunity";
type DisplayMedia = Attachment | SharedMedia;

export function CommunityPage({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<"discussion" | "saved">("discussion");
  useEffect(() => {
    if (tab !== "discussion")
      document
        .querySelectorAll<HTMLVideoElement>(".community-discussion video")
        .forEach((video) => video.pause());
  }, [tab]);
  return (
    <section className="section community-page">
      <div className="community-tabs" role="tablist" aria-label="游客社区内容">
        <button
          id="discussion-tab"
          role="tab"
          aria-selected={tab === "discussion"}
          aria-controls="discussion-panel"
          onClick={() => setTab("discussion")}
        >
          <Users size={18} /> 分享发现
        </button>
        <button
          id="collections-tab"
          role="tab"
          aria-selected={tab === "saved"}
          aria-controls="collections-panel"
          onClick={() => setTab("saved")}
        >
          <Bookmark size={18} /> 我的收藏与笔记
        </button>
      </div>
      <div
        id="discussion-panel"
        role="tabpanel"
        aria-labelledby="discussion-tab"
        hidden={tab !== "discussion"}
      >
        <Community />
      </div>
      <div
        id="collections-panel"
        role="tabpanel"
        aria-labelledby="collections-tab"
        hidden={tab !== "saved"}
      >
        {children}
      </div>
    </section>
  );
}
function useMediaURL(blob?: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
function MediaItem({
  media,
  enlarge,
  remove,
}: {
  media: DisplayMedia;
  enlarge: (media: DisplayMedia) => void;
  remove?: () => void;
}) {
  const localURL = useMediaURL(media.blob);
  const url = media.blob ? localURL : (media as SharedMedia).url;
  const [error, setError] = useState(false);
  return (
    <figure className={`community-media-item ${media.kind}`}>
      {url &&
        (media.kind === "image" ? (
          <button
            className="community-photo"
            type="button"
            onClick={() => enlarge(media)}
            aria-label={`放大照片：${media.name}`}
          >
            <img
              src={url}
              alt={media.name}
              loading="lazy"
              onError={() => setError(true)}
            />
            <span>
              <Expand size={14} /> 查看照片
            </span>
          </button>
        ) : (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            onError={() => setError(true)}
          >
            此浏览器无法播放该视频。
          </video>
        ))}
      {error && (
        <p role="status">
          {media.kind === "image" ? "照片" : "视频"}
          暂时无法载入，请尝试重新选择或刷新页面。
        </p>
      )}
      <figcaption>{media.name}</figcaption>
      {remove && (
        <button
          className="attachment-remove"
          type="button"
          onClick={remove}
          aria-label={`移除附件：${media.name}`}
        >
          <X size={16} /> 移除
        </button>
      )}
    </figure>
  );
}
function PhotoDialog({
  media,
  close,
}: {
  media: DisplayMedia;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const localURL = useMediaURL(media.blob);
  const url = media.blob ? localURL : (media as SharedMedia).url;
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="photo-dialog"
      aria-label="游客分享的照片"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className="photo-toolbar">
        <h2>游客分享的照片</h2>
        <button
          type="button"
          autoFocus
          aria-label="关闭游客照片"
          onClick={() => ref.current?.close()}
        >
          <X size={18} />
          关闭
        </button>
      </div>
      <div className="photo-scroll">
        <img src={url} alt={media.name} />
      </div>
      <p>{media.name} · 可缩放查看，按Esc或点击关闭返回。</p>
    </dialog>
  );
}
function Community() {
  const [feedVersion, setFeedVersion] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState<DisplayMedia>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const publishing = useRef(false);
  const active = useRef(true);
  const initialize = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [, saved] = await Promise.all([
        sharedSession(),
        readDraft().catch((e) => {
          if (active.current) setDraftError(storageMessage(e));
          return emptyDraft();
        }),
      ]);
      if (!active.current) return;
      setDraft(saved);
      setReady(true);
    } catch (e) {
      if (active.current) setError(storageMessage(e));
    } finally {
      if (active.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    active.current = true;
    void initialize();
    return () => {
      active.current = false;
    };
  }, [initialize]);
  useEffect(() => {
    if (!ready || busy) return;
    timer.current = setTimeout(() => {
      void writeDraft(draft)
        .then(() => {
          if (active.current) setDraftError("");
        })
        .catch((e) => {
          if (active.current) setDraftError(storageMessage(e));
        });
    }, 450);
    return () => clearTimeout(timer.current);
  }, [draft, ready, busy]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (ready && !publishing.current)
        void writeDraft(draftRef.current).catch(() => {});
    },
    [ready],
  );
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const accepted: Attachment[] = [];
    const failures: string[] = [];
    for (const file of Array.from(files)) {
      const current = [...draftRef.current.media, ...accepted];
      const image = file.type.startsWith("image/");
      if (
        current.filter((m) => m.kind === (image ? "image" : "video")).length >=
        (image ? 3 : 1)
      ) {
        failures.push(`${file.name}：每条最多3张照片和1个视频。`);
        continue;
      }
      try {
        accepted.push(await prepareAttachment(file));
      } catch (e) {
        failures.push(storageMessage(e));
      }
    }
    if (active.current) {
      if (accepted.length)
        setDraft((old) => ({ ...old, media: [...old.media, ...accepted] }));
      setError(failures.join(" "));
      setUploading(false);
    }
  }
  async function publish() {
    if (publishing.current) return;
    publishing.current = true;
    clearTimeout(timer.current);
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await publishShared(draftRef.current);
      const cleared = { ...emptyDraft(), nickname: draftRef.current.nickname };
      draftRef.current = cleared;
      setDraft(cleared);
      setStatus("分享已发布，其他游客可在游客分享中查看。");
      setFeedVersion((v) => v + 1);
      setDraftError("");
    } catch (e) {
      setError(storageMessage(e));
    } finally {
      publishing.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="community-discussion">
      {loading && <p role="status">正在打开发布区…</p>}
      {error && (
        <div className="community-error" role="alert">
          {error}
          {!ready && (
            <button type="button" onClick={() => void initialize()}>
              重试加载
            </button>
          )}
        </div>
      )}
      {ready && (
        <>
          <form
            className="community-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void publish();
            }}
          >
            <div className="community-card-heading">
              <span className="eyebrow">SHARE A DISCOVERY</span>
              <h3>分享你的参观发现</h3>
            </div>
            <div className="community-form-row">
              <label>
                昵称（选填）
                <input
                  value={draft.nickname}
                  maxLength={24}
                  placeholder="匿名游客"
                  disabled={busy}
                  onChange={(e) =>
                    setDraft({ ...draft, nickname: e.target.value })
                  }
                />
              </label>
              <label>
                分享主题
                <select
                  value={draft.topic}
                  disabled={busy}
                  onChange={(e) =>
                    setDraft({ ...draft, topic: e.target.value })
                  }
                >
                  {COMMUNITY_TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="share-text-label">
              你的参观感受或问题
              <textarea
                value={draft.text}
                maxLength={2000}
                rows={4}
                disabled={busy}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder="哪件展品、哪个细节让你停了下来？也可以分享一个还没找到答案的问题。"
              />
            </label>
            <div className="community-compose-meta">
              <small>草稿自动保存在此浏览器</small>
              <small>{draft.text.length}/2000</small>
            </div>
            <label className="community-upload">
              <Camera size={18} />
              <Video size={18} /> 添加照片 / 视频
              <input
                aria-label="添加照片或短视频"
                type="file"
                aria-describedby="media-hint"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                disabled={uploading || busy}
                onChange={(e) => {
                  void upload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <p id="media-hint" className="community-help">
              {MEDIA_HINT}
              <span className="community-formats">
                JPG / PNG / WebP · MP4 / WebM；大图自动优化。
              </span>
            </p>
            {uploading && <p role="status">正在检查并优化附件，请稍候…</p>}
            {draft.media.length > 0 && (
              <div
                className="community-attachments"
                aria-label="待发布附件预览"
              >
                {draft.media.map((media) => (
                  <MediaItem
                    key={media.id}
                    media={media}
                    enlarge={setPhoto}
                    remove={
                      busy
                        ? undefined
                        : () =>
                            setDraft((old) => ({
                              ...old,
                              media: old.media.filter(
                                (item) => item.id !== media.id,
                              ),
                            }))
                    }
                  />
                ))}
              </div>
            )}
            {(draft.text.trim() || draft.media.length > 0) && (
              <details className="community-text-preview">
                <summary>预览分享内容</summary>
                <b>
                  {draft.nickname.trim() || "匿名游客"} · {draft.topic}
                </b>
                <p className="visitor-text">{draft.text || "（仅分享附件）"}</p>
                <small>附件预览见上方，可在发布前移除。</small>
              </details>
            )}
            {draftError && (
              <p className="community-error" role="alert">
                草稿未能自动保存：{draftError}
              </p>
            )}
            <div className="community-publish-row">
              <p className="community-help">
                请分享与参观有关的内容，上传你有权分享的照片或视频，并尊重他人隐私。
              </p>
              <button
                className="btn primary"
                type="submit"
                disabled={
                  busy ||
                  uploading ||
                  (!draft.text.trim() && !draft.media.length)
                }
              >
                <Send size={17} />
                {busy ? "正在发布…" : "发布分享"}
              </button>
            </div>
          </form>
        </>
      )}
      <p className="community-feedback" role="status">
        {status}
      </p>
      {ready && <SharedFeed version={feedVersion} enlarge={setPhoto} />}
      {photo && <PhotoDialog media={photo} close={() => setPhoto(undefined)} />}
    </div>
  );
}

function SharedFeed({
  version,
  enlarge,
}: {
  version: number;
  enlarge: (media: DisplayMedia) => void;
}) {
  const [posts, setPosts] = useState<SharedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");
  const generation = useRef(0);
  const load = useCallback(async (next?: string) => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const page = await sharedPosts(next);
      if (current !== generation.current) return;
      setPosts((old) =>
        next
          ? Array.from(
              new Map([...old, ...page.posts].map((p) => [p.id, p])).values(),
            )
          : page.posts,
      );
      setCursor(page.cursor);
    } catch (e) {
      if (current === generation.current) setError(storageMessage(e));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => {
      if (
        document.visibilityState === "visible" &&
        !document.getElementById("discussion-panel")?.hidden
      )
        void load();
    };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      generation.current++;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [version, load]);
  async function remove(post: SharedPost) {
    if (!window.confirm("确定删除这条公开分享及其附件吗？")) return;
    setRemoving(post.id);
    setError("");
    try {
      await deleteShared(post.id);
      await load();
    } catch (e) {
      setError(storageMessage(e));
    } finally {
      setRemoving("");
    }
  }
  return (
    <section className="shared-feed" aria-label="游客分享">
      <div className="shared-feed-heading">
        <h3>游客分享</h3>
        <button
          className="text-link"
          type="button"
          disabled={loading}
          onClick={() => void load()}
        >
          刷新分享
        </button>
      </div>
      {error && (
        <p className="community-error" role="alert">
          {error}
          <button type="button" onClick={() => void load()}>
            重试
          </button>
        </p>
      )}
      {loading && (
        <p className="community-help" role="status">
          正在读取分享…
        </p>
      )}
      {!loading && !error && !posts.length && (
        <p className="community-help">还没有分享，欢迎记录你的第一个发现。</p>
      )}
      {posts.map((post) => (
        <article className="shared-post" key={post.id}>
          <header>
            <strong>{post.nickname}</strong>
            <time dateTime={new Date(post.at).toISOString()}>
              {new Date(post.at).toLocaleString("zh-CN")}
            </time>
            <span>{post.topic}</span>
          </header>
          {post.text && <p className="visitor-text">{post.text}</p>}
          {!!post.media.length && (
            <div className="community-attachments">
              {post.media.map((media) => (
                <MediaItem key={media.id} media={media} enlarge={enlarge} />
              ))}
            </div>
          )}
          {post.mine && (
            <button
              className="text-link shared-delete"
              type="button"
              disabled={!!removing}
              onClick={() => void remove(post)}
            >
              {removing === post.id ? "正在删除…" : "删除我的分享"}
            </button>
          )}
        </article>
      ))}
      {cursor && (
        <button
          className="btn"
          type="button"
          disabled={loading}
          onClick={() => void load(cursor)}
        >
          加载更多
        </button>
      )}
    </section>
  );
}
