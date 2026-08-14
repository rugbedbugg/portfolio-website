import DossierPanel from "@/components/DossierPanel";
import { useRelay } from "@/lib/useRelay";
import { WORLD_MAP_ROWS } from "@/lib/worldMap";

// Dot-matrix world map with a radiating marker that hops between decoy relay nodes
// (proxychains) rather than exposing a fixed real location. The land grid is
// embedded (see src/lib/worldMap.ts); the active node comes from the shared store.
const GlobalTrace = () => {
  const relay = useRelay();
  return (
    <DossierPanel label="GLOBAL TRACE" code="REF://RELAY.NET">
      <div className="global-trace-map">
        <pre
          aria-hidden="true"
          className="global-trace-grid mono-command select-none text-cga-cyan/70"
        >
          {WORLD_MAP_ROWS.map((row, r) => {
            if (r !== relay.cell.row) return <div key={r}>{row}</div>;
            const c = relay.cell.col;
            return (
              <div key={r}>
                {row.slice(0, c)}
                <span className="gt-marker" aria-hidden="true">
                  <span className="gt-ring" />
                  <span className="gt-ring" />
                  <span className="gt-ring" />
                  <span className="gt-dot" />
                </span>
                {row.slice(c + 1)}
              </div>
            );
          })}
        </pre>
      </div>

      <div className="mono-command mt-3 space-y-1 text-[11px] text-cga-gray">
        <p>
          <span className="text-cga-bgreen">●</span> RELAY NODE ::{" "}
          <span className="text-cga-bcyan">{relay.decimal}</span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span>
            <span className="text-cga-bgreen">●</span> ORIGIN :: {relay.region}
          </span>
          <span className="text-cga-cyan">STATUS: ROUTED</span>
        </p>
      </div>
    </DossierPanel>
  );
};

export default GlobalTrace;
