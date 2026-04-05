const AmbientBackground = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
  >
    {/* slow-drifting violet glow */}
    <div className="ambient-glow absolute inset-[-15%]" />
    {/* crawling CRT scanlines */}
    <div className="ambient-scan absolute inset-0 opacity-60" />
    {/* animated film grain (kept very faint) */}
    <div className="ambient-grain absolute inset-[-50%] h-[200%] w-[200%] opacity-[0.06]" />
    {/* vignette to keep edges dark and content readable */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
  </div>
);

export default AmbientBackground;
