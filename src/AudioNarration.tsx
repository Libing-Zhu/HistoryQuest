import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
  isValidElement,
} from "react";
import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Music2,
  Volume2,
} from "lucide-react";
import manifestData from "./audioManifest.json";
import { audioKey } from "./audioText";
import { assetBase } from "./data";

type Track = { file: string; duration: number; voice: string };
const tracks: Record<string, Track> = manifestData;
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// One foreground voice/video at a time. Background music belongs to its narration.
export function AudioEnvironment() {
  useEffect(() => {
    function foreground(event: Event) {
      const media = event.target;
      if (!(media instanceof HTMLMediaElement) || media.dataset.ambience)
        return;
      document
        .querySelectorAll<HTMLMediaElement>("audio:not([data-ambience]),video")
        .forEach((other) => {
          if (other !== media && !other.paused) other.pause();
        });
    }
    document.addEventListener("play", foreground, true);
    return () => document.removeEventListener("play", foreground, true);
  }, []);
  return null;
}
export function AudioNarration({
  text,
  label = "这段讲解",
  defaultMusic = false,
}: {
  text: string;
  label?: string;
  defaultMusic?: boolean;
}) {
  const track = tracks[audioKey(text)];
  if (!track)
    return (
      <p className="small muted" role="status">
        这段讲解暂时无法播放，可阅读下方完整文字。
      </p>
    );
  return (
    <NarrationPlayer
      key={audioKey(text)}
      track={track}
      label={label}
      defaultMusic={defaultMusic}
    />
  );
}
function NarrationPlayer({
  track,
  label,
  defaultMusic,
}: {
  track: Track;
  label: string;
  defaultMusic: boolean;
}) {
  const id = useId();
  const voice = useRef<HTMLAudioElement>(null);
  const bed = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [music, setMusic] = useState(defaultMusic);
  const [musicVolume, setMusicVolume] = useState(0.16);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState("");
  const [musicError, setMusicError] = useState("");
  const currentMusic = useRef(music);
  currentMusic.current = music;
  useEffect(() => {
    const audio = voice.current;
    const background = bed.current;
    return () => {
      audio?.pause();
      background?.pause();
    };
  }, []);
  useEffect(() => {
    if (voice.current) voice.current.playbackRate = rate;
  }, [rate]);
  useEffect(() => {
    if (bed.current) bed.current.volume = musicVolume;
  }, [musicVolume]);
  function stopBed() {
    bed.current?.pause();
  }
  async function startBed() {
    const audio = bed.current;
    if (!audio || !currentMusic.current) return;
    audio.volume = musicVolume;
    try {
      await audio.play();
      setMusicError("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMusicError("背景音乐暂时无法播放，讲解仍可继续。");
    }
  }
  async function toggle() {
    const audio = voice.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setStarted(true);
    setError("");
    audio.playbackRate = rate;
    // Both play requests run directly inside the user gesture for mobile browsers.
    void startBed();
    try {
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      stopBed();
      setPlaying(false);
      setError("播放未能开始，请再次点击播放；也可展开文字阅读。");
    }
  }
  function toggleMusic() {
    const enabled = !music;
    currentMusic.current = enabled;
    setMusic(enabled);
    if (!enabled) {
      stopBed();
      return;
    }
    if (voice.current && !voice.current.paused) void startBed();
  }
  return (
    <div
      className={`narration ${playing ? "is-playing" : ""}`}
      data-track={track.file}
    >
      <div className="narration-top">
        <Headphones size={17} aria-hidden="true" />
        <span>
          {label === "聆听完整礼轿故事" ? label : "聆听历史"}{" "}
          <small>中文讲述 · 合成配音</small>
        </span>
        <span className="narration-length">{clock(duration)}</span>
      </div>
      <div className="narration-actions">
        <button
          type="button"
          className="narration-play"
          aria-label={`${playing ? "暂停" : started ? "继续播放" : "播放"}讲解：${label}`}
          onClick={toggle}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
          {playing ? "暂停" : started ? "继续聆听" : "播放讲解"}
        </button>
        <button
          type="button"
          className="narration-music"
          aria-pressed={music}
          onClick={toggleMusic}
          aria-label={`背景音乐：${label}`}
        >
          <Music2 size={15} /> 配乐{music ? "已开" : "已关"}
        </button>
        <label className="narration-rate">
          <span className="sr-only">播放速度：{label}</span>
          <select
            aria-label={`播放速度：${label}`}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            <option value={0.85}>0.85×</option>
            <option value={1}>1.0×</option>
            <option value={1.15}>1.15×</option>
            <option value={1.3}>1.3×</option>
          </select>
        </label>
      </div>
      {started && (
        <div className="narration-progress">
          <button
            type="button"
            aria-label={`从头播放：${label}`}
            onClick={() => {
              if (voice.current) {
                voice.current.currentTime = 0;
                setTime(0);
                if (voice.current.paused) void toggle();
              }
            }}
          >
            <RotateCcw size={15} />
          </button>
          <input
            type="range"
            aria-label={`播放进度：${label}`}
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={Math.min(time, duration)}
            onChange={(e) => {
              if (voice.current) {
                voice.current.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }
            }}
          />
          <span>
            {clock(time)} / {clock(duration)}
          </span>
        </div>
      )}
      {music && (
        <label className="narration-mix" htmlFor={`${id}-mix`}>
          <Volume2 size={14} /> 配乐音量
          <input
            id={`${id}-mix`}
            type="range"
            min={0}
            max={0.4}
            step={0.01}
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
          />
        </label>
      )}
      {error && (
        <p className="narration-error" role="alert">
          {error}
        </p>
      )}
      {musicError && (
        <p className="narration-error" role="status">
          {musicError}
        </p>
      )}
      <audio
        ref={voice}
        src={assetBase + "audio/" + track.file}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          stopBed();
        }}
        onEnded={() => {
          setPlaying(false);
          setStarted(false);
          setTime(0);
          stopBed();
          if (voice.current) voice.current.currentTime = 0;
        }}
        onTimeUpdate={() => setTime(voice.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          const d = voice.current?.duration;
          if (d && Number.isFinite(d)) setDuration(d);
        }}
        onError={() => {
          setPlaying(false);
          stopBed();
          setError("音频暂时无法载入，请检查连接或阅读下方文字。");
        }}
      />
      <audio
        ref={bed}
        data-ambience="true"
        src={assetBase + "audio/museum-ambience.mp3"}
        preload="none"
        loop
        aria-hidden="true"
      />
    </div>
  );
}
function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return plainText(node.props.children);
  return "";
}
export function NarratedText({
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const text = plainText(children).trim();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const hasTrack = Boolean(tracks[audioKey(text)]);
  // Short labels and personal notes stay ordinary text; only pre-rendered public
  // content is narrated. No visitor text is sent to a speech service at runtime.
  if (!hasTrack) return <p {...props}>{children}</p>;
  const long = text.replace(/\s+/g, "").length > 120;
  const label = text.slice(0, 16).replace(/\s/g, "");
  return (
    <div className="narrated-passage">
      <AudioNarration text={text} label={label} />
      <p
        {...props}
        id={id}
        className={[
          props.className,
          long && !expanded ? "narration-text-preview" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </p>
      {long && (
        <button
          type="button"
          className="narration-text-toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "收起长文" : "展开完整文字"}
        </button>
      )}
    </div>
  );
}
