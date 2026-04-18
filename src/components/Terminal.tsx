import { useCallback, useEffect, useRef, useState } from "react";
import { useTransmission } from "./Transmission";
import { detectViewer } from "@/lib/viewer";

// Toggle key + the CTF flag. Reached the hard way via the `.trace` breadcrumb
// (ls -a → cat .trace → decode), or short-circuited by the Konami backdoor.
const TOGGLE_KEY = "`";
const FLAG = "OXIDE{th3_v13w3r_1s_th3_subj3ct}";
const PROMPT = "oxide@portfolio:~$";

// Caesar/ROT13 both ways — the buried fragment is FLAG rot13'd; `decode` undoes it.
const rot13 = (s: string) =>
  s.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });

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

// Command pool offered to Tab-completion (hidden ones like `decode` omitted).
const COMMANDS = [
  "help", "whoami", "ls", "cat", "list", "open",
  "sys", "date", "history", "clear", "exit",
];
const FILE_NAMES = ["about.dat", "projects.exe", "contact.sys"];

// Case files — kept as data so the columnar `cat projects.exe` table stays
// aligned no matter how long the project names get.
const PROJECTS = [
  { name: "ResonanceID-cli", lang: "Rust", blurb: "Audio fingerprinting CLI" },
  { name: "Dev-Tools-Assisstant", lang: "Py", blurb: "Agentic Tool-scout" },
  { name: "HTTP-SVR-200-OK", lang: "ASM", blurb: "HTTP/1.0 server in x86_64" },
];

// `open`-able destinations, grouped for the `list targets` command.
const SECTION_TARGETS: [string, string][] = [
  ["projects", "Case files"],
  ["about", "Subject dossier"],
  ["contact", "Uplink endpoints"],
];
const UPLINK_TARGETS: [string, string][] = [
  ["github", "Inspect the source code"],
  ["linkedin", "Review the professional record"],
  ["email", "Open a direct channel"],
];

type Line = { text: string; tone?: "in" | "err" | "ok" | "dim" };

// Left-align a two-column table with a 4-space gutter.
const cols = (rows: [string, string][], gap = 4): string[] => {
  const w = Math.max(...rows.map(([a]) => a.length));
  return rows.map(([a, b]) => a.padEnd(w + gap) + b);
};

const projectsFile = (): Line[] => {
  const nameW = Math.max(...PROJECTS.map((p) => p.name.length));
  const tagW = Math.max(...PROJECTS.map((p) => p.lang.length)) + 2; // [ ]
  return [
    ...PROJECTS.map((p) => ({
      text:
        p.name.padEnd(nameW + 4) +
        `[${p.lang}]`.padEnd(tagW + 4) +
        p.blurb,
    })),
    { text: "" },
    { text: "run `open projects` to view the case files.", tone: "dim" as const },
  ];
};

const targetsList = (): Line[] => [
  { text: "SECTIONS", tone: "dim" },
  ...cols(SECTION_TARGETS.map(([k, d]) => [`  ${k}`, d])).map((text) => ({ text })),
  { text: "" },
  { text: "UPLINKS", tone: "dim" },
  ...cols(UPLINK_TARGETS.map(([k, d]) => [`  ${k}`, d])).map((text) => ({ text })),
  { text: "" },
  { text: "run `open <target>` to jump or connect.", tone: "dim" as const },
];

// The buried breadcrumb: an intercepted, rot13'd signal fragment.
const traceFile = (): Line[] => [
  { text: "// intercepted signal fragment — CH 05", tone: "dim" },
  { text: rot13(FLAG), tone: "ok" },
  { text: "caesar shift 13. run `decode <fragment>` to recover it.", tone: "dim" },
];

// neofetch-style card built from the live client readout.
const sysCard = (): Line[] => {
  const v = detectViewer();
  return [
    { text: "operator@oxide", tone: "ok" },
    { text: "--------------", tone: "dim" },
    ...cols([
      ["OS", v.os],
      ["HOST", v.browser],
      ["DISPLAY", v.display],
      ["VIEWPORT", v.view],
      ["TZ", v.tz],
      ["LOCALE", v.locale],
      ["CPU", v.cores],
    ]).map((text) => ({ text })),
  ];
};

const FILES: Record<string, string[]> = {
  "about.dat": [
    "SUBJECT : Partha P.G.",
    "ALIASES : Oxide 1-6 // Arsenic 1-6 // rugbedbugg",
    "FOCUS   : Cyber forensics, CTF, low-level / RE",
    "MO      : Break it, understand it, rebuild it cleaner.",
  ],
  "contact.sys": [
    "GitHub   :: github.com/rugbedbugg",
    "LinkedIn :: linkedin.com/in/partha-gogoi-736241308",
    "Email    :: yes.par781@gmail.com",
    "",
    "run `open github|linkedin|email` to establish an uplink.",
  ],
};

const HELP: Line[] = [
  { text: "available commands:", tone: "dim" },
  { text: "  help              this list" },
  { text: "  whoami            operator identity" },
  { text: "  ls [-a]           list files" },
  { text: "  cat <file>        read a file" },
  { text: "  list targets      show open-able targets" },
  { text: "  open <target>     jump to section / open uplink" },
  { text: "  sys               trace this machine" },
  { text: "  date              tape date + local time" },
  { text: "  history           recall past commands" },
  { text: "  clear             wipe the screen" },
  { text: "  exit              close the terminal" },
  { text: "  (tab completes · ↑/↓ history)", tone: "dim" },
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
            { text: "Partha P.G. // Oxide 1-6" },
            { text: "Cyber Forensics Enthusiast & CTF Player", tone: "dim" },
          ]);
          break;
        case "list":
          if (arg === "targets" || arg === "") {
            push(targetsList());
          } else {
            push([
              { text: `list: unknown '${args[0]}'. try 'list targets'`, tone: "err" },
            ]);
          }
          break;
        case "ls":
          push([
            {
              text:
                (arg === "-a" ? ".  ..  .trace  " : "") +
                "about.dat  projects.exe  contact.sys",
            },
            ...(arg === "-a"
              ? [{ text: "1 hidden entry. `cat .trace`?", tone: "dim" as const }]
              : []),
          ]);
          break;
        case "cat": {
          const f = (args[0] || "").toLowerCase();
          if (f === ".flag" || f === "flag") {
            push([
              { text: "cat: .flag: permission denied", tone: "err" },
              { text: "the signal is buried. start with `ls -a`.", tone: "dim" },
            ]);
          } else if (f === ".trace" || f === "trace") {
            push(traceFile());
          } else if (f === "projects.exe") {
            push(projectsFile());
          } else if (FILES[f]) {
            push(FILES[f].map((t) => ({ text: t })));
          } else {
            push([{ text: `cat: ${args[0] || ""}: no such file`, tone: "err" }]);
          }
          break;
        }
        case "decode": {
          const payload = args.join(" ");
          if (!payload) {
            push([{ text: "usage: decode <fragment>", tone: "dim" }]);
            break;
          }
          const out = rot13(payload);
          if (out === FLAG) {
            push([
              { text: "decrypting...", tone: "dim" },
              { text: out, tone: "ok" },
              { text: "SIGNAL RECOVERED. nice work, operator.", tone: "ok" },
            ]);
          } else {
            push([{ text: out }]);
          }
          break;
        }
        case "sys":
          push(sysCard());
          break;
        case "date": {
          const now = new Date();
          const W = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const M = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const tape = `${W[now.getDay()]} ${String(now.getDate()).padStart(2, "0")} ${M[now.getMonth()]} ${now.getFullYear()}`;
          push([
            { text: `DATE  : ${tape}` },
            { text: `LOCAL : ${now.toLocaleString()}` },
          ]);
          break;
        }
        case "history":
          push(
            history.length
              ? history.map((h, i) => ({
                  text: `  ${String(i + 1).padStart(3, " ")}  ${h}`,
                }))
              : [{ text: "(no history yet)", tone: "dim" }],
          );
          break;
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
    [connect, push, history],
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

  // The cassette's center-bottom launcher opens the console via this event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("oxide:terminal", onOpen);
    return () => window.removeEventListener("oxide:terminal", onOpen);
  }, []);

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

  const completeToken = () => {
    const tokens = input.split(" ");
    const last = tokens[tokens.length - 1].toLowerCase();
    let pool: string[] = [];
    if (tokens.length <= 1) {
      pool = COMMANDS;
    } else {
      const cmd = tokens[0].toLowerCase();
      if (cmd === "cat") pool = FILE_NAMES;
      else if (cmd === "open") pool = [...SECTIONS, ...Object.keys(LINKS)];
      else if (cmd === "list") pool = ["targets"];
    }
    const matches = pool.filter((c) => c.startsWith(last));
    if (!matches.length) return;
    if (matches.length === 1) {
      tokens[tokens.length - 1] = matches[0];
      setInput(tokens.join(" ") + " ");
    } else {
      // fill the shared prefix, then list the candidates like a real shell
      const common = matches.reduce((a, b) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return a.slice(0, i);
      });
      tokens[tokens.length - 1] = common;
      setInput(tokens.join(" "));
      push([{ text: matches.join("  "), tone: "dim" }]);
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      completeToken();
      return;
    }
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
      {open && (
        <div
          role="region"
          aria-label="OXIDE terminal"
          className="fixed inset-x-0 bottom-0 z-[96] h-[min(60vh,340px)] border-t-2 border-cga-bgreen/50 bg-cga-black/95 backdrop-blur-[2px]"
        >
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
            role="log"
            aria-label="Terminal output"
            onClick={() => {
              // Click-to-focus, but don't steal an active text selection
              // (otherwise focusing the input collapses it and copy fails).
              if (window.getSelection()?.toString()) return;
              inputRef.current?.focus();
            }}
            className="mono-command h-[calc(100%-2.4rem)] cursor-text select-text overflow-y-auto px-3 py-2 text-[11px] leading-relaxed"
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
                autoCorrect="off"
                /* 16px avoids iOS Safari's zoom-on-focus for small inputs */
                className="min-w-0 flex-1 bg-transparent text-[16px] text-cga-bgreen caret-cga-bgreen outline-none"
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
