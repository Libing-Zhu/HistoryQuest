import { it, expect, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { STORAGE_KEY, fresh } from "../src/state";
function open(hash: string) {
  location.hash = hash;
  fireEvent(window, new HashChangeEvent("hashchange"));
}
it("opens story without answering after removing only the chair skip entry", async () => {
  location.hash = "discovery/chair";
  render(<App />);
  expect(screen.queryByRole("button", { name: "跳过谜题，直接了解" })).not.toBeInTheDocument();
  const group = screen.getByRole("group", { name: /观察小谜题：辨认礼轿的装饰工艺/ });
  expect(within(group).getByRole("heading", { name: /观察小谜题/ })).toBeInTheDocument();
  expect(document.querySelector(".detail-content > .badge")).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "阅读文物故事" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "如果文物能够开口" }),
    ).toBeInTheDocument(),
  );
  expect(screen.getByText("从故事回到史料")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /下一件/ }),
  ).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).skipped).not.toContain(
    "chair",
  );
});
it("offers explanation after wrong answer and permits retry", async () => {
  location.hash = "discovery/chair";
  render(<App />);
  await userEvent.click(
    screen.getByRole("button", {
      name: "A. 朱金木雕、金银彩绣、螺钿镶嵌",
      exact: true,
    }),
  );
  await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
  expect(screen.getByText("回答不正确")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", {
      name: "B. 朱金木雕、金银彩绣、玻璃画",
      exact: true,
    }),
  );
  await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
  expect(screen.getByText("回答正确")).toBeInTheDocument();
});
it("persists saved items and notes across remounts", async () => {
  location.hash = "story/chair";
  const view = render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "收藏百子大礼轿" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toContain(
    "chair",
  );
  await userEvent.type(screen.getByRole("textbox"), "谁制作了它？");
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toContain(
    "chair",
  );
  view.unmount();
  render(<App />);
  expect(screen.getByRole("textbox")).toHaveValue("谁制作了它？");
  open("saved");
  await userEvent.click(
    await screen.findByRole("tab", { name: "我的收藏与笔记" }),
  );
  await waitFor(() =>
    expect(screen.getByText("谁制作了它？")).toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: "取消收藏百子大礼轿" }),
  ).toBeInTheDocument();
});
it("searches knowledge cards and exposes an empty state", async () => {
  location.hash = "hub";
  render(<App />);
  await userEvent.type(
    screen.getByRole("textbox", { name: "搜索历史知识" }),
    "不存在的主题",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "搜索", exact: true }),
  );
  expect(screen.getByText("还没有这条线索")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "清除筛选" }));
  expect(
    screen.getAllByRole("button", { name: "1878：从邮票看通信" }).length,
  ).toBeGreaterThan(0);
});
it("allows reset cancellation, then resets demo data", async () => {
  location.hash = "project";
  render(<App />);
  await userEvent.click(screen.getByRole("button", { name: "重置演示数据" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "保留数据" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "重置演示数据" }));
  await userEvent.click(screen.getByRole("button", { name: "确认清空" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual([]);
});
it("switches east floors and selects real guide galleries with a keyboard", async () => {
  location.hash = "map";
  const { container } = render(<App />);
  expect(container.querySelector("svg image")).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "查看东楼3F 近代上海 · 开埠与转型" }),
  );
  const region = screen.getByRole("button", {
    name: "选择4号展区：中西交汇 · 城市转型",
  });
  region.focus();
  await userEvent.keyboard("{Enter}");
  expect(region).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("heading", { name: "中西交汇 · 城市转型" }),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "查看东楼4F 近代上海 · 都市与新生" }),
  );
  expect(
    screen.getByRole("button", { name: "选择7号展区：经济中心 · 远东都会" }),
  ).toHaveAttribute("aria-pressed", "true");
});

it("plays the actual animation with voice only after user activation", async () => {
  location.hash = "story/chair";
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const { container } = render(<App />);
  const video = container.querySelector("video")!;
  expect(video).not.toHaveAttribute("autoplay");
  expect(video.muted).toBe(false);
  expect(video.querySelector("source")).toHaveAttribute(
    "src",
    expect.stringContaining("chair-story-immersive-20261018.mp4"),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "播放动画（有声）" }),
  );
  expect(play).toHaveBeenCalledOnce();
  expect(video.muted).toBe(false);
  expect(container.querySelector("track")).toBeNull();
  play.mockRestore();
});

it("selects pictured highlight points and reveals location precision and sources", async () => {
  location.hash = "map";
  render(<App />);
  await userEvent.click(
    screen.getByRole("button", { name: "查看东楼3F 近代上海 · 开埠与转型" }),
  );
  const pin = screen.getByRole("button", {
    name: "查看重点文物：陈化成像，展区参考位置",
  });
  pin.focus();
  await userEvent.keyboard("{Enter}");
  expect(pin).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: "陈化成像" })).toBeInTheDocument();
  expect(screen.getByText("3F · 3号展区 · 非精确柜位")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("checkbox", { name: "显示重点文物点" }),
  );
  expect(
    screen.queryByRole("button", {
      name: "查看重点文物：陈化成像，展区参考位置",
    }),
  ).not.toBeInTheDocument();
});

it("exposes all ten overview object pins and opens the correct floor directly", async () => {
  location.hash = "map";
  render(<App />);
  expect(
    screen.getAllByRole("button", { name: /^总览重点文物：/ }),
  ).toHaveLength(10);
  const pin = screen.getByRole("button", {
    name: "总览重点文物：《义勇军进行曲》首版唱片，东楼4F区域参考位置",
  });
  pin.focus();
  await userEvent.keyboard("{Enter}");
  expect(
    screen.getByRole("button", { name: "查看东楼4F 近代上海 · 都市与新生" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("heading", { name: "《义勇军进行曲》首版唱片" }),
  ).toBeInTheDocument();
  expect(screen.getByText("4F · 8号展区 · 非精确柜位")).toBeInTheDocument();
});

it("keeps the craft deep link, searches expanded content and exposes source provenance", async () => {
  location.hash = "hub/craft";
  render(<App />);
  expect(
    screen.getByRole("heading", {
      name: "百子大礼轿：一场婚礼里的匠艺与上海生活",
    }),
  ).toBeInTheDocument();
  const deeper = screen.getByText("继续阅读：匠艺、婚礼与上海生活");
  await userEvent.click(deeper);
  expect(
    screen.getByRole("heading", { name: "05｜今天，我们怎样留下重要时刻" }),
  ).toBeVisible();
  await userEvent.type(
    screen.getByRole("textbox", { name: "搜索历史知识" }),
    "家庭合影",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "搜索", exact: true }),
  );
  expect(screen.getByText("找到 1 张知识卡片")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /阅读公众号原文/ })).toHaveAttribute(
    "href",
    "https://mp.weixin.qq.com/s/4DCPJGDhPLBbV2h74StNlw",
  );
  expect(screen.getByRole("link", { name: /观看礼轿视频/ })).toHaveAttribute(
    "target",
    "_blank",
  );
  await userEvent.click(
    screen.getAllByRole("button", {
      name: "收藏百子大礼轿：一场婚礼里的匠艺与上海生活",
    })[0],
  );
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toContain(
    "craft",
  );
});

it("requires an answer, submits with a keyboard, and prevents duplicate submission events", async () => {
  location.hash = "discovery/chair";
  render(<App />);
  const submit = screen.getByRole("button", { name: "提交答案" });
  expect(
    screen.queryByRole("button", { name: "查看解释" }),
  ).not.toBeInTheDocument();
  const count = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).events.filter(
      (e: { type: string }) => e.type === "puzzle_answer",
    ).length;
  submit.focus();
  await userEvent.keyboard("{Enter}");
  expect(screen.getByRole("alert")).toHaveTextContent("请先选择一个答案。");
  expect(
    screen.queryByRole("region", { name: "谜题解释" }),
  ).not.toBeInTheDocument();
  expect(count()).toBe(0);
  await userEvent.click(
    screen.getByRole("button", {
      name: "C. 朱金木雕、金银彩绣、瓷板彩绘",
      exact: true,
    }),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  submit.focus();
  await userEvent.keyboard(" ");
  expect(screen.getByText("回答不正确")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "谜题解释" })).toHaveTextContent(
    "正确答案：B. 朱金木雕、金银彩绣、玻璃画",
  );
  await userEvent.dblClick(submit);
  expect(count()).toBe(1);
  await userEvent.click(
    screen.getByRole("button", {
      name: "B. 朱金木雕、金银彩绣、玻璃画",
      exact: true,
    }),
  );
  expect(
    screen.queryByRole("region", { name: "谜题解释" }),
  ).not.toBeInTheDocument();
  await userEvent.click(submit);
  expect(screen.getByText("回答正确")).toBeInTheDocument();
  expect(screen.getAllByRole("region", { name: "谜题解释" })).toHaveLength(1);
  expect(count()).toBe(2);
});
it("removes the home phase strip while retaining the three artifact entrances", () => {
  location.hash = "home";
  const { container } = render(<App />);
  expect(screen.queryByText("01 / 观察")).not.toBeInTheDocument();
  expect(screen.queryByText("02 / 理解")).not.toBeInTheDocument();
  expect(screen.queryByText("03 / 自主追问")).not.toBeInTheDocument();
  expect(container.querySelector(".hero-foot")).toBeNull();
  expect(
    screen.getByRole("button", { name: "观察百子大礼轿" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "观察声音里的城市" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "观察纸上的城市想象" }),
  ).toBeInTheDocument();
});

it("places the field visit before the final curiosity banner in the homepage DOM", () => {
  location.hash = "home";
  const { container } = render(<App />);
  const main = container.querySelector("main")!;
  const sections = Array.from(main.querySelectorAll(":scope > .scroll-content > section"));
  expect(sections.at(-1)).toHaveClass("curiosity-banner");
  expect(sections.at(-2)).toHaveClass("field-section");
});

it("removes the shared footer on every route while preserving the header and mobile navigation", async () => {
  location.hash = "home";
  const { container } = render(<App />);
  for (const hash of [
    "home",
    "map",
    "discovery/chair",
    "story/chair",
    "hub",
    "saved",
    "project",
  ]) {
    open(hash);
    expect(container.querySelector("footer")).toBeNull();
    expect(
      screen.queryByText("让一次参观，成为持续探索的起点。"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "课程项目说明", exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "IFB405TC", exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "HistoryQuest 寻迹上海首页",
        exact: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "移动端导航" }),
    ).toBeInTheDocument();
  }
});

it("retains the storage failure warning inside main after removing the footer", () => {
  location.hash = "home";
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  const { container } = render(<App />);
  expect(screen.getByRole("alert")).toHaveTextContent("浏览器存储不可用");
  expect(container.querySelector("main")).toContainElement(
    screen.getByRole("alert"),
  );
  save.mockRestore();
});

it("toggles option rows and clears stale feedback without silently submitting", async () => {
  location.hash = "discovery/chair";
  const { container } = render(<App />);
  const options = Array.from(
    container.querySelectorAll<HTMLButtonElement>(".puzzle .option"),
  );
  const [a, b, c] = options;
  const submit = screen.getByRole("button", { name: "提交答案" });
  const count = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).events.filter(
      (e: { type: string }) => e.type === "puzzle_answer",
    ).length;
  await userEvent.click(a.querySelector("span:last-child")!);
  expect(a).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(a.querySelector(".option-indicator")!);
  expect(a).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(a);
  await userEvent.click(a);
  expect(a).toHaveAttribute("aria-pressed", "false");
  expect(count()).toBe(0);
  b.focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.click(submit);
  expect(screen.getByText("回答正确")).toBeInTheDocument();
  expect(count()).toBe(1);
  await userEvent.click(c);
  expect(screen.queryByText("回答正确")).not.toBeInTheDocument();
  expect(screen.queryByText("回答不正确")).not.toBeInTheDocument();
  expect(count()).toBe(1);
  await userEvent.click(submit);
  expect(screen.getByText("回答不正确")).toBeInTheDocument();
  c.focus();
  await userEvent.keyboard(" ");
  expect(c).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByText("回答不正确")).not.toBeInTheDocument();
  await userEvent.click(submit);
  expect(count()).toBe(2);
  expect(
    screen.queryByRole("region", { name: "谜题解释" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("请先选择一个答案。");
  expect(options.every((o) => o.getAttribute("aria-pressed") === "false")).toBe(
    true,
  );
  await userEvent.click(a);
  await userEvent.click(submit);
  expect(screen.getByText("回答不正确")).toBeInTheDocument();
  await userEvent.click(b);
  expect(screen.queryByText("回答不正确")).not.toBeInTheDocument();
  await userEvent.click(submit);
  expect(screen.getByText("回答正确")).toBeInTheDocument();
  expect(
    options.filter((o) => o.getAttribute("aria-pressed") === "true"),
  ).toEqual([b]);
});

it("starts a new puzzle after remount while retaining historical answers, bookmarks and notes", async () => {
  location.hash = "discovery/chair";
  const history = {
    ...fresh(),
    answers: { chair: 1 },
    saved: ["chair"],
    notes: { chair: "继续了解工艺" },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  const view = render(<App />);
  expect(screen.getByRole("button", { name: "提交答案" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(
    view.container.querySelectorAll('.option[aria-pressed="true"]'),
  ).toHaveLength(0);
  await userEvent.click(
    screen.getByRole("button", {
      name: "B. 朱金木雕、金银彩绣、玻璃画",
      exact: true,
    }),
  );
  await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
  view.unmount();
  const reopened = render(<App />);
  expect(
    reopened.container.querySelectorAll('.option[aria-pressed="true"]'),
  ).toHaveLength(0);
  expect(
    screen.queryByRole("region", { name: "谜题解释" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("回答正确")).not.toBeInTheDocument();
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(stored.answers).toEqual({ chair: 1 });
  expect(stored.saved).toEqual(["chair"]);
  expect(stored.notes).toEqual({ chair: "继续了解工艺" });
  expect(
    stored.events.filter((e: { type: string }) => e.type === "puzzle_answer"),
  ).toHaveLength(1);
});

it("opens the visitor community from the final homepage banner", async () => {
  location.hash = "home";
  render(<App />);
  await userEvent.click(
    screen.getByRole("button", { name: "进入游客社区", exact: true }),
  );
  await waitFor(() => expect(location.hash).toBe("#saved"));
  expect(
    await screen.findByRole("heading", { name: "游客社区", exact: true }),
  ).toBeInTheDocument();
});

it("removes only the requested homepage, map and chair transcript details", () => {
  location.hash = "home";
  const { container } = render(<App />);
  expect(
    container.querySelectorAll(".artifact-grid .era,.artifact-grid .badge"),
  ).toHaveLength(0);
  expect(screen.queryByText("课程原型 · 非馆方产品")).not.toBeInTheDocument();
  expect(
    screen.queryByText(/礼轿图片已更新为用户提供的高清现场实拍/),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("没有固定路线，让好奇心决定方向"),
  ).toBeInTheDocument();
  open("map");
  expect(screen.queryByText(/下面是观察档案入口/)).not.toBeInTheDocument();
  open("story/chair");
  expect(container.querySelector(".transcript")).toBeNull();
  expect(
    screen.queryByText(/你好，我是物华号朱金百子大礼轿/),
  ).not.toBeInTheDocument();
  expect(container.querySelector("video source")).toHaveAttribute(
    "src",
    expect.stringContaining("chair-story-immersive-20261018.mp4"),
  );
});

it("removes hero labels, hub list badges and two map captions while preserving content and navigation", async () => {
  location.hash = "home";
  const { container } = render(<App />);
  expect(
    screen.queryByText("HISTORYQUEST 2.0 / SHANGHAI"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("Every artifact opens a new question."),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("藏品档案 / 001")).not.toBeInTheDocument();
  expect(container.querySelector(".hero-copy .hero-desc")).toHaveTextContent(
    "从眼前的细节出发，让好奇心带路。",
  );
  expect(container.querySelector(".object-label")).toHaveTextContent(
    "百子大礼轿",
  );
  expect(container.querySelector(".object-label")).toHaveTextContent("1936");
  expect(
    screen.getByRole("button", { name: "查看百子大礼轿高清照片", exact: true }),
  ).toBeInTheDocument();
  open("hub");
  expect(container.querySelectorAll(".topic-grid article")).toHaveLength(10);
  expect(container.querySelectorAll(".topic-grid .badge")).toHaveLength(0);
  expect(container.querySelectorAll(".topic-grid .eyebrow")).toHaveLength(10);
  await userEvent.click(
    screen.getByRole("button", { name: "地点", exact: true }),
  );
  expect(
    container.querySelectorAll(".topic-grid article").length,
  ).toBeGreaterThan(0);
  expect(
    [...container.querySelectorAll(".topic-grid .eyebrow")].every(
      (x) => x.textContent === "地点",
    ),
  ).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "全部", exact: true }),
  );
  expect(container.querySelectorAll(".topic-grid article")).toHaveLength(10);
  open("hub/craft");
  expect(container.querySelector("#topic-detail .badge")).toBeNull();
  open("map");
  expect(
    screen.queryByText(
      "按馆方导览册重绘建筑与展区。自由选择楼层，历史没有唯一的探索顺序。",
    ),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText("层间距为展示需要放大 · 保留楼层及空间相对关系"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "查看东楼3F 近代上海 · 开埠与转型" }),
  ).toBeInTheDocument();
});

it("applies only submitted search text, handles IME, and clears both search states", async () => {
  location.hash = "hub";
  const { container } = render(<App />);
  const input = screen.getByRole("textbox", { name: "搜索历史知识" });
  const form = screen.getByRole("search", { name: "知识卡搜索" });
  const count = () =>
    container.querySelectorAll(".knowledge-grid article").length;
  await userEvent.type(input, "  礼轿  ");
  expect(count()).toBe(10);
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });
  fireEvent.submit(form);
  expect(count()).toBe(10);
  fireEvent.compositionEnd(input);
  await userEvent.click(
    screen.getByRole("button", { name: "搜索", exact: true }),
  );
  expect(count()).toBe(1);
  await userEvent.clear(input);
  await userEvent.type(input, "不存在的内容");
  expect(count()).toBe(1);
  await userEvent.click(
    screen.getByRole("button", { name: "主题", exact: true }),
  );
  expect(count()).toBe(1);
  input.focus();
  await userEvent.keyboard("{Enter}");
  expect(count()).toBe(0);
  expect(screen.getByText("还没有这条线索")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "清除筛选", exact: true }),
  );
  expect(input).toHaveValue("");
  expect(count()).toBe(10);
  await userEvent.click(
    screen.getByRole("button", { name: "地点", exact: true }),
  );
  expect(count()).toBe(2);
  await userEvent.type(input, "   ");
  await userEvent.click(
    screen.getByRole("button", { name: "搜索", exact: true }),
  );
  expect(count()).toBe(2);
  await userEvent.type(input, "通信");
  expect(count()).toBe(2);
  await userEvent.click(
    screen.getByRole("button", { name: "清除搜索", exact: true }),
  );
  expect(input).toHaveValue("");
  expect(count()).toBe(2);
  await userEvent.click(
    screen.getByRole("button", { name: "全部", exact: true }),
  );
  expect(count()).toBe(10);
});

it("unmounts the explanation and stops its voice and music when the answer changes", async () => {
  location.hash = "discovery/chair";
  const playing = new WeakMap<HTMLMediaElement, boolean>();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
    function (this: HTMLMediaElement) {
      return !playing.get(this);
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.set(this, true);
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.set(this, false);
    this.dispatchEvent(new Event("pause"));
  });
  const view = render(<App />);
  try {
    await userEvent.click(
      screen.getByRole("button", {
        name: "B. 朱金木雕、金银彩绣、玻璃画",
        exact: true,
      }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "提交答案", exact: true }),
    );
    const region = screen.getByRole("region", { name: "谜题解释" });
    await userEvent.click(
      within(region).getByRole("button", { name: /背景音乐/ }),
    );
    await userEvent.click(
      within(region).getByRole("button", { name: /^播放讲解/ }),
    );
    const voice = region.querySelector<HTMLAudioElement>(
      "audio:not([data-ambience])",
    )!;
    const bed = region.querySelector<HTMLAudioElement>("audio[data-ambience]")!;
    expect(voice.paused).toBe(false);
    expect(bed.paused).toBe(false);
    await userEvent.click(
      screen.getByRole("button", {
        name: "A. 朱金木雕、金银彩绣、螺钿镶嵌",
        exact: true,
      }),
    );
    expect(
      screen.queryByRole("region", { name: "谜题解释" }),
    ).not.toBeInTheDocument();
    expect(voice.paused).toBe(true);
    expect(bed.paused).toBe(true);
  } finally {
    view.unmount();
    vi.restoreAllMocks();
  }
});

it("resets only the scroll viewport on navigation and keeps the main region keyboard-focusable", async () => {
  location.hash = "home";
  render(<App />);
  const main = screen.getByRole("main");
  expect(main).toHaveAttribute("tabindex", "0");
  main.scrollTop = 450;
  const internalScroll = vi.spyOn(main, "scrollTo").mockImplementation((options) => {
    if (typeof options === "object") main.scrollTop = options.top || 0;
  });
  const outerScroll = vi.spyOn(window, "scrollTo");
  outerScroll.mockClear();
  await userEvent.click(within(screen.getByRole("navigation", { name: "主导航" })).getByRole("link", { name: "好奇心中心" }));
  await waitFor(() => expect(internalScroll).toHaveBeenCalledWith({ top: 0, behavior: "instant" }));
  expect(main.scrollTop).toBe(0);
  expect(outerScroll).not.toHaveBeenCalled();
  internalScroll.mockRestore();
});
