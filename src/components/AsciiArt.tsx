import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const AVATAR_URL =
  "https://media.licdn.com/dms/image/v2/D4D03AQGO53Q8vtTX9g/profile-displayphoto-shrink_200_200/B4DZPbHxGkGoAY-/0/1734548068193?e=1773273600&v=beta&t=ujncZGi1bM34SaWTQ2TNyPoxWqqqxY-PgneZRFqjNRQ";
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

const chaos = [
  "SIGNAL LOCKED",
  "NOISE SYNCED",
  "WARP ENGAGED",
  "MEMORY FRAGMENT FOUND",
  "AUDIO TAPE BREATHING",
  "RETRO CORE ONLINE",
];

type Pressed = {
  launch: boolean;
  warp: boolean;
  noise: boolean;
  neon: boolean;
  slow: boolean;
  turbo: boolean;
  ghost: boolean;
  chaos: boolean;
};

const commandMap = {
  warpOn: "$ sudo sysctl display.warp=1",
  warpOff: "$ sudo sysctl display.warp=0",
  noiseOn: "$ fx static --enable --profile crt",
  noiseOff: "$ fx static --disable",
  neonOn: "$ palette set --mode neon-violet",
  neonOff: "$ palette set --mode default",
  ghostOn: "$ render --layer ghost --opacity 0.85",
  ghostOff: "$ render --layer ghost --remove",
  slowOn: "$ player rate 0.82",
  slowOff: "$ player rate 1.00",
  turboOn: "$ player rate 1.18",
  turboOff: "$ player rate 1.00",
  launchOn: "$ player play memory-reboot.mp3",
  launchOff: "$ player pause",
  chaos: "$ diagnostics --randomize --retro",
};

const AsciiArt = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef(0);
  const [pressed, setPressed] = useState<Pressed>({
    launch: false,
    warp: false,
    noise: false,
    neon: false,
    slow: false,
    turbo: false,
    ghost: false,
    chaos: false,
  });

  const [statusText, setStatusText] = useState("READY");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "oxide@deck:~$ boot cassette-ui",
    "[ok] audio core linked",
    "[ok] shader bus online",
    "[ready] controls listening...",
  ]);

  const [selectedKey, setSelectedKey] = useState<keyof Pressed>("launch");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [trackMeta, setTrackMeta] = useState(TRACK_META[0]);
  const [volume, setVolume] = useState(0.3);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = 0.3;
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPhase((p) => (p + 0.06) % (Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pushTerminal = (line: string) => {
    setTerminalLines((prev) => {
      const next = [...prev, line];
      return next.slice(-8);
    });
  };

  const setToggle = (key: keyof Pressed, cmdOn: string, cmdOff: string) => {
    setSelectedKey(key);
    setPressed((prev) => {
      const next = !prev[key];
      pushTerminal(next ? cmdOn : cmdOff);
      return { ...prev, [key]: next };
    });
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

  const handleLaunch = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setSelectedKey("launch");

    if (pressed.launch) {
      audio.pause();
      setPressed((prev) => ({ ...prev, launch: false }));
      pushTerminal(commandMap.launchOff);
      setStatusText("AUDIO PAUSED");
      return;
    }

    try {
      await playTrackByIndex(currentTrackRef.current);
      setPressed((prev) => ({ ...prev, launch: true }));
      pushTerminal(commandMap.launchOn);
      setStatusText("PLAYBACK ACTIVE");
    } catch {
      setPressed((prev) => ({ ...prev, launch: false }));
      pushTerminal("[err] audio device busy");
      setStatusText("AUDIO ERROR");
    }
  };

  const handleSpeed = (mode: "slow" | "turbo") => {
    const audio = audioRef.current;
    if (!audio) return;
    setSelectedKey(mode);

    setPressed((prev) => {
      const wasActive = prev[mode];
      const next = { ...prev, slow: false, turbo: false };
      if (!wasActive) next[mode] = true;
      return next;
    });

    if (mode === "slow") {
      const nextSlow = !pressed.slow;
      audio.playbackRate = nextSlow ? 0.82 : 1;
      pushTerminal(nextSlow ? commandMap.slowOn : commandMap.slowOff);
      setStatusText(nextSlow ? "SLOW MODE" : "RATE NORMAL");
    } else {
      const nextTurbo = !pressed.turbo;
      audio.playbackRate = nextTurbo ? 1.18 : 1;
      pushTerminal(nextTurbo ? commandMap.turboOn : commandMap.turboOff);
      setStatusText(nextTurbo ? "TURBO MODE" : "RATE NORMAL");
    }
  };

  const handleChaos = async () => {
    setSelectedKey("chaos");
    const nextChaos = !pressed.chaos;
    setPressed((prev) => ({ ...prev, chaos: nextChaos }));
    const msg = chaos[Math.floor(Math.random() * chaos.length)];
    setStatusText(msg);
    pushTerminal(commandMap.chaos);

    const nextIdx = Math.floor(Math.random() * TRACKS.length);
    currentTrackRef.current = nextIdx;
    setTrackMeta(TRACK_META[nextIdx]);
    pushTerminal(`[mix] switched to track #${nextIdx + 1}`);

    if (pressed.launch) {
      await playTrackByIndex(nextIdx);
      const audio = audioRef.current;
      if (audio) {
        if (pressed.slow) audio.playbackRate = 0.82;
        else if (pressed.turbo) audio.playbackRate = 1.18;
        else audio.playbackRate = 1;
      }
    }
  };

  const imgFilter = useMemo(() => {
    const base = [
      "contrast(1.2)",
      "saturate(1.05)",
      "hue-rotate(285deg)",
      "brightness(0.72)",
      "sepia(0.3)",
    ];

    if (pressed.neon) base.push("saturate(1.35)", "brightness(0.82)");
    if (pressed.ghost) base.push("grayscale(0.35)", "contrast(1.35)");
    return base.join(" ");
  }, [pressed.neon, pressed.ghost]);

  const sideOptions: Array<{
    key: keyof Pressed;
    label: string;
    active: boolean;
  }> = [
    { key: "warp", label: "WARP", active: pressed.warp },
    { key: "noise", label: "NOISE", active: pressed.noise },
    { key: "neon", label: "NEON", active: pressed.neon },
    { key: "ghost", label: "GHOST", active: pressed.ghost },
  ];

  const handleSideOptionToggle = (key: keyof Pressed) => {
    if (key === "warp") return setToggle("warp", commandMap.warpOn, commandMap.warpOff);
    if (key === "noise") return setToggle("noise", commandMap.noiseOn, commandMap.noiseOff);
    if (key === "neon") return setToggle("neon", commandMap.neonOn, commandMap.neonOff);
    if (key === "ghost") return setToggle("ghost", commandMap.ghostOn, commandMap.ghostOff);
  };

  const handleVolumeChange = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolume(clamped);
    const audio = audioRef.current;
    if (audio) audio.volume = clamped;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9 }}
      className="mx-auto w-full max-w-[900px]"
      aria-label="Retro cassette profile logo"
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
          pushTerminal(`[ok] track ended → next #${nextIdx + 1}`);
          if (pressed.launch) {
            await playTrackByIndex(nextIdx);
            const audio = audioRef.current;
            if (audio) {
              if (pressed.slow) audio.playbackRate = 0.82;
              else if (pressed.turbo) audio.playbackRate = 1.18;
              else audio.playbackRate = 1;
            }
          }
        }}
      />

      <div className="relative border border-fuchsia-300/30 bg-gradient-to-b from-[#120a1b] via-[#0d0915] to-[#07060d] p-5 sm:p-6 shadow-[0_0_45px_rgba(124,58,237,0.2)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(192,132,252,0.18),transparent_58%)]" />

        <div className="relative z-20 mx-auto mb-4 h-9 w-[96%] border border-fuchsia-300/30 bg-fuchsia-100/10 px-3 overflow-hidden">
          <div className="mono-command grid h-full grid-cols-[auto_1fr_auto] items-center text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.18em] text-fuchsia-100/85 gap-2">
            <span className="text-left">SIDE D</span>
            <span className="text-center truncate">{trackMeta}</span>
            <span className="text-right">REC 78</span>
          </div>
        </div>

        <div className="relative border border-fuchsia-300/35 bg-[#130d1c] px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1.35fr)_minmax(280px,2fr)_minmax(180px,1.1fr)] items-stretch gap-3 sm:gap-4">
            {/* left terminal: fixed size so it won't jump */}
            <div className="border border-fuchsia-300/25 bg-black/45 p-2.5 h-[248px] flex flex-col min-w-0 md:min-w-[220px] overflow-hidden">
              <div className="mono-command text-[9px] text-fuchsia-200/80 border-b border-fuchsia-300/20 pb-1 mb-2">
                oxide@deck:~
              </div>
              <div className="space-y-1 mono-command text-[8px] sm:text-[9px] text-fuchsia-100/85 leading-relaxed h-[206px] overflow-hidden">
                {terminalLines.map((line, idx) => (
                  <div key={`${line}-${idx}`} className="truncate">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* center cassette window */}
            <div className="relative border border-fuchsia-200/20 bg-black/55 p-2.5 overflow-hidden h-[248px]">
              <div className={`relative overflow-hidden border border-fuchsia-200/15 h-full ${pressed.warp ? "animate-[pulse_2.2s_ease-in-out_infinite]" : ""}`}>
                <img
                  src={AVATAR_URL}
                  alt="Partha Pratim Gogoi profile"
                  className={`h-full w-full object-cover ${pressed.ghost ? "opacity-85" : ""}`}
                  style={{ objectPosition: "50% 24%", filter: imgFilter }}
                />
                {(pressed.noise || pressed.chaos) && (
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.09)_0px,rgba(255,255,255,0.09)_1px,transparent_2px,transparent_4px)] mix-blend-soft-light" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_42%,rgba(10,6,16,0.62)_100%)]" />
                <div className={`pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(120deg,transparent_0%,rgba(168,85,247,0.35)_22%,transparent_45%,rgba(168,85,247,0.2)_68%,transparent_100%)] ${pressed.neon ? "animate-[pulse_1.1s_ease-in-out_infinite]" : "animate-[pulse_3s_ease-in-out_infinite]"}`} />
              </div>
            </div>

            {/* right terminal-like options display (not buttons) */}
            <div className="border border-fuchsia-300/25 bg-black/45 p-2.5 h-[248px] flex flex-col min-w-0 md:min-w-[180px] overflow-hidden">
              <div className="mono-command text-[8px] text-fuchsia-200/80 border-b border-fuchsia-300/20 pb-1 mb-2">
                controls.menu
              </div>
              <div className="mono-command text-[8px] flex-1 min-h-0 flex flex-col justify-between" onMouseLeave={() => setHoveredIndex(null)}>
                <div className="space-y-1 flex-none">
                  {sideOptions.map((opt, idx) => {
                    const isHovered = hoveredIndex === idx;
                    const isSelected = hoveredIndex === null && selectedKey === opt.key;
                    return (
                      <div
                        key={opt.key}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onClick={() => handleSideOptionToggle(opt.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleSideOptionToggle(opt.key);
                        }}
                        className={`w-full text-left px-2 py-[3px] border border-fuchsia-300/20 transition-colors cursor-pointer select-none ${opt.active ? "bg-fuchsia-400/24 text-fuchsia-100" : "bg-fuchsia-900/10 text-fuchsia-200/85"}`}
                      >
                        <span className={`inline-block w-4 ${(isHovered || isSelected) ? "text-fuchsia-100" : "text-fuchsia-300/40"}`}>{(isHovered || isSelected) ? "▶" : "·"}</span>
                        <span>{opt.label}</span>
                        <span className={`float-right inline-block w-8 text-right ${opt.active ? "text-fuchsia-100" : "text-zinc-400"}`}>{opt.active ? "ON" : "OFF"}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 border border-fuchsia-300/20 bg-fuchsia-900/10 px-2 py-1.5 flex-none">
                  <div className="flex items-center justify-between text-[8px] text-fuchsia-200/80 mb-1">
                    <span>VOL</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-fuchsia-300 volume-slider"
                  />
                </div>

                <div className="mt-2 border border-fuchsia-300/20 bg-fuchsia-900/10 px-2 py-1.5 flex-none h-[58px] overflow-hidden">
                  <div className="text-[8px] text-fuchsia-200/80 mb-1">FREQ</div>
                  <svg viewBox="0 0 100 24" className="w-full h-[34px]">
                    <line x1="0" y1="12" x2="100" y2="12" stroke="rgba(216,180,254,0.25)" strokeWidth="0.5" />
                    <path
                      d={`M 0 12 ${Array.from({ length: 26 }, (_, i) => {
                        const x = i * 4;
                        const y = 12 + (Math.sin(phase + i * 0.45) * 3.1 + Math.sin(phase * 1.4 + i * 0.7) * 1.8 + Math.sin(phase * 0.7 + i * 0.23) * 1.2) * (0.65 + volume * 0.6);
                        return `L ${x} ${y.toFixed(2)}`;
                      }).join(" ")}`}
                      fill="none"
                      stroke="rgba(216,180,254,0.92)"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <button type="button" onClick={() => handleSpeed("slow")} className={`mono-command w-full border border-fuchsia-200/35 bg-gradient-to-b from-fuchsia-100/20 to-fuchsia-200/5 px-2 py-1.5 text-[9px] sm:text-[10px] text-fuchsia-100/90 shadow-[0_3px_0_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all ${pressed.slow ? "translate-y-[2px] shadow-none bg-fuchsia-300/25 border-fuchsia-100/60" : ""}`}>SLOW</button>
            <button type="button" onClick={() => handleSpeed("turbo")} className={`mono-command w-full border border-fuchsia-200/35 bg-gradient-to-b from-fuchsia-100/20 to-fuchsia-200/5 px-2 py-1.5 text-[9px] sm:text-[10px] text-fuchsia-100/90 shadow-[0_3px_0_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all ${pressed.turbo ? "translate-y-[2px] shadow-none bg-fuchsia-300/25 border-fuchsia-100/60" : ""}`}>TURBO</button>
            <button type="button" onClick={handleChaos} className={`mono-command w-full border border-fuchsia-200/35 bg-gradient-to-b from-fuchsia-100/20 to-fuchsia-200/5 px-2 py-1.5 text-[9px] sm:text-[10px] text-fuchsia-100/90 shadow-[0_3px_0_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all ${pressed.chaos ? "translate-y-[2px] shadow-none bg-fuchsia-300/25 border-fuchsia-100/60" : ""}`}>CHAOS</button>
            <button type="button" onClick={handleLaunch} className={`mono-command w-full border border-fuchsia-200/35 bg-gradient-to-b from-fuchsia-100/20 to-fuchsia-200/5 px-2 py-1.5 text-[9px] sm:text-[10px] text-fuchsia-100/90 shadow-[0_3px_0_rgba(168,85,247,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all ${pressed.launch ? "translate-y-[2px] shadow-none bg-fuchsia-300/25 border-fuchsia-100/60" : ""}`}>LAUNCH</button>
          </div>

          <div className="mt-3 mono-command text-[10px] text-fuchsia-200/85 tracking-[0.16em] text-center h-4">
            {statusText}
          </div>

          <div className="mt-4 h-2 rounded-full bg-gradient-to-r from-fuchsia-300/10 via-fuchsia-200/30 to-fuchsia-300/10" />
        </div>

        <div className="mono-command relative z-20 mt-4 grid grid-cols-3 items-center text-[10px] tracking-[0.18em] text-fuchsia-100/75">
          <span className="text-left">ANALOG DREAMS</span>
          <span className="text-center">OXIDE 1-6</span>
          <span className="text-right">PLAY ▶</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AsciiArt;
