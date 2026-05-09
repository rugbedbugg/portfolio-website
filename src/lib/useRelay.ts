import { useSyncExternalStore } from "react";
import { RELAYS } from "./relays";

// One shared, synced "active relay" that cycles on a single module-level interval,
// so every consumer (feed OSD, GLOBAL TRACE map) shows the same decoy node at once.
let index = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      index = (index + 1) % RELAYS.length;
      listeners.forEach((l) => l());
    }, 4200);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => index;

export function useRelay() {
  const i = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return RELAYS[i];
}
