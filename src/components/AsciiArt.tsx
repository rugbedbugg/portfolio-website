import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { detectViewer, type Viewer } from "@/lib/viewer";
import { recordVisit, relTime } from "@/lib/trace";

// Portrait sources: real photo (RAW) by default, CGA-dithered via the DITHER toggle.
const AVATAR_CGA = "/avatar-cga.png";
const AVATAR_RAW = "/avatar.jpg";
const AVATAR_FALLBACK = "/avatar.svg";

const TRACKS = [
  "/assets/memory-reboot.mp3",
  "/assets/vision-slowed.mp3",
  "/assets/insonamia-slowed.mp3",
];

const TRACK_META = [
  "MEMORY REBOOT — VØJ (SLOWED)",
  "VISION — UDIENNX (SLOWED)",
  "INSONAMIA — RONALD FIGO (SLOWED+RVB)",
];

// CH 03 is the live subject; the others are real "feeds" you can tune to.
const CH_SUBJECT = 3;
const CH_COUNT = 5;
const CH_STATUS: Record<number, string> = {
  1: "COLOR BARS",
  2: "NO SIGNAL",
  3: "CAM-01 LIVE",
  4: "SUBJECT FILE",
  5: "VIEWER FILE",
};
// Live "tape" date, e.g. THU 23 JUL 2026 — everything on the feed reads live.
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
const fmtDate = (d: Date) =>
  `${WEEKDAYS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
// Surveillance geo-tag for the camera HUD / subject dossier
const GPS_DECIMAL = "12.911210, 79.132685";
const GPS_DMS = "12°54'40\"N 79°07'57\"E";
// VHS/NTSC interlaced resolution tag for the live header
const LIVE_TAG = "[LIVE] · 480i";
// base id for the "current viewer" - rendered with live-varying Zalgo corruption
const VIEWER_BASE = "YOU";
const VOL_SEGMENTS = 12;
const COLOR_BARS = [
  "#FFFFFF",
  "#FFFF55",
  "#55FFFF",
  "#55FF55",
  "#FF55FF",
  "#FF5555",
  "#5555FF",
];

const fmtClock = (d: Date) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

// Running SMPTE tape timecode (HH:MM:SS:FF @ 30fps). Isolated in its own
// component so the ~30/s tick doesn't re-render the whole feed.
const Timecode = ({ reduced }: { reduced: boolean }) => {
  const smpte = () => {
    const d = new Date();
    const ff = Math.min(29, Math.floor((d.getMilliseconds() / 1000) * 30));
    return [d.getHours(), d.getMinutes(), d.getSeconds(), ff]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  };
  const [tc, setTc] = useState(() => smpte());
  useEffect(() => {
    if (reduced) {
      setTc(smpte().slice(0, 8) + ":00");
      return;
    }
    const id = window.setInterval(() => setTc(smpte()), 1000 / 30);
    return () => window.clearInterval(id);
  }, [reduced]);
  return <span className="tabular-nums">{tc}</span>;
};

// combining marks used to "corrupt" text (Zalgo)
const GLITCH_UP = [
  "̀", "́", "̂", "̃", "̄", "̆", "̈",
  "̊", "̋", "̑", "̓", "͗", "͛",
];
const GLITCH_DOWN = [
  "̖", "̗", "̜", "̣", "̤", "̩", "̮",
  "̱", "̳", "͓", "͔", "͙",
];
const GLITCH_MID = ["̴", "̵", "̶", "̷", "̸"];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// stack a random set of combining marks on each glyph; regenerated per frame
const zalgo = (base: string, intensity = 4) => {
  let out = "";
  for (const ch of base) {
    out += ch;
    for (let i = 1 + Math.floor(Math.random() * intensity); i > 0; i--)
      out += pick(GLITCH_UP);
    for (let i = 1 + Math.floor(Math.random() * intensity); i > 0; i--)
      out += pick(GLITCH_DOWN);
    if (Math.random() < 0.7) out += pick(GLITCH_MID);
  }
  return out;
};

// text that re-corrupts every ~110ms so it reads as actively glitching
const GlitchText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const [glitched, setGlitched] = useState(() => zalgo(text));
  useEffect(() => {
    if (reduced) {
      setGlitched(zalgo(text, 2));
      return;
    }
    const id = window.setInterval(() => setGlitched(zalgo(text)), 110);
    return () => window.clearInterval(id);
  }, [text, reduced]);
  return (
    <span className={className} aria-label={text}>
      {glitched}
    </span>
  );
};

const AsciiArt = () => {
  const prefersReducedMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef(0);

  // Web Audio graph (built lazily on first play) for the real spectrum meter
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const graphReadyRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [invert, setInvert] = useState(false);
  const [dither, setDither] = useState(false);

  const [channel, setChannel] = useState(CH_SUBJECT);
  const [volume, setVolume] = useState(0.3);
  const [jamming, setJamming] = useState(false);

  const [statusText, setStatusText] = useState("● REC · STANDBY");
  const [trackMeta, setTrackMeta] = useState(TRACK_META[0]);
  const [clock, setClock] = useState(() => fmtClock(new Date()));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([
    "cam-01@oxide:~$ boot feed",
    "[ok] sensor array online",
    "[ok] cga adapter linked",
    "[rec] logging feed...",
  ]);

  const subjectLive = channel === CH_SUBJECT && !jamming;
  const channelLabel = `CH ${String(channel).padStart(2, "0")}`;
  const showStatic = jamming || channel === 2;
  // CH 04/05 are teletext data pages, not camera views — hide camera-only OSD there.
  const teletext = channel === 4 || channel === 5;
  const filledSegments = Math.round(volume * VOL_SEGMENTS);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = 0.3;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Trace the actual visitor (client-side only) for the CH 05 viewer dossier.
  const [viewer, setViewer] = useState<Viewer | null>(null);
  useEffect(() => {
    setViewer(detectViewer());
    const onResize = () =>
      setViewer((v) =>
        v ? { ...v, view: `${window.innerWidth}×${window.innerHeight}` } : v,
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Local visit trace ("we see you"): recorded once, shared with the footer.
  const [trace] = useState(() => recordVisit());

  // Idle patrol: after 20s of no interaction the feed goes to "resuming patrol".
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t = 0;
    const reset = () => {
      setIdle(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), 20000);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  // Spectrum meter: real audio bars when playing, idle shimmer otherwise.
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx2d = cv?.getContext("2d");
    if (!cv || !ctx2d) return;
    const W = cv.width;
    const H = cv.height;
    const BARS = 22;
    const bw = W / BARS;

    const paint = (heights: number[]) => {
      ctx2d.clearRect(0, 0, W, H);
      ctx2d.fillStyle = "#55FFFF";
      for (let i = 0; i < BARS; i++) {
        const bh = Math.max(1, heights[i] * H);
        ctx2d.fillRect(i * bw + 0.5, H - bh, bw - 1, bh);
      }
    };

    if (prefersReducedMotion) {
      paint(new Array(BARS).fill(0.06));
      return;
    }

    let raf = 0;
    let ph = 0;
    const render = () => {
      const analyser = analyserRef.current;
      const freq = freqRef.current;
      const heights: number[] = [];
      if (playing && analyser && freq) {
        analyser.getByteFrequencyData(freq);
        for (let i = 0; i < BARS; i++) {
          heights[i] = Math.min(1, (freq[i] / 255) * 1.15);
        }
      } else {
        for (let i = 0; i < BARS; i++) {
          heights[i] =
            0.05 +
            (Math.sin(ph + i * 0.55) * 0.5 + 0.5) * 0.08 +
            Math.random() * 0.03;
        }
      }
      paint(heights);
      ph += 0.09;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [playing, prefersReducedMotion]);

  const pushLog = (line: string) =>
    setLog((prev) => [...prev, line].slice(-8));

  const ensureAudioGraph = () => {
    if (graphReadyRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      graphReadyRef.current = true;
    } catch {
      // Web Audio unavailable: meter falls back to idle shimmer.
    }
  };

  const playTrackByIndex = async (idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    currentTrackRef.current = idx;
    setTrackMeta(TRACK_META[idx]);
    audio.src = TRACKS[idx];
    try {
      await audio.play();
    } catch {
      // ignore autoplay/playback errors
    }
  };

  const applyRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = slow ? 0.82 : turbo ? 1.18 : 1;
  };

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    ensureAudioGraph();
    audioCtxRef.current?.resume?.();
    if (playing) {
      audio.pause();
      setPlaying(false);
      pushLog("$ deck pause");
      setStatusText("● REC · PAUSED");
      return;
    }
    await playTrackByIndex(currentTrackRef.current);
    applyRate();
    setPlaying(true);
    pushLog("$ deck play");
    setStatusText("● REC · PLAYBACK");
  };

  const handleSpeed = (mode: "slow" | "turbo") => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextSlow = mode === "slow" ? !slow : false;
    const nextTurbo = mode === "turbo" ? !turbo : false;
    setSlow(nextSlow);
    setTurbo(nextTurbo);
    audio.playbackRate = nextSlow ? 0.82 : nextTurbo ? 1.18 : 1;
    if (mode === "slow") {
      pushLog(nextSlow ? "$ deck rate 0.82" : "$ deck rate 1.00");
      setStatusText(nextSlow ? "SLO-MO ENGAGED" : "RATE NORMAL");
    } else {
      pushLog(nextTurbo ? "$ deck rate 1.18" : "$ deck rate 1.00");
      setStatusText(nextTurbo ? "FAST FORWARD" : "RATE NORMAL");
    }
  };

  const handleJam = async () => {
    pushLog("$ uplink --drop // SIGNAL LOST");
    setStatusText("◇ SIGNAL LOST ◇");
    setJamming(true);
    window.setTimeout(() => setJamming(false), 1500);
    const nextIdx = Math.floor(Math.random() * TRACKS.length);
    currentTrackRef.current = nextIdx;
    setTrackMeta(TRACK_META[nextIdx]);
    if (playing) {
      await playTrackByIndex(nextIdx);
      applyRate();
    }
  };

  const stepChannel = (dir: 1 | -1) => {
    setChannel((c) => {
      const next = ((c - 1 + dir + CH_COUNT) % CH_COUNT) + 1;
      pushLog(`$ tuner set --ch ${String(next).padStart(2, "0")}`);
      setStatusText(CH_STATUS[next]);
      return next;
    });
  };

  const toggleInvert = () => {
    setInvert((v) => {
      pushLog(v ? "$ video invert --off" : "$ video invert --on");
      setStatusText(v ? "VIDEO NORMAL" : "VIDEO INVERTED");
      return !v;
    });
  };

  const toggleDither = () => {
    setDither((d) => {
      pushLog(d ? "$ decode raw" : "$ decode cga --dither");
      setStatusText(d ? "RAW FEED" : "CGA DECODE");
      return !d;
    });
  };

  const setVol = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    const audio = audioRef.current;
    if (audio) audio.volume = clamped;
  };

  const nudgeVol = (delta: number) =>
    setVol(Math.round((volume + delta) * VOL_SEGMENTS) / VOL_SEGMENTS);

  const rawFilter = useMemo(
    () => "contrast(1.16) brightness(0.94) saturate(0.9) blur(0.5px)",
    [],
  );

  const feedFilter =
    [dither ? "" : rawFilter, invert ? "invert(1)" : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  const toggles: Array<{ label: string; active: boolean; onToggle: () => void }> =
    [
      { label: "INVERT", active: invert, onToggle: toggleInvert },
      { label: "DITHER", active: dither, onToggle: toggleDither },
    ];

  const transport: Array<{
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }> = [
    { icon: "<<", label: "SLO-MO", active: slow, onClick: () => handleSpeed("slow") },
    { icon: ">>", label: "F.FWD", active: turbo, onClick: () => handleSpeed("turbo") },
    { icon: "!!", label: "JAM", active: jamming, onClick: handleJam },
    {
      icon: playing ? "||" : ">",
      label: playing ? "HOLD" : "PLAY",
      active: playing,
      onClick: handlePlay,
    },
  ];

  const cornerClasses = [
    "left-1 top-1 border-l border-t",
    "right-1 top-1 border-r border-t",
    "left-1 bottom-1 border-l border-b",
    "right-1 bottom-1 border-r border-b",
  ];

  const noticeText = jamming
    ? { big: "SIGNAL LOST", small: "-- UPLINK DROPPED --" }
    : channel === 2
      ? { big: "NO SIGNAL", small: `${channelLabel} · CHECK INPUT` }
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9 }}
      className="mx-auto w-full max-w-[900px]"
      aria-label="CGA surveillance feed module"
    >
      <audio
        ref={audioRef}
        src={TRACKS[0]}
        preload="metadata"
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio) audio.volume = volume;
        }}
        onEnded={async () => {
          const nextIdx = Math.floor(Math.random() * TRACKS.length);
          currentTrackRef.current = nextIdx;
          pushLog(`[rec] reel ended → next #${nextIdx + 1}`);
          if (playing) {
            await playTrackByIndex(nextIdx);
            applyRate();
          }
        }}
      />

      <div className="relative border-2 border-cga-bcyan/40 bg-cga-black p-4 sm:p-5">
        {/* header: REC · tape · timestamp */}
        <div className="relative z-20 mx-auto mb-3 h-8 w-[96%] border border-cga-bcyan/30 bg-cga-bcyan/[0.06] px-3 overflow-hidden">
          <div className="mono-command grid h-full grid-cols-[auto_1fr_auto] items-center gap-2 text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.18em]">
            <span className="flex items-center gap-1.5 text-left text-cga-bred">
              <span className="inline-block h-2 w-2 bg-cga-bred animate-blink" />
              {LIVE_TAG}
            </span>
            <span className="truncate text-center text-cga-gray">{trackMeta}</span>
            <span className="text-right tabular-nums text-cga-bcyan">{clock}</span>
          </div>
        </div>

        <div className="relative border border-cga-bcyan/35 bg-cga-black px-4 py-4">
          <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4">
            {/* system log: shown on mobile, hidden inside the split identity panel from md up */}
            <div className="flex h-[212px] min-w-0 flex-col overflow-hidden border border-cga-bcyan/25 bg-cga-black p-2.5 md:hidden">
              <div className="mono-command mb-2 border-b border-cga-bcyan/20 pb-1 text-[9px] text-cga-cyan">
                cam-01@oxide:~
              </div>
              <div className="mono-command h-[170px] space-y-1 overflow-hidden text-[8px] leading-relaxed text-cga-bgreen sm:text-[9px]">
                {log.map((line, idx) => (
                  <div key={`${line}-${idx}`} className="truncate">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* center: surveillance feed */}
            <div className="relative h-[212px] overflow-hidden border border-cga-bcyan/20 bg-cga-black p-2.5">
              <div
                className="relative h-full overflow-hidden border border-cga-bcyan/15"
                style={{
                  animation:
                    jamming && !prefersReducedMotion
                      ? "glitch-tear 0.5s steps(3) infinite"
                      : undefined,
                }}
              >
                {/* CH 03 — live subject */}
                {subjectLive && (
                  <img
                    src={dither ? AVATAR_CGA : AVATAR_RAW}
                    alt="Partha Pratim Gogoi profile"
                    className="h-full w-full object-contain"
                    style={{
                      objectPosition: "50% 50%",
                      filter: feedFilter,
                      imageRendering: dither ? "pixelated" : "auto",
                    }}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src.endsWith(AVATAR_FALLBACK)) return;
                      img.src = AVATAR_FALLBACK;
                    }}
                  />
                )}

                {/* CH 01 — SMPTE color bars */}
                {!jamming && channel === 1 && (
                  <div className="absolute inset-0 flex">
                    {COLOR_BARS.map((c) => (
                      <div key={c} className="h-full flex-1" style={{ background: c }} />
                    ))}
                  </div>
                )}

                {/* CH 04 — teletext subject file */}
                {!jamming && channel === 4 && (
                  <div className="mono-command absolute inset-0 flex flex-col justify-center gap-1 px-4 text-[9px] leading-relaxed text-cga-bcyan">
                    <div className="text-cga-yellow">SUBJECT FILE :: CH 04</div>
                    <div className="text-cga-bcyan/40">--------------------</div>
                    <div>ID     : OXIDE 1-6</div>
                    <div>CLASS  : CTF · FORENSICS</div>
                    <div>FOCUS  : LOW-LEVEL / RE</div>
                    <div>
                      STATUS : <span className="text-cga-bgreen">TRACED</span>
                    </div>
                    <div>LOC    : {GPS_DMS}</div>
                  </div>
                )}

                {/* CH 05 — the visitor's own dossier ("we see you") */}
                {!jamming && channel === 5 && (
                  <div className="mono-command absolute inset-0 flex flex-col justify-center gap-1 px-4 text-[9px] leading-relaxed text-cga-bcyan">
                    <div className="flex items-center justify-between text-cga-bred">
                      <span>VIEWER FILE :: CH 05</span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-1.5 w-1.5 bg-cga-bred animate-blink" />
                        TRACE LOCKED
                      </span>
                    </div>
                    <div className="text-cga-bcyan/40">--------------------</div>
                    <div>NODE   : {viewer?.node ?? "RESOLVING..."}</div>
                    <div>DISPLAY: {viewer?.display ?? "..."}</div>
                    <div>VIEW   : {viewer?.view ?? "..."}</div>
                    <div>TZ     : {viewer?.tz ?? "..."}</div>
                    <div>LOCALE : {viewer?.locale ?? "..."}</div>
                    <div>
                      SEEN   :{" "}
                      {trace.isNew
                        ? "FIRST CONTACT"
                        : `${trace.visits}× · LAST ${relTime(trace.lastSeen)}`}
                    </div>
                  </div>
                )}

                {/* broad CRT scanlines (always on) */}
                <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_2px,transparent_2px,transparent_4px)]" />
                {/* ambient head-switch line */}
                {!prefersReducedMotion && (
                  <div
                    className="pointer-events-none absolute left-0 h-[10px] w-full bg-cga-white/10 blur-[1px] mix-blend-overlay"
                    style={{ animation: "tracking-roll 9s linear infinite" }}
                  />
                )}
                {/* dead-channel / signal-loss static */}
                {showStatic && (
                  <div className="vhs-static pointer-events-none absolute inset-[-50%] h-[200%] w-[200%] opacity-80" />
                )}
                {/* JAM: one slow rolling band (no fast strobe) */}
                {jamming && !prefersReducedMotion && (
                  <div
                    className="pointer-events-none absolute left-0 h-[22px] w-full bg-cga-white/25 blur-[1px] mix-blend-overlay"
                    style={{ animation: "tracking-roll 0.9s linear infinite" }}
                  />
                )}
                {/* no-signal / signal-lost notice */}
                {noticeText && (
                  <div className="mono-command absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                    <span className="text-[11px] tracking-[0.3em] text-cga-bcyan">
                      {noticeText.big}
                    </span>
                    <span className="text-[8px] tracking-[0.2em] text-cga-gray">
                      {noticeText.small}
                    </span>
                  </div>
                )}
                {/* vignette */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_42%,rgba(0,0,0,0.6)_100%)]" />

                {/* idle patrol: no interaction for a while → feed disengages */}
                {idle && !noticeText && !jamming && (
                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div className="absolute inset-0 flex opacity-25">
                      {COLOR_BARS.map((c) => (
                        <div key={c} className="h-full flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-cga-black/55" />
                    {!prefersReducedMotion && (
                      <div
                        className="absolute left-0 h-[14px] w-full bg-cga-bcyan/20 blur-[1px] mix-blend-overlay"
                        style={{ animation: "tracking-roll 2.4s linear infinite" }}
                      />
                    )}
                    <div className="mono-command absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                      <span className="text-[11px] tracking-[0.28em] text-cga-bcyan animate-blink">
                        SUBJECT DISENGAGED
                      </span>
                      <span className="text-[8px] tracking-[0.2em] text-cga-gray">
                        RESUMING PATROL · MOVE TO RE-ACQUIRE
                      </span>
                    </div>
                  </div>
                )}

                {/* HUD: corner brackets */}
                {cornerClasses.map((c) => (
                  <div
                    key={c}
                    className={`pointer-events-none absolute h-3 w-3 border-cga-bcyan/70 ${c}`}
                  />
                ))}
                {/* HUD: REC / channel / timestamp (dark OSD chips keep text legible over any feed) */}
                {!teletext && (
                  <div className="mono-command pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-[1px] bg-cga-black/60 px-1.5 py-0.5 text-[8px] text-cga-bred">
                    <span className="inline-block h-1.5 w-1.5 bg-cga-bred animate-blink" />
                    REC
                    <span className="text-cga-bcyan/90">
                      <Timecode reduced={!!prefersReducedMotion} />
                    </span>
                  </div>
                )}
                <div className="mono-command pointer-events-none absolute right-2 top-2 rounded-[1px] bg-cga-black/60 px-1.5 py-0.5 text-[8px] tracking-[0.18em] text-cga-bcyan">
                  {channelLabel}
                </div>
                {!teletext && (
                  <div className="mono-command pointer-events-none absolute bottom-2 left-2 flex flex-col gap-0.5 rounded-[1px] bg-cga-black/60 px-1.5 py-0.5 text-[8px] tabular-nums leading-tight">
                    <span className="text-cga-white/85">
                      {fmtDate(new Date())} <span className="text-cga-cyan">LCL</span> {clock}
                    </span>
                    <span className="text-cga-bcyan">◎ {GPS_DECIMAL}</span>
                  </div>
                )}
              </div>
            </div>

            {/* right: monitor controls */}
            <div className="flex h-[212px] min-w-0 flex-col overflow-hidden border border-cga-bcyan/25 bg-cga-black p-2.5">
              <div className="mono-command mb-2 border-b border-cga-bcyan/20 pb-1 text-[8px] text-cga-cyan">
                monitor.ctl
              </div>
              <div
                className="mono-command flex min-h-0 flex-1 flex-col justify-between text-[8px]"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex-none space-y-1">
                  {/* channel stepper */}
                  <div className="flex items-center justify-between border border-cga-bcyan/25 bg-cga-bcyan/[0.05] px-2 py-[3px] text-cga-bcyan">
                    <button
                      type="button"
                      aria-label="Previous channel"
                      onClick={() => stepChannel(-1)}
                      className="px-1 text-cga-cyan hover:text-cga-bcyan"
                    >
                      {"<"}
                    </button>
                    <span className="tracking-[0.16em]">
                      {channelLabel} {CH_STATUS[channel]}
                    </span>
                    <button
                      type="button"
                      aria-label="Next channel"
                      onClick={() => stepChannel(1)}
                      className="px-1 text-cga-cyan hover:text-cga-bcyan"
                    >
                      {">"}
                    </button>
                  </div>

                  {/* effect toggles: two columns so each reads as a button */}
                  <div className="grid grid-cols-2 gap-1">
                  {toggles.map((opt, idx) => {
                    const marked = hoveredIndex === idx;
                    return (
                      <div
                        key={opt.label}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onClick={opt.onToggle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") opt.onToggle();
                        }}
                        className={`w-full cursor-pointer select-none border border-cga-bcyan/25 px-2 py-[3px] text-left transition-colors ${
                          opt.active
                            ? "bg-cga-bcyan text-cga-black"
                            : "bg-cga-bcyan/[0.05] text-cga-cyan"
                        }`}
                      >
                        <span
                          className={`inline-block w-4 ${
                            opt.active
                              ? "text-cga-black"
                              : marked
                                ? "text-cga-bcyan"
                                : "text-cga-cyan/40"
                          }`}
                        >
                          {marked || opt.active ? ">" : "·"}
                        </span>
                        <span>{opt.label}</span>
                        <span className="float-right inline-block w-8 text-right">
                          {opt.active ? "ON" : "OFF"}
                        </span>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* volume: segmented bar */}
                <div className="mt-2 flex-none border border-cga-bcyan/25 bg-cga-bcyan/[0.05] px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between text-[8px] text-cga-cyan">
                    <span>VOL</span>
                    <span className="text-cga-bcyan">{Math.round(volume * 100)}%</span>
                  </div>
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Volume"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(volume * 100)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft" || e.key === "ArrowDown")
                        nudgeVol(-1 / VOL_SEGMENTS);
                      if (e.key === "ArrowRight" || e.key === "ArrowUp")
                        nudgeVol(1 / VOL_SEGMENTS);
                    }}
                    className="flex gap-[2px]"
                  >
                    {Array.from({ length: VOL_SEGMENTS }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Volume ${Math.round(((i + 1) / VOL_SEGMENTS) * 100)}%`}
                        onClick={() => setVol((i + 1) / VOL_SEGMENTS)}
                        className={`h-3 flex-1 border ${
                          i < filledSegments
                            ? "border-cga-bcyan bg-cga-bcyan"
                            : "border-cga-bcyan/20 bg-cga-bcyan/[0.06]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* signal spectrum meter */}
                <div className="mt-2 flex-none overflow-hidden border border-cga-bcyan/25 bg-cga-bcyan/[0.05] px-2 py-1">
                  <div className="mb-0.5 text-[8px] text-cga-cyan">SIGNAL</div>
                  <canvas
                    ref={canvasRef}
                    width={160}
                    height={26}
                    className="h-[22px] w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* beefy transport */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {transport.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.onClick}
                className={`mono-command flex w-full flex-col items-center justify-center gap-1 border-2 px-2 py-3 tracking-[0.12em] transition-colors ${
                  btn.active
                    ? "border-cga-white bg-cga-bcyan text-cga-black"
                    : "border-cga-bcyan/40 bg-cga-bcyan/[0.05] text-cga-bcyan hover:bg-cga-bcyan/15"
                }`}
              >
                <span className="text-[13px] leading-none">{btn.icon}</span>
                <span className="text-[10px] leading-none sm:text-[11px]">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="mono-command mt-3 h-4 text-center text-[10px] tracking-[0.16em] text-cga-bcyan">
            {statusText}
          </div>

          <div className="mt-4 h-1.5 border border-cga-bcyan/25 bg-cga-bcyan/15" />
        </div>

        {/* footer */}
        <div className="mono-command relative z-20 mt-4 flex flex-col items-center gap-1.5 text-[10px] tracking-[0.18em] text-cga-cyan sm:grid sm:grid-cols-3 sm:items-center sm:gap-2">
          <span className="text-center sm:text-left">SECURITY TAPE</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("oxide:terminal"))}
            aria-label="Open terminal"
            className="mx-auto border border-cga-bgreen/50 bg-cga-black/80 px-2.5 py-1 text-[10px] tracking-[0.16em] text-cga-bgreen transition-colors hover:border-cga-bgreen hover:bg-cga-bgreen/10 hover:text-cga-white"
          >
            {">_ TERMINAL  [ ` ]"}
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel(5);
              setStatusText(CH_STATUS[5]);
              pushLog("$ tuner set --ch 05 // trace viewer");
            }}
            title="Tune to viewer file"
            className="flex items-center justify-center gap-1.5 tracking-[0.06em] transition-colors hover:text-cga-bcyan sm:justify-end"
          >
            <span className="text-cga-gray">CURRENT VIEWER -</span>
            <GlitchText text={VIEWER_BASE} className="text-cga-bred" />
          </button>
        </div>

        {/* subtle CRT corner curvature */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(130%_130%_at_50%_50%,transparent_62%,rgba(0,0,0,0.55)_100%)]" />
      </div>
    </motion.div>
  );
};

export default AsciiArt;
