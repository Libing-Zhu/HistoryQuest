import { CommunityPage } from "./Community";
import { ChairPhoto, ChairImage, chairPhoto } from "./ChairPhoto";
import {
  NarratedText,
  AudioNarration,
  AudioEnvironment,
} from "./AudioNarration";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  BookOpen,
  Compass,
  Home,
  Map,
  Search,
  ChevronRight,
  Play,
  RotateCcw,
  Download,
  Network,
  Info,
  X,
} from "lucide-react";
import {
  artifacts,
  topics,
  sources,
  assetBase,
  type Artifact,
  type Topic,
  topicNarration,
} from "./data";
import EastBuildingMap from "./EastBuildingMap";
import {
  fresh,
  parseProgress,
  STORAGE_KEY,
  toggle,
  searchText,
  type Progress,
} from "./state";
type Page =
  | "home"
  | "map"
  | "discovery"
  | "story"
  | "hub"
  | "saved"
  | "project";
const pages: Page[] = [
  "home",
  "map",
  "discovery",
  "story",
  "hub",
  "saved",
  "project",
];
function route() {
  const [p, id] = location.hash.slice(1).split("/");
  return {
    page: pages.includes(p as Page) ? (p as Page) : ("home" as Page),
    id: id || "chair",
  };
}
const labels: Record<Page, string> = {
  home: "首页",
  map: "自由探索",
  discovery: "观察与解谜",
  story: "文物故事",
  hub: "好奇心中心",
  saved: "游客社区",
  project: "作业展示",
};
function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "demo" ? "pending" : ""}`}>
      {status === "verified"
        ? "来源已核实"
        : status === "demo"
          ? "演示 · 资料待核实"
          : "探索方法"}
    </span>
  );
}
export default function App() {
  const [r, setR] = useState(route);
  const [p, setP] = useState<Progress>(() => {
    try {
      return parseProgress(localStorage.getItem(STORAGE_KEY));
    } catch {
      return fresh();
    }
  });
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [reset, setReset] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const initial = useRef(true);
  const artifact = artifacts.find((a) => a.id === r.id) || artifacts[0];
  useEffect(() => {
    const f = () => setR(route());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [p]);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    document.getElementById("main")?.scrollTo({ top: 0, behavior: "instant" });
    title.current?.focus({ preventScroll: true });
  }, [r.page, r.id]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  function event(type: string, id: string, change?: (s: Progress) => Progress) {
    setP((s) => {
      const next = change ? change(s) : s;
      return {
        ...next,
        events: [...s.events, { type, id, at: new Date().toISOString() }].slice(
          -500,
        ),
      };
    });
  }
  function go(page: Page, id?: string) {
    location.hash = `${page}${id ? "/" + id : ""}`;
    if (page === "story") event("story_open", id || "chair");
    if (page === "discovery")
      event("artifact_open", id || "chair", (s) => ({
        ...s,
        viewed: [...new Set([...s.viewed, id || "chair"])],
      }));
    if (page === "hub" && id)
      event("topic_read", id, (s) => ({
        ...s,
        read: [...new Set([...s.read, id])],
      }));
  }
  function save(id: string) {
    const had = p.saved.includes(id);
    event(had ? "unsave" : "save", id, (s) => ({
      ...s,
      saved: toggle(s.saved, id),
    }));
    setNotice(had ? "已移出收藏" : "已保存，离馆后也能继续阅读");
  }
  function saveControl(id: string) {
    return (
      <button
        className={`save ${p.saved.includes(id) ? "is-saved" : ""}`}
        onClick={() => save(id)}
        aria-label={`${p.saved.includes(id) ? "取消收藏" : "收藏"}${artifacts.find((a) => a.id === id)?.name || topics.find((t) => t.id === id)?.title}`}
        aria-pressed={p.saved.includes(id)}
      >
        <Bookmark
          size={18}
          fill={p.saved.includes(id) ? "currentColor" : "none"}
        />
        {p.saved.includes(id) ? "已收藏" : "收藏"}
      </button>
    );
  }
  function sourceLinks(ids: string[]) {
    return (
      <div className="sources">
        {sources
          .filter((s) => ids.includes(s.id))
          .map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => event("official_link_open", s.id)}
            >
              <span>
                {s.publisher}
                <b>{s.title}</b>
                <small>
                  {s.verification === "provided" ? "尝试读取" : "核查"}：
                  {s.checked} · 新窗口打开{s.note && ` · ${s.note}`}
                </small>
              </span>
              <ArrowUpRight size={20} />
            </a>
          ))}
      </div>
    );
  }
  const artCard = (a: Artifact) => (
    <article className="artifact-card" key={a.id}>
      <button
        className="art-image"
        onClick={() => go("discovery", a.id)}
        aria-label={`观察${a.name}`}
      >
        {a.id === "chair" ? (
          <ChairImage sizes="(max-width: 700px) 90vw, 400px" />
        ) : (
          <img loading="lazy" src={assetBase + a.image} alt={a.alt} />
        )}
        <span className="round-arrow">
          <ArrowUpRight />
        </span>
      </button>
      <div className="card-info">
        <span className="eyebrow">{a.theme}</span>
        <div className="flex items-center justify-between gap-2">
          <button
            className="title-button"
            onClick={() => go("discovery", a.id)}
          >
            {a.name}
          </button>
          {saveControl(a.id)}
        </div>
        <NarratedText>{a.lead}</NarratedText>
      </div>
    </article>
  );
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳转到主要内容
      </a>
      <header className="header">
        <a
          href="#home"
          className="brand"
          aria-label="HistoryQuest 寻迹上海首页"
        >
          <span className="brand-icon">迹</span>
          <span>
            <span className="brand-title">寻迹上海</span>
            <small>HISTORYQUEST · 城市记忆探索计划</small>
          </span>
        </a>
        <nav aria-label="主导航" className="desktop-nav">
          {(["home", "hub", "map", "saved"] as Page[]).map((pg) => (
            <a
              key={pg}
              className={r.page === pg ? "active" : ""}
              href={`#${pg}`}
              aria-current={r.page === pg ? "page" : undefined}
            >
              {labels[pg]}
            </a>
          ))}
        </nav>
      </header>
      <AudioEnvironment />
      <main id="main" tabIndex={0}>
        <div className="scroll-content">
        {r.page === "home" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <h1 ref={title} tabIndex={-1}>
                  一件文物，
                  <br />
                  一座城市的<span>回响。</span>
                </h1>
                <NarratedText className="hero-desc">
                  从眼前的细节出发，让好奇心带路。
                  <br />
                  发现文物的故事，也发现你想追问的历史。
                </NarratedText>
                <div className="hero-actions">
                  <button className="btn gold-btn" onClick={() => go("map")}>
                    开启自由探索 <ArrowRight size={18} />
                  </button>
                  <button className="hero-secondary" onClick={() => go("hub")}>
                    带着问题出发 <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>
              <div className="hero-visual">
                <div className="orb" />
                <div className="archive-grid" />
                <ChairPhoto className="hero-chair" priority />
                <div className="vertical">SHANGHAI · OBJECTS & MEMORIES</div>
                <div className="object-label">
                  <strong>百子大礼轿</strong>
                  <small>1936 · 正式名称与年代见官方目录</small>
                </div>
                <span className="hero-stamp">
                  以物
                  <br />
                  见史
                </span>
              </div>
            </section>
            <div className="intro-strip">
              <span>
                <Compass size={19} /> 没有固定路线，让好奇心决定方向
              </span>
            </div>
            <section className="section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">START WITH AN OBJECT</span>
                  <h2>今天，什么让你好奇？</h2>
                </div>
                <button className="text-link" onClick={() => go("map")}>
                  查看探索地图 <ArrowRight size={17} />
                </button>
              </div>
              <NarratedText className="section-desc">
                选择一件文物，停下来观察。你可以解谜，也可以直接阅读故事。
              </NarratedText>
              <div className="artifact-grid">{artifacts.map(artCard)}</div>
            </section>
            <section className="section field-section">
              <div>
                <span className="eyebrow">FROM OUR FIELD VISIT</span>
                <h2>
                  在真实的现场，
                  <br />
                  连接数字与历史。
                </h2>
                <button className="text-link" onClick={() => go("project")}>
                  查看项目与证据边界 <ArrowRight size={17} />
                </button>
              </div>
              <figure>
                <img
                  loading="lazy"
                  src={assetBase + "building.webp"}
                  alt="小组现场截图中的博物馆建筑外观"
                />
                <figcaption>实地观察资料 · 原始照片见素材清单</figcaption>
              </figure>
              <figure>
                <img
                  loading="lazy"
                  src={assetBase + "ar.webp"}
                  alt="现场AR服务宣传立牌，文字细节请以原图核对"
                />
                <figcaption>现有数字服务触点 · 不代表使用效果</figcaption>
              </figure>
            </section>
            <section className="curiosity-banner">
              <span className="eyebrow gold">
                CURIOSITY DOESN’T END AT THE EXIT
              </span>
              <h2>
                离开博物馆，
                <br />
                探索才刚刚开始。
              </h2>
              <NarratedText>
                把一个问题装进口袋，沿着人物、地点与事件继续寻找。
              </NarratedText>
              <button className="btn light-btn" onClick={() => go("saved")}>
                进入游客社区 <ArrowUpRight size={18} />
              </button>
              <span className="banner-mark">?</span>
            </section>
          </>
        ) : (
          <>
            <div
              className={`page-head ${r.page === "saved" ? "community-head" : ""}`}
            >
              <div>
                <span className="eyebrow">
                  {r.page === "project"
                    ? "IFB405TC / EXPERIENCE & SERVICE DESIGN"
                    : "YOUR CURIOSITY, YOUR JOURNEY"}
                </span>
                <h1 ref={title} tabIndex={-1}>
                  {labels[r.page]}
                </h1>
                {r.page === "saved" && (
                  <p className="community-tagline">
                    记录一次参观，分享一个发现。
                  </p>
                )}
              </div>
              <button className="text-link" onClick={() => go("home")}>
                <Home size={16} /> 返回首页
              </button>
            </div>
            {r.page === "map" && (
              <EastBuildingMap
                viewed={p.viewed}
                open={(a) => go("discovery", a.id)}
              />
            )}
            {r.page === "discovery" && (
              <section className="detail-grid">
                <div className="artifact-portrait">
                  {artifact.id === "chair" ? (
                    <ChairPhoto className="detail-chair" />
                  ) : (
                    <img
                      loading="lazy"
                      src={assetBase + artifact.image}
                      alt={artifact.alt}
                    />
                  )}
                  <div>
                    <span className="eyebrow">OBSERVE BEFORE YOU SCROLL</span>
                    <h2>{artifact.name}</h2>
                    <NarratedText>
                      {artifact.era} · {artifact.theme}
                    </NarratedText>
                  </div>
                  <div className="artifact-caption">
                    <NarratedText>{artifact.caption}</NarratedText>
                  </div>
                </div>
                <div className="detail-content">
                  {artifact.id !== "chair" && <Badge status={artifact.status} />}
                  <h2>{artifact.lead}</h2>
                  <NarratedText>{artifact.observe}</NarratedText>
                  <label className="check-line">
                    <input
                      type="checkbox"
                      checked={p.observed.includes(artifact.id)}
                      onChange={() =>
                        event("observation_toggle", artifact.id, (s) => ({
                          ...s,
                          observed: toggle(s.observed, artifact.id),
                        }))
                      }
                    />
                    我已观察实物 / 演示照片
                  </label>
                  <Puzzle
                    key={artifact.id}
                    a={artifact}
                    onAnswer={(n) =>
                      event("puzzle_answer", artifact.id, (s) => ({
                        ...s,
                        answers: { ...s.answers, [artifact.id]: n },
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="btn primary"
                      onClick={() => go("story", artifact.id)}
                    >
                      阅读文物故事 <ArrowRight size={18} />
                    </button>
                    {artifact.id !== "chair" && (
                    <button
                      className="btn outline"
                      onClick={() => {
                        event("puzzle_skip", artifact.id, (s) => ({
                          ...s,
                          skipped: [...new Set([...s.skipped, artifact.id])],
                        }));
                        go("story", artifact.id);
                      }}
                    >
                      跳过谜题，直接了解
                    </button>
                    )}
                  </div>
                  <NarratedText className="muted small">
                    不需要答对才能阅读，也没有强制的下一站。
                  </NarratedText>
                  {saveControl(artifact.id)}
                </div>
              </section>
            )}
            {r.page === "story" && (
              <>
                <Story key={artifact.id} a={artifact} />
                <section className="section narrow">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">WHAT WE CAN VERIFY</span>
                      <h2>从故事回到史料</h2>
                    </div>
                    {saveControl(artifact.id)}
                  </div>
                  <NarratedText>{artifact.fact}</NarratedText>
                  {sourceLinks(artifact.sourceIds)}
                  <label className="note-label">
                    留给自己的一个问题
                    <textarea
                      maxLength={2000}
                      value={p.notes[artifact.id] || ""}
                      onChange={(e) =>
                        setP((s) => ({
                          ...s,
                          notes: { ...s.notes, [artifact.id]: e.target.value },
                        }))
                      }
                      placeholder="例如：这些装饰由谁制作？我想在哪里找到答案？"
                    />
                  </label>
                  <div className="section-heading mt-10">
                    <div>
                      <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
                      <h2>关于这段历史，你还想知道什么？</h2>
                    </div>
                  </div>
                  <div className="topic-grid">
                    {topics
                      .filter((t) => artifact.related.includes(t.id))
                      .map((t) => (
                        <button
                          key={t.id}
                          className="question-card"
                          onClick={() => go("hub", t.id)}
                        >
                          <span className="eyebrow">{t.type}</span>
                          <h3>{t.title}</h3>
                          <NarratedText>{t.summary}</NarratedText>
                          <ArrowUpRight size={18} />
                        </button>
                      ))}
                  </div>
                  <button className="text-link mt-6" onClick={() => go("map")}>
                    <ArrowLeft size={17} /> 返回地图，自由选择
                  </button>
                </section>
              </>
            )}
            {r.page === "hub" && (
              <Hub
                key={r.id}
                selected={r.id}
                select={(id) => go("hub", id)}
                save={saveControl}
                sources={sourceLinks}
              />
            )}
            {r.page === "saved" && (
              <CommunityPage>
                <section className="saved-page">
                  <div className="saved-intro">
                    <Bookmark size={28} />
                    <div>
                      <h2>把好奇心带回家</h2>
                      <NarratedText>
                        已收藏 {p.saved.length} 项 · 已打开 {p.viewed.length}{" "}
                        件观察档案 · 已阅读 {p.read.length} 张知识卡
                      </NarratedText>
                      <small>
                        仅保存在当前浏览器，不会同步到微信或其他设备。
                      </small>
                    </div>
                  </div>
                  {!p.saved.length ? (
                    <div className="empty">
                      <BookOpen size={42} />
                      <h2>你的发现，等待被收藏</h2>
                      <NarratedText>
                        在文物故事或知识卡片中点击“收藏”，离馆后回来继续读。
                      </NarratedText>
                      <button className="btn primary" onClick={() => go("map")}>
                        去找一个好问题 <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="artifact-grid">
                        {artifacts
                          .filter((a) => p.saved.includes(a.id))
                          .map(artCard)}
                      </div>
                      <div className="topic-grid mt-6">
                        {topics
                          .filter((t) => p.saved.includes(t.id))
                          .map((t) => (
                            <article className="paper-card" key={t.id}>
                              <Badge status={t.status} />
                              <h3>{t.title}</h3>
                              <NarratedText>{t.summary}</NarratedText>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  className="text-link"
                                  onClick={() => go("hub", t.id)}
                                >
                                  继续阅读 <ArrowRight size={16} />
                                </button>
                                {saveControl(t.id)}
                              </div>
                            </article>
                          ))}
                      </div>
                    </>
                  )}
                  {Object.entries(p.notes).filter(([, v]) => v.trim()).length >
                    0 && (
                    <div className="mt-10">
                      <h2>我留下的问题</h2>
                      {Object.entries(p.notes)
                        .filter(([, v]) => v.trim())
                        .map(([id, n]) => (
                          <article className="paper-card mt-4" key={id}>
                            <h3>{artifacts.find((a) => a.id === id)?.name}</h3>
                            <p className="whitespace-pre-wrap">{n}</p>
                            <button
                              className="text-link"
                              onClick={() => go("story", id)}
                            >
                              继续查证 <ArrowRight size={16} />
                            </button>
                          </article>
                        ))}
                    </div>
                  )}
                  <div className="reading-section">
                    <h2>离馆后的阅读入口</h2>
                    {sourceLinks(["museum", "catalogue", "stamp"])}
                    <button
                      className="text-link"
                      onClick={() => go("hub", "craft")}
                    >
                      阅读礼轿故事与原文 <ArrowUpRight size={17} />
                    </button>
                    <div className="notice-box">
                      <Info size={20} />
                      <NarratedText>
                        礼轿公众号原文与视频入口见知识卡底部；微信内容建议在微信中打开，来源核验状态随链接说明。
                      </NarratedText>
                    </div>
                  </div>
                </section>
              </CommunityPage>
            )}
            {r.page === "project" && (
              <Project p={p} reset={() => setReset(true)} />
            )}
          </>
        )}
        {storageError && (
          <div className="storage-warning notice-box">
            <NarratedText role="alert">
              浏览器存储不可用，本次进度仅在当前页面内保留。
            </NarratedText>
          </div>
        )}
        </div>
      </main>
      <nav className="mobile-nav" aria-label="移动端导航">
        {(
          [
            { page: "home", icon: Home, label: "首页" },
            { page: "hub", icon: Compass, label: "好奇心" },
            { page: "map", icon: Map, label: "探索" },
            { page: "saved", icon: Bookmark, label: "游客社区" },
          ] as const
        ).map(({ page, icon: Icon, label }) => (
          <a
            key={page}
            href={`#${page}`}
            className={r.page === page ? "active" : ""}
            aria-current={r.page === page ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="toast" role="status">
        {notice}
      </div>
      {reset && (
        <ResetDialog
          close={() => setReset(false)}
          confirm={() => {
            setP(fresh());
            setReset(false);
            setNotice("本浏览器的演示进度已清空");
          }}
        />
      )}
    </>
  );
}
function Puzzle({
  a,
  onAnswer,
}: {
  a: Artifact;
  onAnswer: (n: number) => void;
}) {
  // Historical progress records never initialize the current puzzle attempt.
  const [choice, setChoice] = useState<number>();
  const [submittedAnswer, setSubmittedAnswer] = useState<number>();
  const [explanationOpen, setExplanationOpen] = useState(false);
  const titleId = useId();
  const explanationId = useId();
  const messageId = useId();
  const [message, setMessage] = useState("");
  const lastSubmission = useRef<number | undefined>(undefined);
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="puzzle"
      aria-describedby={message ? messageId : undefined}
    >
      <h3 className="puzzle-heading" id={titleId}>
        <span className="puzzle-title">{a.puzzleTitle || "观察小谜题"}</span>{" "}
        <span className="puzzle-optional">可选参与</span>
      </h3>
      <NarratedText>{a.question}</NarratedText>
      <p className="sr-only">
        最多选择一项，再次点击已选项可取消。选择后点击提交答案。
      </p>
      {a.options.map((v, n) => (
        <button
          type="button"
          className={`option ${choice === n ? "chosen" : ""}`}
          key={v}
          aria-pressed={choice === n}
          onClick={() => {
            setChoice((current) => (current === n ? undefined : n));
            setSubmittedAnswer(undefined);
            setExplanationOpen(false);
            setMessage("");
            lastSubmission.current = undefined;
          }}
        >
          <span className="option-indicator" aria-hidden="true" />
          <span>{v}</span>
        </button>
      ))}
      <button
        type="button"
        className="btn primary puzzle-submit"
        aria-expanded={explanationOpen}
        aria-controls={explanationId}
        onClick={() => {
          if (choice === undefined) {
            setMessage("请先选择一个答案。");
            return;
          }
          if (lastSubmission.current === choice) return;
          lastSubmission.current = choice;
          setMessage("");
          setSubmittedAnswer(choice);
          setExplanationOpen(true);
          onAnswer(choice);
        }}
      >
        提交答案 <ChevronRight size={16} />
      </button>
      {message && (
        <p className="puzzle-message" id={messageId} role="alert">
          {message}
        </p>
      )}
      {explanationOpen && (
        <div
          className="answer"
          id={explanationId}
          role="region"
          aria-label="谜题解释"
          aria-live="polite"
        >
          {submittedAnswer !== undefined && (
            <b>{submittedAnswer === a.answer ? "回答正确" : "回答不正确"}</b>
          )}
          <p className="puzzle-correct-answer">
            正确答案：{a.options[a.answer]}
          </p>
          <NarratedText>{a.explanation}</NarratedText>
        </div>
      )}
    </div>
  );
}
function Story({ a }: { a: Artifact }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);
  function speak() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play()
      .then(() => {
        setStarted(true);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }
  return (
    <section className="story-wrap">
      <div className="video-heading">
        <span className="eyebrow">ANIMATED OBJECT STORY / 拟人动画</span>
        <h2>如果文物能够开口</h2>
        <NarratedText>让文物讲述，让好奇心继续。</NarratedText>
      </div>
      {a.video ? (
        <>
          <video
            ref={videoRef}
            className="artifact-video"
            controls
            playsInline
            preload="metadata"
            poster={assetBase + chairPhoto.poster}
            onError={() => setFailed(true)}
            onPlay={() => setStarted(true)}
          >
            <source src={assetBase + a.video} type="video/mp4" />
            {a.captions && (
              <track
                kind="captions"
                src={assetBase + a.captions}
                srcLang="zh"
                label="中文字幕"
              />
            )}
            浏览器无法播放视频，请下载MP4或阅读全文。
          </video>
          <div className="video-action">
            <button className="btn primary" onClick={speak}>
              <Play size={18} />
              {started ? "继续播放动画（有声）" : "播放动画（有声）"}
            </button>
            <span>原声旁白 · 内含音效与配乐 · 可全屏</span>
            <a className="text-link" href={assetBase + a.video} download>
              下载动画MP4 <Download size={16} />
            </a>
          </div>
          {failed && (
            <NarratedText className="notice-box" role="alert">
              视频暂时无法播放。可点击下载动画MP4，或阅读下方完整文字故事。
            </NarratedText>
          )}
        </>
      ) : (
        <div className="video-pending">
          {a.id === "chair" ? (
            <ChairImage sizes="(max-width: 700px) 90vw, 400px" />
          ) : (
            <img loading="lazy" src={assetBase + a.image} alt={a.alt} />
          )}
          <div>
            <Badge status="demo" />
            <h3>这件物品的动画故事，等待史料补全</h3>
            <NarratedText>
              名称和具体经历尚未核实，因此暂不制作虚构历史视频。你仍可阅读观察文字与下方解释。
            </NarratedText>
            <a className="text-link" href="#story/chair">
              观看百子大礼轿拟人动画 <ArrowRight size={17} />
            </a>
          </div>
        </div>
      )}
      <div className="notice-box">
        <Info size={20} />
        <NarratedText>
          视频为创意讲述，拟人表达不代表文物原话、馆方录音或历史现场。点击播放后使用视频原有旁白、音效与配乐，不叠加网页背景音乐。
        </NarratedText>
      </div>
      {a.id === "chair" && (
        <figure className="story-photo">
          <ChairPhoto />
          <figcaption>
            实物照片与视频创意场景对照：视频为艺术演绎，照片保留真实展陈外观。
          </figcaption>
        </figure>
      )}
      {a.id !== "chair" && (
        <details className="transcript" open>
          <summary>
            {a.id === "chair"
              ? "延伸阅读：礼轿文字故事（非视频逐字字幕）"
              : "阅读完整文字故事（无障碍替代）"}
          </summary>
          <AudioNarration
            text={a.story.join(" ")}
            label={a.name + "完整故事"}
          />
          {a.story.map((t) => (
            <NarratedText key={t}>{t}</NarratedText>
          ))}
        </details>
      )}
    </section>
  );
}
function Hub({
  selected,
  select,
  save,
  sources: sourceLinks,
}: {
  selected: string;
  select: (id: string) => void;
  save: (id: string) => React.ReactNode;
  sources: (ids: string[]) => React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const searchInputId = useId();
  const composing = useRef(false);
  function applyQuery(value: string) {
    setInputQuery(value);
    setQ(value.trim());
  }
  const [filter, setFilter] = useState("全部");
  const t = topics.find((t) => t.id === selected);
  const results = searchText(topics, q, filter);
  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(() => {
      // Do not interrupt a visitor who has already started using search.
      if (document.activeElement?.closest(".hub-search")) return;
      const panel = document.getElementById("topic-detail");
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ block: "start", behavior: "instant" });
    }, 80);
    return () => clearTimeout(timer);
  }, [selected]);
  return (
    <section className="section hub">
      <div className="hub-intro">
        <span className="eyebrow">GO BEYOND THE OBJECT</span>
        <h2>一个问题，可以通向很多地方。</h2>
        <NarratedText>
          追随人物、事件、地点与线索，选择属于你的历史探索方向。
        </NarratedText>
      </div>
      <form
        className="hub-search"
        role="search"
        aria-label="知识卡搜索"
        onSubmit={(event) => {
          event.preventDefault();
          if (!composing.current) applyQuery(inputQuery);
        }}
      >
        <div className="search-box">
          <Search size={21} aria-hidden="true" />
          <label className="sr-only" htmlFor={searchInputId}>
            搜索历史知识
          </label>
          <input
            id={searchInputId}
            value={inputQuery}
            onChange={(event) => setInputQuery(event.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (composing.current ||
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229)
              )
                event.preventDefault();
            }}
            placeholder="搜索关键词，如：礼轿、上海、通信…"
          />
          {(inputQuery || q) && (
            <button
              type="button"
              onClick={() => applyQuery("")}
              aria-label="清除搜索"
            >
              <X size={19} />
            </button>
          )}
        </div>
        <button type="submit" className="btn primary hub-search-submit">
          搜索
        </button>
      </form>
      <div className="filters">
        {["全部", "主题", "人物", "事件", "地点", "问题"].map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            className={f === filter ? "selected" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="hub-layout">
        <div>
          <p
            className="small muted"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            找到 {results.length} 张知识卡片
          </p>
          <div className="topic-grid knowledge-grid">
            {results.map((c) => (
              <article
                className={`paper-card ${t?.id === c.id ? "selected-card" : ""}`}
                key={c.id}
              >
                <span className="eyebrow">{c.type}</span>
                <button className="title-button" onClick={() => select(c.id)}>
                  {c.title}
                </button>
                <NarratedText>{c.summary}</NarratedText>
                <div className="flex items-center justify-between gap-2">
                  <button className="text-link" onClick={() => select(c.id)}>
                    展开线索 <ArrowUpRight size={17} />
                  </button>
                  {save(c.id)}
                </div>
              </article>
            ))}
          </div>
          {!results.length && (
            <div className="empty">
              <Search />
              <h3>还没有这条线索</h3>
              <NarratedText>试试“礼轿”“城市”或切换到全部主题。</NarratedText>
              <button
                className="text-link"
                onClick={() => {
                  applyQuery("");
                  setFilter("全部");
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
        <aside className="relation">
          <span className="eyebrow">CONNECTED HISTORIES</span>
          <h3>
            <Network size={18} /> 线索关系图
          </h3>
          <NarratedText className="small muted">
            连线代表编辑设置的研究关联，不等于已证实的历史因果。
          </NarratedText>
          <svg
            viewBox="0 0 320 290"
            role="img"
            aria-label="中心问题连接三个相关主题，下方提供等价按钮"
          >
            <line x1="160" y1="142" x2="67" y2="65" />
            <line x1="160" y1="142" x2="259" y2="70" />
            <line x1="160" y1="142" x2="158" y2="251" />
            {(t ? t.related.slice(0, 3) : ["craft", "place", "post"]).map(
              (id, i) => {
                const c = topics.find((c) => c.id === id)!;
                const [x, y] = [
                  [67, 65],
                  [259, 70],
                  [158, 251],
                ][i];
                return (
                  <g key={id}>
                    <circle cx={x} cy={y} r="28" />
                    <text x={x} y={y + 4} textAnchor="middle">
                      {c.type}
                    </text>
                  </g>
                );
              },
            )}
            <circle className="center" cx="160" cy="142" r="44" />
            <text x="160" y="147" textAnchor="middle" className="center-label">
              {t ? "当前线索" : "我的好奇心"}
            </text>
          </svg>
          <div className="relation-links">
            {(t ? t.related : ["craft", "place", "post"]).map((id) => (
              <button key={id} onClick={() => select(id)}>
                {topics.find((t) => t.id === id)?.title}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </aside>
      </div>
      {t && (
        <article
          id="topic-detail"
          tabIndex={-1}
          className="topic-detail"
          key={t.id}
          aria-label="展开的历史知识卡片"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <span className="eyebrow">{t.type} / CURIOSITY NOTE</span>
            {save(t.id)}
          </div>
          {t.id !== "craft" && <Badge status={t.status} />}
          <h2>{t.title}</h2>
          {t.sections ? (
            <>
              <AudioNarration
                text={topicNarration(t)}
                label="聆听完整礼轿故事"
                defaultMusic
              />
              <p className="craft-summary">{t.body}</p>
            </>
          ) : (
            <NarratedText>{t.body}</NarratedText>
          )}
          {t.sections && (
            <div className="chair-reading">
              <figure>
                <ChairPhoto className="hub-chair" />
                <figcaption>
                  现场实拍 · 展柜中的百子大礼轿；点击可看高清全图。
                </figcaption>
              </figure>
              <section aria-label="礼轿故事入门">
                <h3>{t.sections[0].title}</h3>
                <p>{t.sections[0].text}</p>
              </section>
              <details className="chair-deeper">
                <summary>继续阅读：匠艺、婚礼与上海生活</summary>
                {t.sections.slice(1).map((section) => (
                  <section key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.text}</p>
                  </section>
                ))}
              </details>
              <section className="observation-prompts">
                <h3>停留一分钟，试着这样看</h3>
                <ol>
                  {t.observations?.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ol>
              </section>
              <section className="reflection-prompt">
                <span className="eyebrow">YOUR OWN CONNECTION / 开放思考</span>
                <h3>把器物的故事，连到自己的生活</h3>
                <p>{t.reflection}</p>
              </section>
            </div>
          )}
          <div className="keywords">
            {t.keywords.map((k) => (
              <button key={k} onClick={() => applyQuery(k)}>
                # {k}
              </button>
            ))}
          </div>
          {t.sections && (
            <div className="source-note">
              <h3>来源与延伸阅读</h3>
              <p>
                名称、年代与收藏单位据官方目录第617项；工艺、结构与婚俗背景据上观刊载的活动介绍。观察提示与当代比较由项目编写。“百子”的祝愿为语境解读；不推断具体人物、图案数量或租赁经历。活动已结束，此处仅供阅读。
              </p>
            </div>
          )}
          {sourceLinks(t.sourceIds)}
          {!t.sourceIds.length && (
            <NarratedText className="small muted">
              此卡为研究方法或待核实问题，无已录入的具体历史文献；不提供虚构外链。
            </NarratedText>
          )}
        </article>
      )}
      <div className="reading-section">
        <h2>回到可靠的资料</h2>
        <NarratedText>
          你可以自由结束探索，也可以在离馆后继续阅读。
        </NarratedText>
        {sourceLinks(["museum", "catalogue", "stamp"])}
      </div>
    </section>
  );
}
function Project({ p, reset }: { p: Progress; reset: () => void }) {
  const counts = (type: string) =>
    p.events.filter((e) => e.type === type).length;
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "historyquest-local-demo.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="section project">
      <div className="notice-box">
        <Info size={20} />
        <NarratedText>
          课程展示面板。下列设计是方案假设；事件数仅来自此浏览器的演示操作，不是游客研究结果，也不是正式运营KPI。
        </NarratedText>
      </div>
      <h2>Audience Journey · 从参观到持续学习</h2>
      <div className="journey">
        {[
          ["01 进入", "公众号 / 现场扫码", "低门槛进入H5，无须注册"],
          ["02 观察", "自由地图 / 真实文物", "以一个细节提出问题"],
          ["03 理解", "聆听讲解 / 动画 / 可选谜题", "减轻阅读负担，解释史料"],
          ["04 追问", "知识卡 / 官方资料", "自主选择人物、事件、地点"],
          ["05 延续", "收藏 / 离馆后阅读", "把问题带回日常生活"],
        ].map(([stage, touch, value]) => (
          <article key={stage}>
            <span className="eyebrow">{stage}</span>
            <h3>{touch}</h3>
            <NarratedText>{value}</NarratedText>
          </article>
        ))}
      </div>
      <h2>Service Blueprint · 谁来支持体验</h2>
      <div className="table-scroll">
        <table>
          <caption>服务蓝图：拟议流程，尚未部署到馆方</caption>
          <thead>
            <tr>
              <th>层级 / 阶段</th>
              <th>进入与观察</th>
              <th>理解与追问</th>
              <th>离馆与延续</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>游客行为</th>
              <td>扫码，自由选择文物</td>
              <td>观察、跳过或解谜、提出问题</td>
              <td>收藏、主动返回资料</td>
            </tr>
            <tr>
              <th>前台触点</th>
              <td>公众号H5、现场标识、示意地图</td>
              <td>音频与动画故事、来源卡、关系图</td>
              <td>收藏夹、官方阅读入口</td>
            </tr>
            <tr>
              <th>后台流程</th>
              <td>核对展位、维护内容版本</td>
              <td>研究员审校、无障碍与字幕校对</td>
              <td>检查链接、审查反馈、更新资料</td>
            </tr>
            <tr>
              <th>支持与负责人</th>
              <td>馆方运营 + 志愿者</td>
              <td>策展研究 + 教育 + 前端开发</td>
              <td>数字运营 + 数据与隐私负责人</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Implementation · 从小规模试点开始</h2>
      <div className="journey three">
        {[
          [
            "阶段1 · 内容准备",
            "教育/策展人员确认3件文物、展签、版权、来源和现场点位；以问卷验证目标受众。",
          ],
          [
            "阶段2 · 原型试用",
            "开发与教育团队邀请5–8位参与者进行可用性试用（拟议人数），观察误点、跳过与理解反馈。",
          ],
          [
            "阶段3 · 评估迭代",
            "比较前后理解题，检查离馆后自愿回访；培训现场支持人员，建立资料纠错流程。",
          ],
        ].map(([h, b]) => (
          <article key={h}>
            <h3>{h}</h3>
            <NarratedText>{b}</NarratedText>
          </article>
        ))}
      </div>
      <h2>KPI · 衡量理解与主动探索</h2>
      <div className="table-scroll">
        <table>
          <caption>建议指标口径；基线及目标须由试点确定</caption>
          <thead>
            <tr>
              <th>目标</th>
              <th>建议指标与口径</th>
              <th>采集与边界</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>理解历史背景</th>
              <td>同一知识题前后正确率差（百分点）</td>
              <td>试点前后测；当前谜题不代替学习效果测量</td>
            </tr>
            <tr>
              <th>减轻阅读疲劳</th>
              <td>
                音频辅助与纯阅读条件下的主观阅读负担、注意力和理解题得分比较
              </td>
              <td>
                需开展自愿参与的对照试点；播放次数或时长不能证明注意力提升
              </td>
            </tr>
            <tr>
              <th>激发自主探索</th>
              <td>阅读≥1张相关卡的会话 / 打开故事的会话</td>
              <td>未来经同意的匿名会话记录；当前仅本地事件</td>
            </tr>
            <tr>
              <th>连接官方资料</th>
              <td>点击官方链接的会话 / 进入好奇心中心的会话</td>
              <td>点击只代表打开意图，不证明实际阅读</td>
            </tr>
            <tr>
              <th>离馆后继续学习</th>
              <td>7日内回访并阅读的自愿参与者 / 同意随访参与者</td>
              <td>需另行设计同意与随访；本原型无跨设备追踪</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 className="mt-8">本机演示事件 · 非调研统计</h3>
      <div className="metrics">
        {[
          ["档案打开", counts("artifact_open")],
          ["谜题提交", counts("puzzle_answer")],
          ["卡片阅读", counts("topic_read")],
          ["官方链接点击", counts("official_link_open")],
        ].map(([k, v]) => (
          <div key={k}>
            <b>{v}</b>
            <span>{k} · 次</span>
          </div>
        ))}
      </div>
      <h2>证据与素材说明</h2>
      <NarratedText>
        礼轿使用本次提供的高清现场实拍，其他现场记录沿用原素材，来源清单随项目保留。此面板对应
        Audience Journey、Prototype、Implementation & Measurement，并补充
        Service Blueprint。此网页不代替英文PPT或完整研究报告。
      </NarratedText>
      <NarratedText>
        已发现问卷工作簿，但本原型没有发布未经逐项校验的统计，也不把小样本外推为所有游客结论。请按内容指南补充经过小组复核的匿名汇总结果。
      </NarratedText>
      <NarratedText>
        主要用户假设：希望通过轻量内容理解展品的自主参观者。应在问卷分析及试用后决定优先受众。完整代码与基本测试由AI辅助生成，正式提交时需在
        AI Use & Verification Log 中记录并由小组复核。
      </NarratedText>
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="btn outline" onClick={exportData}>
          <Download size={17} />
          导出本机演示记录
        </button>
        <button className="btn outline" onClick={reset}>
          <RotateCcw size={17} />
          重置演示数据
        </button>
      </div>
    </section>
  );
}
function ResetDialog({
  close,
  confirm,
}: {
  close: () => void;
  confirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className="reset-dialog"
    >
      <h2>重置本机演示数据？</h2>
      <NarratedText>
        将清空此浏览器中的收藏、笔记、答题与演示事件。操作无法撤销。
      </NarratedText>
      <div className="flex flex-wrap gap-3">
        <button className="btn outline" autoFocus onClick={close}>
          保留数据
        </button>
        <button className="btn primary" onClick={confirm}>
          确认清空
        </button>
      </div>
    </dialog>
  );
}
