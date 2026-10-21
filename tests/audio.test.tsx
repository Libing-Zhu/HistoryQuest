import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AudioEnvironment,
  AudioNarration,
  NarratedText,
} from "../src/AudioNarration";
import { topics, artifacts, topicNarration } from "../src/data";
import { floors } from "../src/mapData";
import { highlights } from "../src/mapHighlights";
import manifest from "../src/audioManifest.json";
import { audioKey } from "../src/audioText";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
let paused: WeakMap<HTMLMediaElement, boolean>;
beforeEach(() => {
  paused = new WeakMap();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
    function (this: HTMLMediaElement) {
      return paused.get(this) ?? true;
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    paused.set(this, false);
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    paused.set(this, true);
    this.dispatchEvent(new Event("pause"));
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const text = topics[0].body;
describe("museum listening", () => {
  it("does not autoplay; coordinates two narrations and foreground video", async () => {
    const { container } = render(
      <>
        <AudioEnvironment />
        <AudioNarration text={text} label="桥梁" defaultMusic />
        <AudioNarration text={topics[1].body} label="人物" />
        <video />
      </>,
    );
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(container.querySelector("audio")).toHaveAttribute("preload", "none");
    await userEvent.click(
      screen.getByRole("button", { name: "播放讲解：桥梁" }),
    );
    expect(
      screen.getByRole("button", { name: "暂停讲解：桥梁" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "播放讲解：人物" }),
    );
    expect(
      screen.getByRole("button", { name: "继续播放讲解：桥梁" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "暂停讲解：人物" }),
    ).toBeInTheDocument();
    await container.querySelector("video")!.play();
    expect(
      screen.getByRole("button", { name: "继续播放讲解：人物" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector<HTMLAudioElement>("audio[data-ambience]")!.paused,
    ).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "继续播放讲解：桥梁" }),
    );
    expect(container.querySelector("video")!.paused).toBe(true);
    expect(
      container.querySelector<HTMLAudioElement>("audio[data-ambience]")!.paused,
    ).toBe(false);
    await container.querySelector("video")!.play();
    expect(
      container.querySelector<HTMLAudioElement>("audio[data-ambience]")!.paused,
    ).toBe(true);
  });
  it("keeps music optional and supports speed, seeking and pause", async () => {
    const { container } = render(<AudioNarration text={text} label="桥梁" />);
    const voice = container.querySelector("audio:not([data-ambience])")!;
    const music = container.querySelector<HTMLAudioElement>("[data-ambience]")!;
    await userEvent.click(
      screen.getByRole("button", { name: "背景音乐：桥梁" }),
    );
    expect(music.paused).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "播放讲解：桥梁" }),
    );
    expect(music.paused).toBe(false);
    await userEvent.selectOptions(
      screen.getByLabelText("播放速度：桥梁"),
      "1.15",
    );
    expect(voice.playbackRate).toBe(1.15);
    fireEvent.change(screen.getByLabelText("播放进度：桥梁"), {
      target: { value: 4 },
    });
    expect(voice.currentTime).toBe(4);
    await userEvent.click(
      screen.getByRole("button", { name: "暂停讲解：桥梁" }),
    );
    expect(music.paused).toBe(true);
  });
  it("keeps full text accessible and reports media errors", async () => {
    const { container } = render(<NarratedText>{text}</NarratedText>);
    expect(screen.getByText(text)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "展开完整文字" }));
    expect(screen.getByText(text)).not.toHaveClass("narration-text-preview");
    fireEvent.error(container.querySelector("audio")!);
    expect(screen.getByRole("alert")).toHaveTextContent("音频暂时无法载入");
  });
  it("ships decodable public narration assets for all substantive structured explanations", () => {
    const required = [
      ...topics.map((t) => (t.sections ? topicNarration(t) : t.body)),
      ...artifacts.flatMap((a) => [
        a.observe,
        a.explanation,
        a.fact,
        a.story.join(" "),
      ]),
      ...floors.flatMap((f) => f.regions.map((r) => r.description)),
      ...highlights.map((h) => h.note),
    ].filter((t) => t.replace(/\s/g, "").length >= 45);
    const tracks: Record<string, { file: string; duration: number }> = manifest;
    for (const text of required) {
      const item = tracks[audioKey(text)];
      expect(item, text).toBeDefined();
      const f = path.resolve("public/media/audio", item.file);
      expect(existsSync(f)).toBe(true);
      expect(readFileSync(f).length).toBeGreaterThan(1000);
      expect(item.duration).toBeGreaterThan(1);
    }
  });
});

it("starts the complete chair narration with optional music only on a user gesture", async () => {
  const craft = topics.find((t) => t.id === "craft")!;
  const { container } = render(
    <AudioNarration
      text={topicNarration(craft)}
      label="聆听完整礼轿故事"
      defaultMusic
    />,
  );
  const voice = container.querySelector<HTMLAudioElement>(
    "audio:not([data-ambience])",
  )!;
  const bed = container.querySelector<HTMLAudioElement>(
    "audio[data-ambience]",
  )!;
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "背景音乐：聆听完整礼轿故事" }),
  ).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(
    screen.getByRole("button", { name: "播放讲解：聆听完整礼轿故事" }),
  );
  expect(voice.paused).toBe(false);
  expect(bed.paused).toBe(false);
  await userEvent.click(
    screen.getByRole("button", { name: "背景音乐：聆听完整礼轿故事" }),
  );
  expect(voice.paused).toBe(false);
  expect(bed.paused).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "暂停讲解：聆听完整礼轿故事" }),
  );
  expect(voice.paused).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "继续播放讲解：聆听完整礼轿故事" }),
  );
  expect(bed.paused).toBe(true);
});

it("restarts a paused narration from its beginning", async () => {
  const { container } = render(<AudioNarration text={text} label="重新聆听" />);
  const voice = container.querySelector<HTMLAudioElement>(
    "audio:not([data-ambience])",
  )!;
  await userEvent.click(
    screen.getByRole("button", { name: "播放讲解：重新聆听" }),
  );
  voice.currentTime = 12;
  await userEvent.click(
    screen.getByRole("button", { name: "暂停讲解：重新聆听" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "从头播放：重新聆听" }),
  );
  expect(voice.currentTime).toBe(0);
  expect(voice.paused).toBe(false);
});
