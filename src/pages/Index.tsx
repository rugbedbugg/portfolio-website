import { useState } from "react";
import { motion } from "framer-motion";
import AsciiArt from "@/components/AsciiArt";
import GlobalTrace from "@/components/GlobalTrace";
import TypewriterText from "@/components/TypewriterText";
import DossierPanel from "@/components/DossierPanel";
import { ExtLink } from "@/components/Transmission";
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

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 10, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.52, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const Index = () => {
  const [trace] = useState(() => recordVisit());
  const typedName = PROFILE.name.toUpperCase();
  const TYPE_SPEED_MS = 100; // ~100 WPM approximation for name
  const nameSpeed = TYPE_SPEED_MS;
  const taglineSpeed = Math.round(TYPE_SPEED_MS * 0.8); // 20% faster
  const nameDelay = 120;
  const taglineDelay = nameDelay + typedName.length * nameSpeed + 260;

  // Desktop is scaled to 0.75 via CSS zoom (index.css). CSS zoom doesn't enlarge
  // the viewport the way browser zoom does, so the fixed-height panels use
  // 100/0.75 = 133.333vh: after the 0.75 scale they render at 100vh but keep the
  // content room the zoom would otherwise cost.
  return (
    <div className="relative z-10 min-h-screen overflow-hidden mono-ui md:flex md:h-[133.333vh]">
      {/* LEFT: subject identity panel. Fixed-height column from md up; scrolls internally if the cassette overflows a short viewport. */}
      <aside className="no-scrollbar flex flex-col justify-center px-6 py-6 sm:py-8 md:h-[133.333vh] md:w-[44%] md:shrink-0 md:justify-start md:overflow-y-auto">
        <div className="mx-auto w-full max-w-[560px] space-y-5">
          <div className="terminal-title text-center">
            [ SYSTEM :: OXIDE TERMINAL PORTFOLIO :: 198X MODE ]
          </div>

          <motion.header {...fade(0.2)} className="text-center space-y-2">
            <h1 className="mono-command text-2xl sm:text-3xl font-bold text-foreground text-glow tracking-widest">
              <span className="opacity-90">{"> "}</span>
              <TypewriterText
                text={typedName}
                speed={nameSpeed}
                delay={nameDelay}
              />
            </h1>
            <p className="text-muted-foreground text-xs">[{PROFILE.aliases}]</p>
            <p className="mono-command text-foreground text-sm uppercase tracking-wide">
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
      </aside>

      {/* RIGHT — dossier content: scrolls independently on md+ */}
      <main className="no-scrollbar px-6 py-6 sm:py-8 md:h-[133.333vh] md:flex-1 md:overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-6">
        <motion.nav
          {...fade(0.35)}
          className="mono-command text-center text-sm border-y border-primary/25 py-2"
        >
          {NAV_LINKS.map((link, i) => (
            <span key={link.label}>
              <a href={link.href} className="link-hover text-foreground">
                {link.label}
              </a>
              {i < NAV_LINKS.length - 1 && (
                <span className="text-muted-foreground mx-2">//</span>
              )}
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
                  {/* VHS tracking sweep on hover — echoes the cassette feed */}
                  <span className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      className="absolute left-0 h-[10px] w-full bg-cga-bcyan/20 blur-[1px] mix-blend-overlay"
                      style={{ animation: "tracking-roll 1.6s linear infinite" }}
                    />
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
