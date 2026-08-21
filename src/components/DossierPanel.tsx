import type { ReactNode } from "react";

// HUD corner brackets, echoing the surveillance feed's framing
const BRACKETS = [
  "left-1 top-1 border-l border-t",
  "right-1 top-1 border-r border-t",
  "left-1 bottom-1 border-l border-b",
  "right-1 bottom-1 border-r border-b",
];

// Content-agnostic "case file" frame: header strip + brackets around any children.
const DossierPanel = ({
  label,
  code,
  bodyClassName = "p-4 sm:p-5",
  children,
}: {
  label: string;
  code: string;
  bodyClassName?: string;
  children: ReactNode;
}) => (
  <div className="relative border border-cga-bcyan/30 border-glow bg-cga-black">
    {BRACKETS.map((c) => (
      <span
        key={c}
        className={`pointer-events-none absolute z-10 h-2.5 w-2.5 border-cga-bcyan/60 ${c}`}
      />
    ))}

    <div className="mono-command flex items-center justify-between gap-2 border-b border-cga-bcyan/20 bg-cga-bcyan/[0.05] px-3 py-1.5">
      <span className="flex items-center gap-1.5 text-base font-bold tracking-[0.12em] text-cga-bcyan">
        <span className="inline-block h-1.5 w-1.5 bg-cga-bred animate-blink" />
        {label}
      </span>
      <span className="truncate text-[10px] tracking-[0.14em] text-cga-gray">{code}</span>
    </div>

    <div className={bodyClassName}>{children}</div>
  </div>
);

export default DossierPanel;
