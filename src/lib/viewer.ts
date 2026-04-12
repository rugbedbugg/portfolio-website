// Real, client-side readout of whoever is watching — powers the CH-05 viewer
// dossier and the terminal's `sys` card. No network, no fingerprinting service.
export type Viewer = {
  node: string;
  os: string;
  browser: string;
  display: string;
  view: string;
  tz: string;
  locale: string;
  cores: string;
};

export const detectViewer = (): Viewer => {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua)
    ? "WINDOWS"
    : /Mac OS X/.test(ua)
      ? "MACOS"
      : /Android/.test(ua)
        ? "ANDROID"
        : /(iPhone|iPad|iPod)/.test(ua)
          ? "IOS"
          : /Linux/.test(ua)
            ? "LINUX"
            : "UNKNOWN";
  const browser = /Edg\//.test(ua)
    ? "EDGE"
    : /OPR\//.test(ua)
      ? "OPERA"
      : /Firefox\//.test(ua)
        ? "FIREFOX"
        : /Chrome\//.test(ua)
          ? "CHROME"
          : /Safari\//.test(ua)
            ? "SAFARI"
            : "UNKNOWN";
  const dpr = window.devicePixelRatio || 1;
  return {
    os,
    browser,
    node: `${browser} / ${os}`,
    display: `${window.screen.width}×${window.screen.height}${dpr !== 1 ? ` @${dpr}x` : ""}`,
    view: `${window.innerWidth}×${window.innerHeight}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "??",
    locale: navigator.language || "??",
    cores: navigator.hardwareConcurrency
      ? `${navigator.hardwareConcurrency} CORES`
      : "N/A",
  };
};
