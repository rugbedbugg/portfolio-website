import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const cornerClasses = [
  "left-1 top-1 border-l border-t",
  "right-1 top-1 border-r border-t",
  "left-1 bottom-1 border-l border-b",
  "right-1 bottom-1 border-r border-b",
];

// Dead-channel 404 in the surveillance-feed language.
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cga-black px-6">
      <div className="mono-ui w-full max-w-md">
        <div className="terminal-title mb-3 text-center">
          [ OXIDE TERMINAL :: SIGNAL FAULT ]
        </div>

        <div className="relative border-2 border-cga-bcyan/40 bg-cga-black p-5">
          {/* dead-channel monitor */}
          <div className="relative h-52 overflow-hidden border border-cga-bcyan/25 bg-cga-black">
            <div className="vhs-static pointer-events-none absolute inset-[-50%] h-[200%] w-[200%] opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_2px,transparent_2px,transparent_4px)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_42%,rgba(0,0,0,0.6)_100%)]" />

            {cornerClasses.map((c) => (
              <div
                key={c}
                className={`pointer-events-none absolute h-3 w-3 border-cga-bcyan/70 ${c}`}
              />
            ))}

            <div className="mono-command pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-[1px] bg-cga-black/60 px-1.5 py-0.5 text-[8px] text-cga-bred">
              <span className="inline-block h-1.5 w-1.5 bg-cga-bred animate-blink" />
              REC
            </div>
            <div className="mono-command pointer-events-none absolute right-2 top-2 rounded-[1px] bg-cga-black/60 px-1.5 py-0.5 text-[8px] tracking-[0.18em] text-cga-bred">
              CH ERR
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <span className="mono-command text-2xl tracking-[0.3em] text-cga-bcyan text-glow">
                NO SIGNAL
              </span>
              <span className="mono-command text-[10px] tracking-[0.2em] text-cga-gray">
                -- 404 · FEED NOT FOUND --
              </span>
            </div>
          </div>

          <div className="mono-command mt-4 space-y-1 text-[11px] tracking-[0.1em] text-cga-gray">
            <div>
              STATUS : <span className="text-cga-bred">◇ SIGNAL LOST ◇</span>
            </div>
            <div className="truncate">
              CH ERR : <span className="text-cga-bcyan">{location.pathname}</span>
            </div>
          </div>

          <a
            href="/"
            className="mono-command mt-4 flex items-center justify-center gap-2 border-2 border-cga-bcyan/40 bg-cga-bcyan/[0.05] px-3 py-2.5 text-[11px] tracking-[0.16em] text-cga-bcyan transition-colors hover:bg-cga-bcyan/15"
          >
            ▸ RETURN TO FEED
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
