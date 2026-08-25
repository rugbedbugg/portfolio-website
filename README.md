# Portfolio Website

![GitHub last commit](https://img.shields.io/github/last-commit/rugbedbugg/portfolio-website?style=for-the-badge&labelColor=000000)
![GitHub repo size](https://img.shields.io/github/repo-size/rugbedbugg/portfolio-website?style=for-the-badge&labelColor=000000)
![Stars](https://img.shields.io/github/stars/rugbedbugg/portfolio-website?style=for-the-badge&labelColor=000000)

Personal portfolio site - terminal-themed, React + TypeScript + Vite. Features an ASCII-art hero, animated background, dossier panel, transmission log, and research publications section. Built with shadcn/ui, Tailwind CSS, Framer Motion, and Three.js for ambient effects.

## Status

**Active**

## Features

| Feature | Description |
|---------|-------------|
| Terminal aesthetic | Green-phosphor palette, typewriter text, ASCII art, scanline effects |
| Interactive components | Dossier panel (profile), Transmission log (activity feed), Global trace (world map) |
| Research publications | IEEE paper showcase with DOI links |
| Now Playing | Audio visualization with Three.js/postprocessing |
| Responsive | Mobile-first, handles narrow viewports gracefully |
| Dark mode only | Intentional design choice |

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.8 | Strict mode |
| Vite | 5 | Fast dev server, optimized builds |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | Radix UI primitives | Component library |
| Framer Motion | 12 | Animations, transitions |
| Three.js | 0.183 + postprocessing | WebGL ambient background |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state (if needed) |
| Zod | 3 | Schema validation |
| Vitest | 3 + Testing Library | Unit/component tests |
| ESLint | 9 + TypeScript ESLint | Linting |

## Architecture

### Project Structure

```
portfolio-website/
├── public/                 # Static assets (served at root)
│   ├── assets/             # Audio files (mp3)
│   ├── dispatches/         # Project thumbnails (png)
│   ├── fonts/              # DepartureMono woff2
│   ├── _headers            # Cloudflare headers (security, caching)
│   ├── _redirects          # Cloudflare redirects
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── demos/          # Demo-specific components
│   │   ├── ui/             # shadcn/ui components (40+)
│   │   ├── AmbientBackground.tsx  # Three.js animated backdrop
│   │   ├── AsciiArt.tsx            # Hero ASCII art
│   │   ├── DossierPanel.tsx        # Profile sidebar
│   │   ├── GlobalTrace.tsx         # World map visualization
│   │   ├── Terminal.tsx            # Terminal-style container
│   │   ├── Transmission.tsx        # Activity feed log
│   │   └── TypewriterText.tsx      # Character-by-character typing
│   ├── hooks/
│   │   ├── use-mobile.tsx          # Mobile breakpoint hook
│   │   ├── use-subject-layout.tsx  # Layout coordination
│   │   └── use-toast.ts            # Toast notifications
│   ├── lib/
│   │   ├── relays.ts               # Event relay system
│   │   ├── trace.ts                # Trace logging
│   │   ├── useRelay.ts             # Relay hook
│   │   ├── utils.ts                # ClassName merge, etc.
│   │   ├── viewer.ts               # Media viewer logic
│   │   └── worldMap.ts             # Map data + rendering
│   ├── pages/
│   │   ├── Index.tsx               # Main portfolio page
│   │   └── NotFound.tsx            # 404 page
│   ├── test/                       # Vitest setup + example tests
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Tailwind imports + globals
├── scripts/
│   └── gen-worldmap.mjs            # Generates world map data
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json / .app.json / .node.json
├── eslint.config.js
├── postcss.config.js
├── vitest.config.ts
└── README.md
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `AmbientBackground` | Three.js scene with postprocessing (bloom, noise) |
| `AsciiArt` | Hero banner: "OXIDE 1-6" in green phosphor |
| `DossierPanel` | Collapsible profile: skills, links, contact |
| `Transmission` | Timestamped log entries (GitHub, research, etc.) |
| `GlobalTrace` | Interactive world map (Canvas/SVG) |
| `Terminal` | Styled container with scanlines, cursor blink |
| `TypewriterText` | Configurable typing animation |

## Install / Run

### Prerequisites

| Requirement | Details |
|-------------|---------|
| Node.js | ≥ 18 (LTS recommended) |
| npm | ≥ 9 (or pnpm/yarn) |

### Development

```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### Build

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `vite build` | Production build → dist/ |
| `build:dev` | `vite build --mode development` | Dev-mode build |
| `preview` | `vite preview` | Preview production build locally |

### Lint & Test

| Script | Command | Description |
|--------|---------|-------------|
| `lint` | `eslint .` | Lint all source |
| `test` | `vitest run` | Run tests once (headless) |
| `test:watch` | `vitest` | Watch mode |

### Development Server

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server |

## Deployment

Deployed on **Cloudflare Pages** (`partha-pg.pages.dev`). The `public/_headers` and `public/_redirects` files are copied to `dist/` on build and work natively on Cloudflare.

```bash
npm run build
# Deploy dist/ to Cloudflare Pages (connect repo in dashboard, or use Wrangler)
```

Headers include: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP-ready.

> `wrangler pages deploy dist/` also works for CLI deployments.

## Configuration

### Tailwind (`tailwind.config.ts`)

| Setting | Value |
|---------|-------|
| Custom colors | `phosphor` palette (green terminal theme) |
| Font | `DepartureMono` (woff2, self-hosted) |
| Animations | `scanline`, `typewriter`, `pulse-glow` |

### TypeScript

| Config | Purpose |
|--------|---------|
| `tsconfig.json` | Base config |
| `tsconfig.app.json` | App code (strict) |
| `tsconfig.node.json` | Vite/config files |

### ESLint (`eslint.config.js`)

| Plugin | Purpose |
|--------|---------|
| TypeScript ESLint | Recommended rules |
| React Hooks | Hooks linting |
| Import sorting | Optional |

## Project Structure (Simplified)

```
src/
├── components/          # React components
│   ├── ui/              # 40+ shadcn/ui primitives
│   └── *.tsx            # Feature components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, shared logic
├── pages/               # Route pages
├── test/                # Test setup
├── App.tsx              # Root
├── main.tsx             # Entry
└── index.css            # Tailwind + globals
```

## Testing

```bash
npm run test
```

Covers: component rendering (Testing Library), utility functions, hook behavior. Uses `jsdom` environment.

## Notes / Gotchas

| Note | Details |
|------|---------|
| Font | `DepartureMono-Regular.woff2` self-hosted in `public/fonts/` - no external font requests |
| Audio | MP3 files in `public/assets/` - loaded on demand for "Now Playing" |
| Images | Project thumbnails in `public/dispatches/` - referenced by name |
| Headers/Redirects | `_headers` and `_redirects` auto-copied to `dist/` on build |
| Rendering | No SSR - pure SPA, all rendering client-side |

## License

MIT, see [LICENSE](LICENSE).

## Links

- **Repo:** https://github.com/rugbedbugg/portfolio-website
- **Live:** https://partha-pg.pages.dev
- **Issues:** https://github.com/rugbedbugg/portfolio-website/issues