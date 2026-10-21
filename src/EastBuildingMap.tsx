import { NarratedText } from "./AudioNarration";
import { useState } from "react";
import HighlightCarousel from "./HighlightCarousel";
import { useMapPreview } from "./MapPreview";
import {
  ArrowRight,
  ArrowUpRight,
  Layers,
  Info,
  Plus,
  Minus,
  RotateCcw,
  MapPin,
  Accessibility,
  ArrowUpDown,
  Headphones,
  Glasses,
  Utensils,
  Leaf,
  BookOpen,
} from "lucide-react";
import { floors, footprint, type Point, type Floor } from "./mapData";
import { artifacts, assetBase, type Artifact } from "./data";
import { highlights, type Highlight } from "./mapHighlights";
const points = (p: Point[]) => p.map((x) => x.join(",")).join(" ");
const matrix = "matrix(.88 .19 -.48 .64 170 115)";
const project = ([x, y]: Point): Point => [
  0.88 * x - 0.48 * y + 170,
  0.19 * x + 0.64 * y + 115,
];
function FloorGeometry({
  floor,
  active,
  select,
  interactive = true,
}: {
  floor: Floor;
  active: string;
  select: (id: string) => void;
  interactive?: boolean;
}) {
  return (
    <g transform={matrix}>
      <polygon
        points={points(footprint.map(([x, y]) => [x, y + 20]))}
        fill="#857665"
      />
      <polygon
        points={points(footprint)}
        fill="#ede6d9"
        stroke="#b2a28b"
        strokeWidth="2"
      />
      <path
        d="M180 25V95H110V145H45V190H20 M180 95H430 M180 155H430 M110 145V300 M440 300V315H535V300"
        fill="none"
        stroke="#c1b29a"
        strokeWidth="3"
      />
      <path
        d="M180 35H430 M200 49H420 M220 63H410"
        fill="none"
        stroke="#d8cdbb"
        strokeWidth="2"
      />
      {floor.regions.map((r) => (
        <g
          key={r.id}
          className={interactive ? "floor-region" : ""}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={
            interactive
              ? `选择${r.number ? r.number + "号展区：" : ""}${r.title}`
              : undefined
          }
          aria-pressed={interactive ? active === r.id : undefined}
          onClick={interactive ? () => select(r.id) : undefined}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(r.id);
                  }
                }
              : undefined
          }
        >
          <polygon
            points={points(r.points.map(([x, y]) => [x, y + 9]))}
            fill={active === r.id ? "#9b7b4c" : "#b5a084"}
          />
          <polygon
            points={points(r.points)}
            fill={active === r.id ? "#243c50" : floor.color}
            stroke={active === r.id ? "#c6a36b" : "#9e8b73"}
            strokeWidth={active === r.id ? 4 : 2}
          />
        </g>
      ))}
      <path
        d="M45 190H100V300 M44 215H99 M44 230H99 M44 245H99 M44 260H99"
        fill="none"
        stroke="#a99d8b"
        strokeWidth="2"
      />
    </g>
  );
}
function RegionLabels({
  floor,
  active,
  select,
}: {
  floor: Floor;
  active: string;
  select: (id: string) => void;
}) {
  return (
    <>
      {floor.regions.map((r) => {
        const [x, y] = project(r.label);
        return (
          <g
            key={r.id}
            onClick={() => select(r.id)}
            className="room-label"
            aria-hidden="true"
          >
            <circle
              cx={x}
              cy={y - 5}
              r={r.number ? 22 : 16}
              fill={active === r.id ? "#c6a36b" : "#f8f3e9"}
              stroke="#ab8b58"
              strokeWidth="1.5"
            />
            {r.number ? (
              <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                className="gallery-number"
              >
                {r.number}
              </text>
            ) : (
              <text x={x} y={y} textAnchor="middle" fontSize="12">
                {r.id === "garden"
                  ? "园"
                  : r.id === "dining"
                    ? "餐"
                    : r.id === "lobby"
                      ? "序"
                      : r.id === "special"
                        ? "特"
                        : "M"}
              </text>
            )}
            <text
              x={x}
              y={y + 35}
              textAnchor="middle"
              className="gallery-title"
              fill="#14283f"
            >
              {r.number ? r.title.split(" · ")[0] : r.title}
            </text>
          </g>
        );
      })}
    </>
  );
}
function Services({ floor }: { floor: Floor }) {
  const [elx, ely] = project([60, 165]);
  const [stx, sty] = project([65, 270]);
  const [ecx, ecy] = project([270, 60]);
  return (
    <g className="map-facilities" aria-hidden="true">
      <g transform={`translate(${elx},${ely - 27})`}>
        <rect x="-14" y="-13" width="28" height="26" rx="4" />
        <path d="M-6-7V7M6-7V7M-9-2l3-4 3 4M3 2l3 4 3-4" />
        <text x="0" y="31" textAnchor="middle">
          电梯
        </text>
      </g>
      <g transform={`translate(${stx},${sty})`}>
        <rect x="-14" y="-13" width="28" height="26" rx="4" />
        <path d="M-9 7h6V2h6v-5h6v-5" />
        <text x="0" y="31" textAnchor="middle">
          楼梯
        </text>
      </g>
      {floor.id !== "5" && (
        <g transform={`translate(${ecx},${ecy - 8})`}>
          <rect x="-14" y="-13" width="28" height="26" rx="4" />
          <path d="M-9 7h6L5-5h5M-9 2h4L3-9h7" />
          <text x="0" y="31" textAnchor="middle">
            扶梯
          </text>
        </g>
      )}
    </g>
  );
}
function HighlightMarkers({
  items,
  selected,
  select,
  previewBindings,
}: {
  previewBindings: ReturnType<typeof useMapPreview>["bindings"];
  items: Highlight[];
  selected: string;
  select: (h: Highlight) => void;
}) {
  return (
    <g className="highlight-markers">
      {items.map((h) => {
        const [ax, ay] = project(h.anchor);
        const [dx, dy] = h.offset;
        const x = ax + dx,
          y = ay + dy;
        return (
          <g
            key={h.id}
            role="button"
            tabIndex={0}
            className={`object-pin ${h.id === selected ? "active" : ""}`}
            {...previewBindings(h)}
            aria-label={`查看重点文物：${h.name}，展区参考位置`}
            aria-pressed={h.id === selected}
            onClick={() => select(h)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select(h);
              }
            }}
          >
            <title>{h.name} · 展区范围，非精确柜位</title>
            <line
              x1={ax}
              y1={ay}
              x2={x}
              y2={y}
              stroke="#95723f"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle
              cx={ax}
              cy={ay}
              r="7"
              fill="#c6a36b"
              stroke="#fff5df"
              strokeWidth="2"
            />
            <rect
              className="pin-card"
              x={x - 61}
              y={y - 58}
              width="122"
              height="109"
              rx="5"
              fill="#f9f4e9"
              stroke={h.id === selected ? "#14283f" : "#ad8c58"}
              strokeWidth={h.id === selected ? 4 : 2}
            />
            <image
              href={assetBase + "highlights/" + h.image}
              x={x - 49}
              y={y - 49}
              width="98"
              height="70"
              preserveAspectRatio="xMidYMid meet"
            />
            <text x={x} y={y + 40} textAnchor="middle" className="pin-caption">
              {h.short.length > 11 ? h.short.slice(0, 10) + "…" : h.short}
            </text>
          </g>
        );
      })}
    </g>
  );
}
export default function EastBuildingMap({
  open,
  viewed,
}: {
  open: (a: Artifact) => void;
  viewed: string[];
}) {
  const [showObjects, setObjects] = useState(true);
  const [highlightId, setHighlightId] = useState("");
  const [floorId, setFloorId] = useState("1");
  const [mode, setMode] = useState<"overview" | "floor">("overview");
  const [regionId, setRegionId] = useState("lobby");
  const [zoom, setZoom] = useState(1);
  const [showServices, setServices] = useState(true);
  const preview = useMapPreview(`${floorId}:${mode}:${showObjects}`);
  const floor = floors.find((f) => f.id === floorId)!;
  const selected =
    floor.regions.find((r) => r.id === regionId) || floor.regions[0];
  function chooseFloor(id: string) {
    preview.close();
    const f = floors.find((x) => x.id === id)!;
    setHighlightId("");
    setFloorId(id);
    setRegionId(f.regions[0].id);
    setMode("floor");
    setZoom(1);
  }
  function chooseRegion(id: string) {
    setHighlightId("");
    setRegionId(id);
    setMode("floor");
  }
  const floorHighlights = highlights.filter((h) => h.floor === floorId);
  const highlight = floorHighlights.find((h) => h.id === highlightId);
  function selectHighlight(h: Highlight) {
    preview.close();
    setFloorId(h.floor);
    setHighlightId(h.id);
    setRegionId(h.region);
    setMode("floor");
    setZoom(1);
  }
  const related = artifacts.filter((a) => selected.related?.includes(a.id));
  return (
    <section className="section east-map">
      {preview.layer}
      <div className="east-intro">
        <div>
          <span className="eyebrow">EAST BUILDING / 上海市历史博物馆</span>
          <h2>一层层，走近上海。</h2>
        </div>
        <span className="map-origin">
          <Layers size={16} /> 重绘布局 · 文物参考点
        </span>
      </div>
      <div className="east-floor-tabs" aria-label="东楼楼层选择">
        <button
          className={mode === "overview" ? "selected" : ""}
          aria-pressed={mode === "overview"}
          onClick={() => {
            setMode("overview");
            setZoom(1);
          }}
        >
          <Layers size={17} />
          楼层总览
        </button>
        {floors.map((f) => (
          <button
            key={f.id}
            aria-label={`查看东楼${f.label} ${f.title}`}
            aria-pressed={mode === "floor" && f.id === floorId}
            className={mode === "floor" && f.id === floorId ? "selected" : ""}
            onClick={() => chooseFloor(f.id)}
          >
            <b>{f.label}</b>
            <span>
              {f.id === "M"
                ? "公共服务"
                : f.id === "3" || f.id === "4"
                  ? "近代上海"
                  : f.id === "1"
                    ? "序厅 / 特展"
                    : f.title}
            </span>
          </button>
        ))}
      </div>
      <div className="east-map-layout">
        <div className="east-map-surface">
          <div className="east-map-heading">
            <span className="eyebrow">
              {mode === "overview"
                ? "EAST BUILDING · VERTICAL ATLAS"
                : `${floor.label} / ${floor.en}`}
            </span>
            <h3>{mode === "overview" ? "东楼 · 六层空间" : floor.title}</h3>
            <span>
              {mode === "overview"
                ? "金色编号为重点文物区域点，点击查看"
                : "点击有色展区查看内容"}
            </span>
          </div>
          <svg
            className={`east-svg ${mode}`}
            viewBox={
              mode === "overview"
                ? `${480 - 480 / zoom} ${370 - 370 / zoom} ${960 / zoom} ${740 / zoom}`
                : `${480 - 480 / zoom} ${340 - 340 / zoom} ${960 / zoom} ${680 / zoom}`
            }
            role="group"
            aria-label={
              mode === "overview"
                ? "东楼楼层立体总览"
                : "东楼" + floor.label + "展区立体地图"
            }
          >
            <defs>
              <pattern
                id="east-grid"
                width="36"
                height="36"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M36 0H0V36"
                  fill="none"
                  stroke="#c5b89f"
                  strokeWidth=".5"
                  opacity=".45"
                />
              </pattern>
              <filter
                id="floor-shadow"
                x="-20%"
                y="-20%"
                width="150%"
                height="160%"
              >
                <feDropShadow
                  dx="0"
                  dy="12"
                  stdDeviation="12"
                  floodColor="#4d4335"
                  floodOpacity=".13"
                />
              </filter>
            </defs>
            <rect width="960" height="740" fill="url(#east-grid)" />
            {mode === "overview" ? (
              <>
                {[...floors].reverse().map((f, i) => (
                  <g
                    key={f.id}
                    className="floor-stack"
                    role="button"
                    tabIndex={0}
                    aria-label={`展开东楼${f.label} ${f.title}`}
                    onClick={() => chooseFloor(f.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        chooseFloor(f.id);
                      }
                    }}
                  >
                    <g
                      transform={`translate(55 ${-43 + i * 99}) scale(.66 .44)`}
                      filter="url(#floor-shadow)"
                    >
                      <FloorGeometry
                        floor={f}
                        active=""
                        select={() => {}}
                        interactive={false}
                      />
                    </g>
                    <line
                      x1="660"
                      y1={90 + i * 99}
                      x2="695"
                      y2={90 + i * 99}
                      stroke="#b29b75"
                    />
                    <text x="710" y={90 + i * 99} className="stack-floor">
                      {f.label}
                    </text>
                    <text x="710" y={114 + i * 99} className="stack-name">
                      {f.id === "M"
                        ? "夹层 · 公共服务"
                        : f.id === "3"
                          ? "近代上海 3–6"
                          : f.id === "4"
                            ? "近代上海 7–9"
                            : f.title}
                    </text>
                    {highlights.some((h) => h.floor === f.id) && (
                      <text
                        x="710"
                        y={135 + i * 99}
                        className="stack-highlight-count"
                      >
                        {highlights.filter((h) => h.floor === f.id).length}{" "}
                        件重点文物
                      </text>
                    )}
                  </g>
                ))}
                {showObjects &&
                  highlights.map((h, index) => {
                    const level = [...floors]
                      .reverse()
                      .findIndex((f) => f.id === h.floor);
                    const [px, py] = project(h.anchor);
                    const x = 55 + px * 0.66;
                    const y = -43 + level * 99 + py * 0.44;
                    return (
                      <g
                        key={h.id}
                        className="overview-object-pin"
                        {...preview.bindings(h)}
                        role="button"
                        tabIndex={0}
                        aria-label={`总览重点文物：${h.name}，东楼${h.floor === "M" ? "M夹层" : h.floor + "F"}区域参考位置`}
                        onClick={() => selectHighlight(h)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectHighlight(h);
                          }
                        }}
                      >
                        <title>{h.name} · 区域参考，非精确柜位</title>
                        <circle cx={x} cy={y} r="25" fill="transparent" />
                        <circle
                          cx={x}
                          cy={y}
                          r="17"
                          fill="#c6a36b"
                          stroke="#fff5e0"
                          strokeWidth="2.5"
                        />
                        <text x={x} y={y + 5} textAnchor="middle">
                          {String(index + 1).padStart(2, "0")}
                        </text>
                      </g>
                    );
                  })}
              </>
            ) : (
              <>
                <g filter="url(#floor-shadow)">
                  <FloorGeometry
                    floor={floor}
                    active={selected.id}
                    select={chooseRegion}
                  />
                </g>
                <RegionLabels
                  floor={floor}
                  active={selected.id}
                  select={chooseRegion}
                />
                {showServices && <Services floor={floor} />}{" "}
                {showObjects && (
                  <HighlightMarkers
                    previewBindings={preview.bindings}
                    items={floorHighlights}
                    selected={highlightId}
                    select={selectHighlight}
                  />
                )}{" "}
                <path d="M410 522h100" stroke="#ab916c" />
                <text
                  x="460"
                  y="549"
                  textAnchor="middle"
                  className="diagram-footnote"
                >
                  导览册图面方向 · 非比例测绘
                </text>
              </>
            )}
          </svg>
          <div className="east-tools">
            <span>
              <i style={{ background: floor.color }} />
              展区 <i className="selected-swatch" />
              已选择
            </span>
            {
              <>
                <button
                  aria-label="缩小东楼地图"
                  disabled={zoom <= 1}
                  onClick={() => setZoom(Math.max(1, zoom - 0.2))}
                >
                  <Minus size={17} />
                </button>
                <button
                  aria-label="放大东楼地图"
                  disabled={zoom >= 1.6}
                  onClick={() => setZoom(Math.min(1.6, zoom + 0.2))}
                >
                  <Plus size={17} />
                </button>
                <button
                  aria-label="重置东楼地图视图"
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw size={16} />
                </button>
              </>
            }
          </div>
        </div>
        <aside className="east-map-detail" aria-live="polite">
          {highlight && (
            <div className="highlight-detail">
              <span className="eyebrow">FEATURED OBJECT / 区域参考点</span>
              <h2>{highlight.name}</h2>
              <img
                src={assetBase + "highlights/" + highlight.image}
                alt={highlight.name + "，" + highlight.imageSource}
                loading="lazy"
              />
              <span className="badge pending">
                {floor.label} ·{" "}
                {selected.number ? selected.number + "号展区" : selected.title}{" "}
                · 非精确柜位
              </span>
              <NarratedText>{highlight.note}</NarratedText>
              <small>图片：{highlight.imageSource}</small>
              {highlight.sourceUrl && (
                <a
                  href={highlight.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  查看核对资料 <ArrowUpRight size={15} />
                </a>
              )}
              {highlight.topicId && (
                <a className="btn outline" href={`#hub/${highlight.topicId}`}>
                  探索这段历史 <ArrowRight size={17} />
                </a>
              )}
              {highlight.openArtifact && (
                <button
                  className="btn primary"
                  onClick={() =>
                    open(
                      artifacts.find((a) => a.id === highlight.openArtifact)!,
                    )
                  }
                >
                  观察与听文物讲述 <ArrowRight size={17} />
                </button>
              )}
            </div>
          )}
          <div className="detail-kicker">
            <span>{floor.label}</span>
            <span>东楼 / EAST BUILDING</span>
          </div>
          <span className="eyebrow mt-6">
            {selected.number ? `GALLERY ${selected.number}` : "VISITOR SPACE"}
          </span>
          <h2>{selected.title}</h2>
          <NarratedText className="room-subtitle">
            {selected.subtitle}
          </NarratedText>
          <NarratedText>{selected.description}</NarratedText>
          {selected.reference && (
            <div className="brochure-reference">
              <BookOpen size={18} />
              <NarratedText>{selected.reference}</NarratedText>
            </div>
          )}
          {related.length > 0 && (
            <div className="related-archives">
              <h3>相关观察档案</h3>
              <small>主题关联，非已确认的展位点。</small>
              {related.map((a) => (
                <button key={a.id} onClick={() => open(a)}>
                  <span>
                    {a.name}
                    <small>
                      {viewed.includes(a.id)
                        ? "已读过 · 可继续"
                        : "观察 → 解谜 → 故事"}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          )}
          <div className="floor-support">
            <h3>这一层的公共设施</h3>
            <div>
              {floor.services.map((s) => (
                <span key={s}>
                  {s === "电梯" ? (
                    <ArrowUpDown size={13} />
                  ) : s.includes("无障碍") ? (
                    <Accessibility size={13} />
                  ) : s === "餐饮区" ? (
                    <Utensils size={13} />
                  ) : s === "AR眼镜租借" ? (
                    <Glasses size={13} />
                  ) : s === "导览租借" ? (
                    <Headphones size={13} />
                  ) : s === "屋顶花园" ? (
                    <Leaf size={13} />
                  ) : null}
                  {s}
                </span>
              ))}
            </div>
            <small>
              来自导览册图标；地图仅标出可辨认的交通节点，不用于无障碍路线承诺。
            </small>
          </div>
        </aside>
      </div>
      <div className="east-map-note">
        <Info size={18} />
        <NarratedText>
          布局依据你提供的馆方导览册照片重绘，非比例测绘、非实时定位。重点文物点位按导览册所属展区放置，仅表示大概区域，不代表具体展柜；临展、借展及开放状态以现场为准。这里仅包含东楼。
        </NarratedText>
      </div>
      <div className="floor-list-heading">
        <h2>
          {mode === "overview"
            ? "总览 · 全部重点文物"
            : floor.label + " · 展区文字索引"}
        </h2>
        <div className="map-toggle-group">
          <label>
            <input
              type="checkbox"
              checked={showObjects}
              onChange={(e) => setObjects(e.target.checked)}
            />{" "}
            显示重点文物点
          </label>
          <label>
            <input
              type="checkbox"
              checked={showServices}
              onChange={(e) => setServices(e.target.checked)}
            />{" "}
            显示交通设施
          </label>
        </div>
      </div>
      <HighlightCarousel items={mode === "overview" ? highlights : floorHighlights} selected={highlightId} select={selectHighlight} />
      {mode === "floor" && (
        <div className="east-region-index">
          {floor.regions.map((r) => (
            <button
              key={r.id}
              className={
                mode === "floor" && selected.id === r.id ? "selected" : ""
              }
              onClick={() => chooseRegion(r.id)}
              aria-pressed={mode === "floor" && selected.id === r.id}
            >
              <b>{r.number || floor.label}</b>
              <span>
                {r.title}
                <small>{r.subtitle}</small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      )}
      <div className="archive-entry">
        <div>
          <span className="eyebrow">ARTIFACT ARCHIVES</span>
          <h3>也可以直接从一件文物出发</h3>
        </div>
        <div>
          {artifacts.map((a) => (
            <button key={a.id} onClick={() => open(a)}>
              <MapPin size={17} />
              <span>
                {a.name}
                <small>
                  {a.status === "demo"
                    ? "观察样例 · 身份待核实"
                    : "文物档案 · 具体柜位待核实"}
                </small>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
