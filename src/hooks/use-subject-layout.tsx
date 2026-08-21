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
const FIT_GUARD = 2;
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
): { mode: LayoutMode; scale: number; rightScale: number } {
  const [state, setState] = React.useState<{
    mode: LayoutMode;
    scale: number;
    rightScale: number;
  }>({ mode: "two", scale: 1, rightScale: 1 });

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
      const availH = winH - 2 * PANEL_PAD_Y - FIT_GUARD;
      const ideal = Math.min(availW / natW, availH / natH);

      let mode: LayoutMode;
      let scale = 1;
      let rightScale = 1;
      if (winW < MOBILE_MAX) {
        mode = "mobile";
      } else if (winW >= TWO_MIN_WIDTH && ideal >= MIN_FIT) {
        mode = "two";
        scale = Math.min(ideal, MAX_FIT);
        // The cassette is centered in its column, leaving equal slack on each
        // side (that slack is its horizontal padding). Size the dossier so it
        // leaves the SAME slack on each side of its own column, then both panes
        // sit centered with matching padding: the two paddings that meet in the
        // middle sum to the same total as the two outer paddings.
        const contentBox = winW - 2 * ROOT_PAD;
        const asideW = ASIDE_FRACTION * contentBox;
        const blockW = (natW || SUBJECT_MEASURE) * scale;
        const sidePad = Math.max((asideW - blockW) / 2, 0);
        const mainW = (1 - ASIDE_FRACTION) * contentBox - GAP;
        rightScale = Math.min(
          Math.max((mainW - 2 * sidePad) / DOSSIER_MEASURE, 1),
          DOSSIER_MAX,
        );
      } else {
        mode = "single";
      }

      setState((prev) =>
        prev.mode === mode &&
        Math.abs(prev.scale - scale) < 0.005 &&
        Math.abs(prev.rightScale - rightScale) < 0.005
          ? prev
          : { mode, scale, rightScale },
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
