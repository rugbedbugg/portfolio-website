import { motion } from "framer-motion";
import AsciiArt from "@/components/AsciiArt";
import TypewriterText from "@/components/TypewriterText";
import DossierPanel from "@/components/DossierPanel";

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
  { label: "GitHub", href: "https://github.com/rugbedbugg" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/partha-gogoi-736241308/",
  },
  { label: "Email", href: PROFILE.email },
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
    title: "Dev-Tools-Assisstant",
    description:
      "An agentic developer companion that crawls the web and suggests practical tools based on your stack, project type, and goals.",
    href: "https://github.com/rugbedbugg/Dev-Tools-Assisstant",
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
  const typedName = PROFILE.name.toUpperCase();
  const TYPE_SPEED_MS = 100; // ~100 WPM approximation for name
  const nameSpeed = TYPE_SPEED_MS;
  const taglineSpeed = Math.round(TYPE_SPEED_MS * 0.8); // 20% faster
  const nameDelay = 120;
  const taglineDelay = nameDelay + typedName.length * nameSpeed + 260;

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-6 sm:py-8">
      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6 p-1 sm:p-2 md:p-3 mono-ui">
        <div className="terminal-title">
          [ SYSTEM :: OXIDE TERMINAL PORTFOLIO :: 198X MODE ]
        </div>

        <div className="flex flex-col-reverse gap-6 lg:flex-col">
          <div className="flex justify-center py-1">
            <AsciiArt />
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
        </div>

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
                <a
                  key={project.title}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex flex-col gap-2 border border-cga-bcyan/25 bg-cga-bcyan/[0.03] p-4 transition-colors hover:border-cga-bcyan/60 hover:bg-cga-bcyan/[0.06]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono-command font-semibold text-cga-bcyan">{`$ ./${project.title}`}</p>
                    <span className="mono-command text-[10px] tracking-[0.16em] text-cga-cyan opacity-0 transition-opacity group-hover:opacity-100">
                      ▸ OPEN
                    </span>
                  </div>
                  <p className="text-sm text-cga-gray">{project.description}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={`${project.title}-${tag}`}
                        className="border border-cga-bcyan/40 bg-cga-bcyan/10 px-2 py-0.5 text-[11px] text-cga-bcyan"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-4">
              <a
                href="https://github.com/rugbedbugg?tab=repositories"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent link-hover"
              >
                View all projects on GitHub
              </a>
            </p>
          </DossierPanel>
        </motion.section>

        <motion.section {...fade(0.8)} id="contact">
          <DossierPanel label="ESTABLISH UPLINK" code="REF://CONTACT.SYS">
            <div className="flex flex-wrap items-center gap-x-1 text-sm">
              {SOCIALS.map((s, i) => (
                <span key={s.label}>
                  <a
                    href={s.href}
                    className="link-hover text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.label}
                  </a>
                  {i < SOCIALS.length - 1 && (
                    <span className="text-muted-foreground mx-2">//</span>
                  )}
                </span>
              ))}
            </div>
            {hasResume && (
              <p className="mt-3">
                <a
                  href={PROFILE.resumeUrl}
                  className="text-sm text-accent link-hover"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Resume
                </a>
              </p>
            )}
          </DossierPanel>
        </motion.section>

        <motion.div {...fade(0.95)} className="text-center pt-4">
          <span className="text-muted-foreground text-xs">
            [ Visitors: 001337 ]
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
