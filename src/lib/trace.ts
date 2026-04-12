// Local-only visit trace: records how many times this browser has watched the
// feed and when it last checked in. Powers the "we see you" footer + CH-05 line.
// Persisted in localStorage; nothing leaves the machine.
export type VisitTrace = {
  firstSeen: number; // epoch ms of the first-ever visit
  lastSeen: number; // epoch ms of the PREVIOUS visit (== now for a new subject)
  visits: number; // this visit included
  isNew: boolean;
};

const KEY = "oxide.trace.v1";

// Cached so multiple components share one reading and only the first records.
let cached: VisitTrace | null = null;

export const recordVisit = (): VisitTrace => {
  if (cached) return cached;
  const now = Date.now();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(
        KEY,
        JSON.stringify({ firstSeen: now, lastSeen: now, visits: 1 }),
      );
      cached = { firstSeen: now, lastSeen: now, visits: 1, isNew: true };
      return cached;
    }
    const prev = JSON.parse(raw) as Partial<VisitTrace>;
    const trace: VisitTrace = {
      firstSeen: prev.firstSeen ?? now,
      lastSeen: prev.lastSeen ?? now, // the previous visit's timestamp
      visits: (prev.visits ?? 0) + 1,
      isNew: false,
    };
    // Advance lastSeen to now for the NEXT visit to read.
    localStorage.setItem(
      KEY,
      JSON.stringify({
        firstSeen: trace.firstSeen,
        lastSeen: now,
        visits: trace.visits,
      }),
    );
    cached = trace;
    return cached;
  } catch {
    cached = { firstSeen: now, lastSeen: now, visits: 1, isNew: true };
    return cached;
  }
};

export const relTime = (ms: number): string => {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 45) return "moments ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} mo ago`;
};
