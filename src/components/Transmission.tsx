import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";

// Human-readable destination for a url (address for mailto, host+path otherwise).
export const hostOf = (url: string) => {
  if (url.startsWith("mailto:")) return url.slice(7);
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
};

type Connect = (url: string, label?: string) => void;
const TransmissionContext = createContext<Connect>(() => {});
export const useTransmission = () => useContext(TransmissionContext);

// Plays a brief "establishing uplink" interstitial before opening external links.
export const TransmissionProvider = ({ children }: { children: ReactNode }) => {
  const reduced = useReducedMotion();
  const [target, setTarget] = useState<{ host: string } | null>(null);

  const connect = useCallback<Connect>(
    (url) => {
      if (reduced) {
        window.location.href = url;
        return;
      }
      // Play the uplink interstitial in-page, then hand off this tab so the
      // whole transition stays visible (no blank pop-up tab to flash white).
      setTarget({ host: hostOf(url) });
      window.setTimeout(() => {
        window.location.href = url;
      }, 1150);
    },
    [reduced],
  );

  // Since connect() navigates this tab, hitting Back restores the page from the
  // bfcache with the interstitial still up. Clear it when the page is shown
  // again so returning visitors don't land on a frozen "ESTABLISHING UPLINK".
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setTarget(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <TransmissionContext.Provider value={connect}>
      {children}
      {target && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-cga-black/85 px-6 backdrop-blur-[1px]">
          <div className="ambient-scan pointer-events-none absolute inset-0 opacity-60" />
          <div className="mono-command relative w-full max-w-md border border-cga-bcyan/40 border-glow bg-cga-black p-5 text-[11px] tracking-[0.14em] text-cga-bcyan">
            <div className="flex items-center gap-2 text-cga-bred">
              <span className="inline-block h-2 w-2 bg-cga-bred animate-blink" />
              ESTABLISHING UPLINK
            </div>
            <div className="mt-3 space-y-1 text-cga-gray">
              <div>
                TARGET :: <span className="text-cga-bcyan">{target.host}</span>
              </div>
              <div>ROUTING THROUGH RELAY...</div>
            </div>
            <div className="mt-3 h-2 w-full border border-cga-bcyan/40 bg-cga-bcyan/[0.06]">
              <div
                className="h-full bg-cga-bcyan"
                style={{ animation: "uplink-fill 1.1s linear forwards" }}
              />
            </div>
          </div>
        </div>
      )}
    </TransmissionContext.Provider>
  );
};

// External anchor that routes through the uplink interstitial on plain click.
export const ExtLink = ({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) => {
  const connect = useTransmission();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        connect(href, label);
      }}
    >
      {children}
    </a>
  );
};
