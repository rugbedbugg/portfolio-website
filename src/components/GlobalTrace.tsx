import DossierPanel from "@/components/DossierPanel";
import { GEO } from "@/lib/geo";
import { WORLD_MAP_ROWS, WORLD_MAP_MARKER } from "@/lib/worldMap";

// Dot-matrix world map with a blinking marker on the subject's last known position.
// The land grid is embedded (see src/lib/worldMap.ts); coords come from the shared GEO.
const GlobalTrace = () => (
  <DossierPanel label="GLOBAL TRACE" code="REF://GEO.LOC">
    <div className="overflow-x-auto">
      <pre
        aria-hidden="true"
        className="mono-command w-max select-none text-cga-cyan/70 text-[5px] leading-[6px] tracking-[1px] sm:text-[6px] sm:leading-[7px] sm:tracking-[1.5px] md:text-[7px] md:leading-[8px] md:tracking-[2px]"
      >
        {WORLD_MAP_ROWS.map((row, r) => {
          if (r !== WORLD_MAP_MARKER.row) return <div key={r}>{row}</div>;
          const c = WORLD_MAP_MARKER.col;
          return (
            <div key={r}>
              {row.slice(0, c)}
              <span className="text-cga-bred animate-blink">◆</span>
              {row.slice(c + 1)}
            </div>
          );
        })}
      </pre>
    </div>

    <div className="mono-command mt-3 space-y-1 text-[11px] text-cga-gray">
      <p>
        <span className="text-cga-bgreen">●</span> LAST KNOWN POSITION ::{" "}
        <span className="text-cga-bcyan">{GEO.decimal}</span>
      </p>
      <p className="flex items-center justify-between gap-2">
        <span>
          <span className="text-cga-bgreen">●</span> REGION :: {GEO.region}
        </span>
        <span className="text-cga-cyan">STATUS: TRACED</span>
      </p>
    </div>
  </DossierPanel>
);

export default GlobalTrace;
