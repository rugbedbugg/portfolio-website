import { useState } from "react";
import { motion } from "framer-motion";
import AsciiArt from "@/components/AsciiArt";
import TypewriterText from "@/components/TypewriterText";
import DossierPanel from "@/components/DossierPanel";
import { ExtLink } from "@/components/Transmission";
import { recordVisit, relTime } from "@/lib/trace";

const PROFILE = {
  name: "Partha P.G.",
  aliases: "Oxide 1-6 // Arsenic 1-6 // rugbedbugg",
  tagline: "Cyber Forensics Enthusiast & CTF Player",
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
    title: "ResonanceID-cli",
    description:
      "A Shazam-inspired Rust CLI that fingerprints WAV audio, ranks candidate matches, and backs everything with SQLite for fast, explainable lookup.",
    href: "https://github.com/rugbedbugg/ResonanceID-cli",
    tags: ["Rust", "DSA", "SQLite", "cli"],
  },
  {
    title: "Dev-Tools-Assistant",
    description:
      "An agentic developer companion that crawls the web and suggests practical tools based on your stack, project type, and goals.",
    href: "https://github.com/rugbedbugg/Dev-Tools-Assistant",
    tags: ["Python", "Automation", "Agentic", "Tooling"],
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

  return (
    <div className="relative z-10 min-h-screen overflow-hidden mono-ui md:flex md:h-screen">
      {/* LEFT: subject identity panel. Fixed-height column from md up; scrolls internally if the cassette overflows a short viewport. */}
      <aside className="flex flex-col justify-center px-6 py-6 sm:py-8 md:h-screen md:w-[44%] md:shrink-0 md:justify-start md:overflow-y-auto">
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
      <main className="px-6 py-6 sm:py-8 md:h-screen md:flex-1 md:overflow-y-auto">
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
                I enjoy solving CTF challenges and studying cyber forensics with
                a hands-on approach. I like to break systems down, understand
                why they work, and rebuild them in a cleaner way.
              </p>
              <p>
                My work usually sits between low-level systems, practical
                security workflows, and small developer tools that are simple,
                fast, and useful.
              </p>
              <p className="text-[0.92rem] leading-7 text-muted-foreground pt-1">
                Right now, I'm focused on practical security engineering,
                reverse-oriented thinking, and building tools that reduce
                friction for real workflows.
              </p>
            </div>
          </DossierPanel>
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
