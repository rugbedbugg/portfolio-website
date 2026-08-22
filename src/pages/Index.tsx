import { useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import AsciiArt from "@/components/AsciiArt";
import GlobalTrace from "@/components/GlobalTrace";
import TypewriterText from "@/components/TypewriterText";
import DossierPanel from "@/components/DossierPanel";
import { ExtLink } from "@/components/Transmission";
import { useSubjectLayout } from "@/hooks/use-subject-layout";
import { recordVisit, relTime } from "@/lib/trace";

const PROFILE = {
  name: "Partha P.G.",
  aliases: "Oxide 1-6 // Arsenic 1-6 // rugbedbugg",
  tagline: "AI & Low-Level Systems",
  email: "mailto:yes.par781@gmail.com",
  // Set to a real path once available, e.g. "/resume.pdf". Empty hides the button.
  resumeUrl: "",
};

const hasResume = Boolean(PROFILE.resumeUrl && PROFILE.resumeUrl !== "#");

const NAV_LINKS = [
  { label: "Projects", href: "#projects" },
  { label: "Dispatches", href: "#dispatches" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/rugbedbugg",
    cta: "Inspect the source code",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/partha-gogoi-736241308/",
    cta: "Review the professional record",
  },
  { label: "Email", href: PROFILE.email, cta: "Open a direct channel" },
];

const PROJECTS = [
  {
    title: "ReAgent",
    description:
      "An agentic retrosynthesis framework that plans reaction routes with evidence-grounded, multi-objective scoring and forward-validating filter-model checks.",
    href: "https://github.com/rugbedbugg/ReAgent",
    tags: ["Python", "Agentic", "LLM", "Scoring"],
  },
  {
    title: "Trionda-Trifecta-26",
    description:
      "A FIFA World Cup predictor with leakage-safe features, W/D/L and scoreline models, and a full-bracket 2026 simulation that calls Spain to lift the trophy.",
    href: "https://github.com/rugbedbugg/Trionda-Trifecta-26",
    tags: ["Python", "ML", "Modeling", "Simulation"],
  },
  {
    title: "ResonanceID-cli",
    description:
      "A Shazam-inspired Rust CLI that fingerprints WAV audio, ranks candidate matches, and backs everything with SQLite for fast, explainable lookup.",
    href: "https://github.com/rugbedbugg/ResonanceID-cli",
    tags: ["Rust", "DSP", "SQLite", "cli"],
  },
  {
    title: "HTTP-SVR-200-OK",
    description:
      "A hand-rolled HTTP/1.0 server in x86_64 assembly for Linux, built to understand networking from first principles.",
    href: "https://github.com/rugbedbugg/HTTP-SVR-200-OK",
    tags: ["x86_64 Assembly", "Linux", "Networking", "HTTP"],
  },
];

// Curated LinkedIn posts. Hand-maintained, same as PROJECTS/SOCIALS: LinkedIn has no
// build-time API and its embed clashes with the CRT look, so entries link out to the
// real post. Fill title/excerpt/href with your own; 3+ keeps the section worthwhile.
const DISPATCHES: {
  title: string;
  excerpt: string;
  date: string; // YYYY-MM
  href: string;
  topic: string;
  image: string; // /dispatches/<name>.png; falls back to a NO SIGNAL tile if missing
}[] = [
  {
    title: '"Assembly is faster than C" is mostly a myth',
    excerpt:
      "Same array-sum in hand-written asm versus compiler-built C++, same x86_64 machine, averaged over 1000 runs. The hand-written version ran ~1.42x slower. Speed is about how well instructions fit the hardware, not the language.",
    date: "2026-01",
    href: "https://www.linkedin.com/posts/partha-gogoi-736241308_assembly-language-is-faster-than-cc-activity-7417678944587669504-YXoA",
    topic: "LOW-LEVEL",
    image: "/dispatches/assembly.png",
  },
  {
    title: "A summer of Rust, shaders, and phone-only AI agents",
    excerpt:
      "Learned Rust past the hype, rendered a neon endless GLSL pattern, and built an AI agent entirely in Termux with the model running locally on my phone. No IDE, no autocomplete, pure terminal.",
    date: "2025-07",
    href: "https://www.linkedin.com/posts/partha-gogoi-736241308_rustlang-glsl-shaders-activity-7347825447226740736-LCln",
    topic: "BUILD LOG",
    image: "/dispatches/rust.png",
  },
];

// "2026-07" -> "JUL 2026" for the dispatch header row. Falls back to the raw string.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const fmtDispatchDate = (ym: string) => {
  const [y, m] = ym.split("-");
  const month = MONTHS[Number(m) - 1];
  return month && y ? `${month} ${y}` : ym;
};

// Peer-reviewed publications. Hand-maintained; "me" marks the author to
// highlight in the byline. Add an object per paper.
const ME = "Partha Pratim Gogoi";
const PUBLICATIONS: {
  title: string;
  authors: string[];
  venue: string;
  contribution: string;
  href: string; // DOI / IEEE Xplore link
}[] = [
  {
    title:
      "Resource-Efficient FPGA Realization of Chess960 Position Generator for Future Covert Communication Systems",
    authors: [
      "Naman Goyal",
      ME,
      "Abhishek Narayan Tripathi",
      "Naushad Manzoor Laskar",
    ],
    venue: "IEEE SISIMPACT 2025",
    contribution: "Conceptualization, Methodology, Software",
    href: "https://doi.org/10.1109/SISIMPACT67725.2025.11439749",
  },
];

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 10, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.52, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const Index = () => {
  const [trace] = useState(() => recordVisit());
  // Landing layout: side-by-side when the subject panel fits the viewport,
  // stacked otherwise. In two-pane mode the panel is zoom-scaled to fit.
  const subjectRef = useRef<HTMLDivElement>(null);
  const { mode, scale, rightScale } = useSubjectLayout(subjectRef);
  const twoPane = mode === "two";
  const typedName = PROFILE.name.toUpperCase();
  const TYPE_SPEED_MS = 100; // ~100 WPM approximation for name
  const nameSpeed = TYPE_SPEED_MS;
  const taglineSpeed = Math.round(TYPE_SPEED_MS * 0.8); // 20% faster
  const nameDelay = 120;
  const taglineDelay = nameDelay + typedName.length * nameSpeed + 260;

  return (
    <div
      data-mode={mode}
      className={
        twoPane
          ? "relative z-10 flex h-screen gap-8 overflow-hidden px-8 mono-ui"
          : "relative z-10 min-h-screen overflow-hidden mono-ui"
      }
    >
      {/* LEFT: subject identity panel. Two-pane mode is a fixed-height,
          non-scrolling column whose block is zoom-scaled to fit the viewport;
          otherwise it stacks above the dossier and the page scrolls. */}
      <aside
        className={
          twoPane
            ? "flex h-screen w-[44%] shrink-0 flex-col justify-center overflow-hidden py-8"
            : "flex flex-col px-6 py-6 sm:py-8"
        }
      >
        {/* zoom scales the whole block uniformly, so elements keep their aspect
            ratio while filling the pane; the inner ref is measured at natural
            size to derive that zoom. */}
        <div style={twoPane ? { zoom: scale } : undefined}>
          <div
            ref={subjectRef}
            className="mx-auto w-full max-w-[560px] space-y-6"
          >
            <div className="terminal-title text-center">
              [ SYSTEM :: OXIDE TERMINAL PORTFOLIO :: 198X MODE ]
            </div>

            <motion.header {...fade(0.2)} className="text-center space-y-3">
              <h1 className="mono-command text-3xl sm:text-4xl font-bold text-foreground text-glow tracking-widest">
                <span className="opacity-90">{"> "}</span>
                <TypewriterText
                  text={typedName}
                  speed={nameSpeed}
                  delay={nameDelay}
                />
              </h1>
              <p className="text-muted-foreground text-sm">[{PROFILE.aliases}]</p>
              <p className="mono-command text-foreground text-base uppercase tracking-wide">
                <TypewriterText
                  text={PROFILE.tagline}
                  speed={taglineSpeed}
                  delay={taglineDelay}
                  persistentCursor
                />
              </p>
            </motion.header>

            <div className="flex justify-center">
              <AsciiArt />
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT — dossier content: scrolls independently in two-pane mode. */}
      <main
        className={
          twoPane
            ? "no-scrollbar h-screen flex-1 overflow-y-auto py-8"
            : "px-6 py-6 sm:py-8"
        }
      >
        <div
          className="mx-auto w-full max-w-2xl space-y-6"
          style={
            {
              ...(twoPane ? { zoom: rightScale } : undefined),
              // zoom magnifies how far the hover sweep travels per ms, which
              // makes it look faster than its 500ms transition; divide the
              // duration by the same factor so perceived speed stays constant.
              "--sweep": `${twoPane ? Math.round(500 / rightScale) : 500}ms`,
            } as CSSProperties
          }
        >
        <motion.nav
          {...fade(0.35)}
          className="mono-command flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm border-y border-primary/25 py-2"
        >
          {NAV_LINKS.map((link, i) => (
            <span key={link.label}>
              <a href={link.href} className="link-hover text-foreground">
                {link.label}
              </a>
              {i < NAV_LINKS.length - 1 && <span className="text-muted-foreground ml-2">//</span>}
            </span>
          ))}
        </motion.nav>

        <motion.section {...fade(0.5)} id="about">
          <DossierPanel
            label="SUBJECT DOSSIER"
            code="REF://ABOUT.DAT"
            bodyClassName="px-5 py-5"
          >
            <div className="mono-command max-w-2xl space-y-4 text-[1rem] leading-8 text-foreground">
              <p>
                I build things to understand them. My instinct with any system
                is to take it apart, see why it holds together, and put it back
                cleaner. That is most of how I learn and how I think.
              </p>
              <p>
                I'm pulled toward the parts of software people treat as a black
                box, and toward AI, especially agents and systems that act on
                their own. I would rather know what is happening underneath than
                trust the surface.
              </p>
              <p>
                What I make is usually one of two things: a rebuild done to learn
                how something works, or a tool built because it needed to exist.
              </p>
            </div>
          </DossierPanel>
        </motion.section>

        <motion.section {...fade(0.6)}>
          <GlobalTrace />
        </motion.section>

        <motion.section {...fade(0.65)} id="projects">
          <DossierPanel label="CASE FILES" code="REF://PROJECTS.EXE">
            <div className="grid gap-3">
              {PROJECTS.map((project) => (
                <ExtLink
                  key={project.title}
                  href={project.href}
                  label={project.title}
                  className="group relative flex flex-col gap-2 overflow-hidden border border-cga-bcyan/25 bg-cga-bcyan/[0.03] p-4 transition-colors hover:border-cga-bcyan/60 hover:bg-cga-bcyan/[0.06]"
                >
                  <span className="sweep-duration pointer-events-none absolute inset-0 -translate-y-full opacity-0 transition-all group-hover:translate-y-full group-hover:opacity-100">
                    <span className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-cga-bcyan/15 to-transparent" />
                    <span className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(85,255,255,0.05)_0px,rgba(85,255,255,0.05)_1px,transparent_1px,transparent_3px)]" />
                  </span>
                  <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] tracking-[0.14em] text-cga-cyan">
                    <span>CLASS: {project.tags[0]?.toUpperCase()}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 bg-cga-bgreen" />
                      STATUS: TRACED
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <p className="mono-command font-semibold text-cga-bcyan">{`$ ./${project.title}`}</p>
                    <span className="mono-command text-[10px] tracking-[0.16em] text-cga-cyan opacity-0 transition-opacity group-hover:opacity-100">
                      ▸ OPEN
                    </span>
                  </div>
                  <p className="relative z-10 text-sm text-cga-gray">{project.description}</p>
                  <div className="relative z-10 mt-1 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={`${project.title}-${tag}`}
                        className="border border-cga-bcyan/40 bg-cga-bcyan/10 px-2 py-0.5 text-[11px] text-cga-bcyan"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </ExtLink>
              ))}
            </div>
          </DossierPanel>
        </motion.section>

        <motion.section {...fade(0.7)} id="research">
          <DossierPanel label="RESEARCH" code="REF://RESEARCH.LOG">
            <div className="grid gap-3">
              {PUBLICATIONS.map((pub) => (
                <ExtLink
                  key={pub.href}
                  href={pub.href}
                  label={pub.title}
                  className="group relative flex flex-col gap-2 overflow-hidden border border-cga-bcyan/25 bg-cga-bcyan/[0.03] p-4 transition-colors hover:border-cga-bcyan/60 hover:bg-cga-bcyan/[0.06]"
                >
                  {/* VHS tracking sweep on hover — echoes the cassette feed */}
                  <span className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      className="absolute left-0 h-[10px] w-full bg-cga-bcyan/20 blur-[1px] mix-blend-overlay"
                      style={{ animation: "tracking-roll 1.6s linear infinite" }}
                    />
                    <span className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(85,255,255,0.05)_0px,rgba(85,255,255,0.05)_1px,transparent_1px,transparent_3px)]" />
                  </span>

                  <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] tracking-[0.14em] text-cga-cyan">
                    <span>PUBLICATION // PEER-REVIEWED</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 bg-cga-bgreen" />
                      STATUS: PUBLISHED
                    </span>
                  </div>

                  <p className="relative z-10 mono-command font-semibold text-cga-bcyan">
                    {pub.title}
                  </p>

                  <p className="relative z-10 text-sm text-cga-gray">
                    {pub.authors.map((author, i) => (
                      <span key={author}>
                        <span className={author === ME ? "text-cga-bcyan" : undefined}>
                          {author}
                        </span>
                        {i < pub.authors.length - 1 && ", "}
                      </span>
                    ))}
                  </p>

                  <div className="relative z-10 mt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="border border-cga-bcyan/40 bg-cga-bcyan/10 px-2 py-0.5 text-[11px] text-cga-bcyan">
                        {pub.venue}
                      </span>
                      <span className="w-full sm:w-auto text-[11px] tracking-[0.08em] text-cga-cyan">
                        ROLE: {pub.contribution}
                      </span>
                    </span>
                    <span className="mono-command shrink-0 text-[10px] tracking-[0.16em] text-cga-cyan opacity-0 transition-opacity group-hover:opacity-100">
                      ▸ VIEW ON IEEE XPLORE
                    </span>
                  </div>
                </ExtLink>
              ))}
            </div>
          </DossierPanel>
        </motion.section>

        <motion.section {...fade(0.72)} id="dispatches">
          <DossierPanel label="FIELD DISPATCHES" code="REF://LINKEDIN.LOG" bodyClassName="p-0">
            {/* Desktop caps the feed at ~1.5 cards and scrolls internally, so the
                clipped card + bottom fade signal there's more. Mobile stacks fully. */}
            <div className="relative">
              <div className="no-scrollbar grid gap-3 p-4 sm:p-5 md:max-h-[268px] md:overflow-y-auto">
                {DISPATCHES.map((post) => (
                  <ExtLink
                    key={post.href}
                    href={post.href}
                    label={post.title}
                    className="group relative flex gap-3 overflow-hidden border border-cga-bcyan/25 bg-cga-bcyan/[0.03] p-3 transition-colors hover:border-cga-bcyan/60 hover:bg-cga-bcyan/[0.06]"
                  >
                    {/* post image, treated as surveillance footage; until supplied it
                        falls back to the same dead-channel static as CH 02 on the cassette */}
                    <div className="relative h-[92px] w-[92px] shrink-0 self-start overflow-hidden border border-cga-bcyan/30 bg-cga-black">
                      <span className="vhs-static pointer-events-none absolute inset-[-50%] z-0 h-[200%] w-[200%] opacity-70" />
                      <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center text-center text-[9px] leading-tight tracking-[0.12em] text-cga-white/80 [text-shadow:0_0_3px_#000]">
                        NO
                        <br />
                        SIGNAL
                      </span>
                      <img
                        src={post.image}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        className="relative z-[2] h-full w-full object-cover opacity-90 [filter:grayscale(0.25)_contrast(1.05)]"
                      />
                      <span className="pointer-events-none absolute inset-0 z-[3] bg-cga-bcyan/20 mix-blend-overlay" />
                      <span className="pointer-events-none absolute inset-0 z-[3] bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]" />
                    </div>

                    <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 text-[10px] tracking-[0.14em] text-cga-cyan">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 bg-cga-bred animate-blink" />
                          FEED: LINKEDIN
                        </span>
                        <span>{fmtDispatchDate(post.date)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="mono-command font-semibold text-cga-bcyan">{post.title}</p>
                        <span className="mono-command shrink-0 text-[10px] tracking-[0.16em] text-cga-cyan opacity-0 transition-opacity group-hover:opacity-100">
                          ▸ READ
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-cga-gray">{post.excerpt}</p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        <span className="border border-cga-bcyan/40 bg-cga-bcyan/10 px-2 py-0.5 text-[11px] text-cga-bcyan">
                          {post.topic}
                        </span>
                      </div>
                    </div>
                  </ExtLink>
                ))}
              </div>

              {/* scroll affordance: the clipped card plus this fade signal more below (desktop only) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-14 bg-gradient-to-t from-cga-black to-transparent md:block" />
            </div>
          </DossierPanel>
        </motion.section>

        <motion.section {...fade(0.8)} id="contact">
          <DossierPanel label="ESTABLISH UPLINK" code="REF://CONTACT.SYS">
            <ul className="space-y-1.5">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <ExtLink
                    href={s.href}
                    label={s.label}
                    className="group flex items-center justify-between gap-3 border border-cga-bcyan/20 bg-cga-bcyan/[0.03] px-3 py-2 transition-colors hover:border-cga-bcyan/50 hover:bg-cga-bcyan/[0.06]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 shrink-0 bg-cga-bgreen" />
                      <span className="mono-command text-cga-bcyan">
                        {s.label.toUpperCase()}
                      </span>
                      <span className="truncate text-xs text-cga-gray">
                        {s.cta}
                      </span>
                    </span>
                    <span className="mono-command shrink-0 text-[10px] tracking-[0.16em] text-cga-cyan transition-colors group-hover:text-cga-bcyan">
                      CONNECT ▸
                    </span>
                  </ExtLink>
                </li>
              ))}
            </ul>
            {hasResume && (
              <p className="mt-3">
                <ExtLink
                  href={PROFILE.resumeUrl}
                  label="Resume"
                  className="text-sm text-accent link-hover"
                >
                  Download Resume
                </ExtLink>
              </p>
            )}
          </DossierPanel>
        </motion.section>

        <motion.div {...fade(0.95)} className="text-center pt-4">
          <span className="mono-command text-muted-foreground text-xs">
            {trace.isNew
              ? "[ ● NEW SUBJECT · TRACE INITIATED ]"
              : `[ ● VISIT #${trace.visits} · LAST TRACE ${relTime(trace.lastSeen)} ]`}
          </span>
        </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
