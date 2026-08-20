import * as React from "react";

// Layout modes for the landing view:
//  - "two"    : side-by-side subject panel + dossier (desktop, roomy viewport)
//  - "single" : stacked single column (desktop-ish but too short/narrow to fit
//               the subject panel without scrolling)
//  - "mobile" : the phone layout
export type LayoutMode = "two" | "single" | "mobile";

const MOBILE_MAX = 768; // below this, phone layout
const TWO_MIN_WIDTH = 1024; // two-pane needs at least this width
// Keep two-pane down to a 0.72 fit so a subject panel that shrinks but still
// fits (common at 100% zoom on 125%-scaled displays) stays two-pane instead of
// dropping to a single column. 0.72 also makes the effective width threshold
// line up with TWO_MIN_WIDTH.
const MIN_FIT = 0.72;
const MAX_FIT = 1.6; // cap fluid growth so the cassette isn't comically large

// Layout paddings that shrink the available box, mirroring the Tailwind classes
// on the shell (px-8 / gap-8 / py-8 => 2rem = 32px each).
const ROOT_PAD = 32;
const GAP = 32;
const PANEL_PAD_Y = 32;
const ASIDE_FRACTION = 0.44; // aside is w-[44%] of the flex content box

// The dossier column keeps a fixed readable measure (max-w-2xl = 42rem) and
// grows fluidly by zooming that block to fill its column, so line length stays
// constant while glyphs scale with the viewport. Floored at 1 so the primary
// reading content never renders below its baseline size.
const DOSSIER_MEASURE = 672;
const DOSSIER_MAX = 1.5;
const SUBJECT_MEASURE = 560; // the subject block's fixed max width (max-w-[560px])

// Measures the subject block's natural size and the viewport, then decides the
// layout mode and (for two-pane) the zoom that makes the block fit the pane
// without scrolling while keeping its aspect ratio.
export function useSubjectLayout(
  contentRef: React.RefObject<HTMLElement>,
): { mode: LayoutMode; scale: number; rightScale: number; rightInset: number } {
  const [state, setState] = React.useState<{
    mode: LayoutMode;
    scale: number;
    rightScale: number;
    rightInset: number;
  }>({ mode: "two", scale: 1, rightScale: 1, rightInset: 0 });

  React.useLayoutEffect(() => {
    const compute = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const el = contentRef.current;
      // offsetWidth/Height are the natural (un-zoomed) layout size; zoom is
      // applied to a wrapper, so these stay stable as the scale changes.
      const natW = el?.offsetWidth || 560;
      const natH = el?.offsetHeight || 1;

      const availW = ASIDE_FRACTION * (winW - 2 * ROOT_PAD - GAP);
      const availH = winH - 2 * PANEL_PAD_Y;
      const ideal = Math.min(availW / natW, availH / natH);

      let mode: LayoutMode;
      let scale = 1;
      let rightScale = 1;
      let rightInset = 0;
      if (winW < MOBILE_MAX) {
        mode = "mobile";
      } else if (winW >= TWO_MIN_WIDTH && ideal >= MIN_FIT) {
        mode = "two";
        scale = Math.min(ideal, MAX_FIT);
        // The cassette is centered in a wider column, so it leaves slack on
        // each side; that slack is the left/center gap. Mirror it as a right
        // margin on the dossier so all three gaps match.
        const asideW = ASIDE_FRACTION * (winW - 2 * ROOT_PAD);
        const blockW = (natW || SUBJECT_MEASURE) * scale;
        rightInset = Math.max((asideW - blockW) / 2, 0);
        // Fluid dossier: zoom the fixed-measure block to fill the column that
        // remains after reserving the matching right margin.
        const mainW = (1 - ASIDE_FRACTION) * (winW - 2 * ROOT_PAD) - GAP;
        rightScale = Math.min(
          Math.max((mainW - rightInset) / DOSSIER_MEASURE, 1),
          DOSSIER_MAX,
        );
      } else {
        mode = "single";
      }

      setState((prev) =>
        prev.mode === mode &&
        Math.abs(prev.scale - scale) < 0.005 &&
        Math.abs(prev.rightScale - rightScale) < 0.005 &&
        Math.abs(prev.rightInset - rightInset) < 0.5
          ? prev
          : { mode, scale, rightScale, rightInset },
      );
    };

    compute();
    window.addEventListener("resize", compute);
    // The natural height shifts once the web font loads; watch the block too.
    const ro = new ResizeObserver(compute);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => {
      window.removeEventListener("resize", compute);
      ro.disconnect();
    };
  }, [contentRef]);

  return state;
}
