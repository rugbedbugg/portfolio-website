import { useCallback, useEffect, useRef, useState } from "react";
import { useTransmission } from "./Transmission";

// Toggle key + the CTF flag hidden behind `cat .flag` and the Konami code.
const TOGGLE_KEY = "`";
const FLAG = "OXIDE{th3_v13w3r_1s_th3_subj3ct}";
const PROMPT = "oxide@portfolio:~$";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

// Sections reachable with `open`, and external endpoints routed via the uplink.
const SECTIONS = ["projects", "about", "contact"];
const LINKS: Record<string, string> = {
  github: "https://github.com/rugbedbugg",
  linkedin: "https://www.linkedin.com/in/partha-gogoi-736241308/",
  email: "mailto:yes.par781@gmail.com",
};

const FILES: Record<string, string[]> = {
  "about.dat": [
    "SUBJECT  : Partha P.G.",
    "ALIASES  : Oxide 1-6 // Arsenic 1-6 // rugbedbugg",
    "FOCUS    : cyber forensics, CTF, low-level / RE",
    "MO       : break it, understand it, rebuild it cleaner.",
  ],
  "projects.exe": [
    "ResonanceID-cli   [Rust]   audio fingerprinting CLI",
    "Dev-Tools-Assisstant [Py]  agentic tool-scout",
    "HTTP-SVR-200-OK   [asm]    HTTP/1.0 server in x86_64",
    "",
    "run `open projects` to view the case files.",
  ],
  "contact.sys": [
    "github   :: github.com/rugbedbugg",
    "linkedin :: linkedin.com/in/partha-gogoi-736241308",
    "email    :: yes.par781@gmail.com",
    "",
    "run `open github|linkedin|email` to establish an uplink.",
  ],
};

type Line = { text: string; tone?: "in" | "err" | "ok" | "dim" };

const HELP: Line[] = [
  { text: "available commands:", tone: "dim" },
  { text: "  help              this list" },
  { text: "  whoami            operator identity" },
  { text: "  ls [-a]           list files" },
  { text: "  cat <file>        read a file" },
  { text: "  open <target>     jump to section / open uplink" },
  { text: "  banner            print the banner" },
  { text: "  clear             wipe the screen" },
  { text: "  exit              close the terminal" },
  { text: "  targets: projects about contact github linkedin email", tone: "dim" },
];

const BANNER: Line[] = [
  { text: " ___/\\/\\/\\/\\/\\____/\\/\\____/\\/\\____/\\/\\/\\/\\/\\_", tone: "ok" },
  { text: "_/\\/\\____/\\/\\____/\\/\\____/\\/\\__/\\/\\_________", tone: "ok" },
  { text: "_/\\/\\____/\\/\\____/\\/\\/\\/\\/\\____/\\/\\/\\/\\/\\___", tone: "ok" },
  { text: "_/\\/\\____/\\/\\____/\\/\\____/\\/\\__________/\\/\\_", tone: "ok" },
  { text: "___/\\/\\/\\/\\/\\____/\\/\\____/\\/\\__/\\/\\/\\/\\/\\___", tone: "ok" },
  { text: "OXIDE terminal :: 198X", tone: "dim" },
];

const WELCOME: Line[] = [
  { text: "OXIDE terminal [ver 1.98x] — feed access granted.", tone: "ok" },
  { text: "type `help` for commands. `exit` or ESC to close.", tone: "dim" },
];

const Terminal = () => {
  const connect = useTransmission();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const push = useCallback((next: Line[]) => setLines((p) => [...p, ...next]), []);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      push([{ text: `${PROMPT} ${cmd}`, tone: "in" }]);
      if (!cmd) return;
      const [name, ...args] = cmd.split(/\s+/);
      const arg = (args[0] || "").toLowerCase();

      switch (name.toLowerCase()) {
        case "help":
          push(HELP);
          break;
        case "whoami":
          push([
            { text: "partha p.g. // oxide 1-6" },
            { text: "cyber forensics enthusiast & CTF player", tone: "dim" },
          ]);
          break;
        case "banner":
          push(BANNER);
          break;
        case "ls":
          push([
            {
              text:
                (arg === "-a" ? ".  ..  .flag  " : "") +
                "about.dat  projects.exe  contact.sys",
            },
            ...(arg === "-a"
              ? [{ text: "1 hidden entry. curious?", tone: "dim" as const }]
              : []),
          ]);
          break;
        case "cat": {
          const f = (args[0] || "").toLowerCase();
          if (f === ".flag" || f === "flag") {
            push([
              { text: "decrypting...", tone: "dim" },
              { text: FLAG, tone: "ok" },
              { text: "nice. you actually looked.", tone: "dim" },
            ]);
          } else if (FILES[f]) {
            push(FILES[f].map((t) => ({ text: t })));
          } else {
            push([{ text: `cat: ${args[0] || ""}: no such file`, tone: "err" }]);
          }
          break;
        }
        case "open": {
          if (SECTIONS.includes(arg)) {
            document.getElementById(arg)?.scrollIntoView({ behavior: "smooth" });
            push([{ text: `> jumping to ${arg}...`, tone: "ok" }]);
            setOpen(false);
          } else if (LINKS[arg]) {
            push([{ text: `> establishing uplink :: ${arg}`, tone: "ok" }]);
            connect(LINKS[arg], arg);
          } else {
            push([{ text: `open: unknown target '${args[0] || ""}'`, tone: "err" }]);
          }
          break;
        }
        case "clear":
          setLines([]);
          break;
        case "exit":
        case "close":
          setOpen(false);
          break;
        case "sudo":
          push([{ text: "nice try. this operator has no root here.", tone: "err" }]);
          break;
        default:
          push([
            { text: `${name}: command not found`, tone: "err" },
            { text: "type `help`", tone: "dim" },
          ]);
      }
    },
    [connect, push],
  );

  // Global: backtick toggles the console; Konami code drops the flag.
  useEffect(() => {
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === TOGGLE_KEY) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Konami sequence (case-insensitive on the letters)
      const want = KONAMI[progress];
      const hit =
        e.key === want ||
        (want.length === 1 && e.key.toLowerCase() === want);
      progress = hit ? progress + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        setOpen(true);
        push([
          { text: "^^vv<><>ba :: BACKDOOR ACCEPTED", tone: "ok" },
          { text: FLAG, tone: "ok" },
        ]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [push]);

  // Keep the view pinned to the latest output and focus the input on open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input;
    if (value.trim()) setHistory((h) => [...h, value]);
    setHistIdx(null);
    run(value);
    setInput("");
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  const toneClass = (tone?: Line["tone"]) =>
    tone === "err"
      ? "text-cga-bred"
      : tone === "ok"
        ? "text-cga-bcyan"
        : tone === "dim"
          ? "text-cga-gray"
          : tone === "in"
            ? "text-cga-cyan"
            : "text-cga-bgreen";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open terminal"
          className="mono-command fixed bottom-3 right-3 z-[90] border border-cga-bgreen/50 bg-cga-black/80 px-2 py-1 text-[10px] tracking-[0.16em] text-cga-bgreen backdrop-blur-[1px] transition-colors hover:border-cga-bgreen hover:text-cga-white"
        >
          {">_ TERMINAL  [ ` ]"}
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[96] h-[min(60vh,340px)] border-t-2 border-cga-bgreen/50 bg-cga-black/95 backdrop-blur-[2px]">
          <div className="ambient-scan pointer-events-none absolute inset-0 opacity-40" />
          <div className="mono-command flex items-center justify-between border-b border-cga-bgreen/30 px-3 py-1.5 text-[10px] tracking-[0.18em] text-cga-bgreen">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 bg-cga-bgreen animate-blink" />
              OXIDE TERMINAL // TTY0
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-cga-gray hover:text-cga-bred"
            >
              [ ESC ] CLOSE
            </button>
          </div>

          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="mono-command h-[calc(100%-2.4rem)] overflow-y-auto px-3 py-2 text-[11px] leading-relaxed"
          >
            {lines.map((l, i) => (
              <div key={i} className={`whitespace-pre-wrap break-words ${toneClass(l.tone)}`}>
                {l.text}
              </div>
            ))}
            <form onSubmit={onSubmit} className="mt-1 flex items-center gap-2">
              <span className="shrink-0 text-cga-bcyan">{PROMPT}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKey}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                className="min-w-0 flex-1 bg-transparent text-cga-bgreen caret-cga-bgreen outline-none"
                aria-label="Terminal input"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Terminal;
