# Charles Map - Production-ready Mapping Studio

Charles Map is a modern, SaaS-inspired mapping studio built with Next.js. It
empowers teams to craft annotated maps, capture rich geometry metadata, and
export high-fidelity imagery without leaving the browser.

## Feature Highlights

- **Advanced editing workflow** – Undo/redo history with keyboard shortcuts,
  geometry-aware inspector, duplication, and precision snapping controls.
- **Rich annotation palette** – Markers, text blocks, rectangles, circles, and
  directional connectors with configurable stroke, opacity, and rotation.
- **Responsive studio layout** – Fully adaptive interface that scales from large
  desktops down to phones while keeping mission-critical actions within thumb
  reach.
- **Instant persistence** – Local-first storage with cross-tab syncing so drafts
  appear in the dashboard immediately and survive reloads.
- **Production export pipeline** – High-quality JPG export that respects custom
  canvas sizes and backgrounds.
- **Dashboard analytics** – Project counts, annotation totals, last activity
  timestamps, and one-click duplication for rapid iterations.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to launch the studio. Build a production bundle
with `npm run build` followed by `npm start`.

## SaaS-oriented Capabilities

| Capability | Details |
| --- | --- |
| Local persistence | Maps are saved to localStorage instantly and synced across browser tabs. |
| Optimistic UX | Create, duplicate, and edit projects without blocking on network calls. |
| Error resilience | Storage parsing and persistence include guard rails with developer-friendly warnings. |
| Growth friendly | Every project is timestamped and surfaced in analytics panels for at-a-glance reporting. |

## Editor Toolkit

### Tool Palette

- **Marker** – Single point of interest with accent colour.
- **Text** – Rich text block with editable copy and font size.
- **Rectangle & Circle** – Configurable shapes with minimum size guards and
  optional opacity.
- **Arrow & Line** – Directional or straight connectors with pointer controls
  and stroke thickness adjustments.

### Inspector Metrics

The inspector surfaces contextual measurements such as width, height, radius,
area, circumference, connector length, and angle to help teams validate spatial
relationships with precision.

### Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl + Z` | Undo |
| `⌘/Ctrl + Shift + Z` or `⌘/Ctrl + Y` | Redo |
| `Delete` / `Backspace` | Remove selected annotation |
| `Esc` | Clear selection and active tool |

## Responsive Experience

The dashboard and editor share a mobile-first flex layout that preserves toolbar
access on phones while maximising canvas area on larger screens. Buttons use
accessible hit areas and dynamic spacing for ergonomic use on touch devices.

## Architecture Overview

```
app/
├── dashboard/        # SaaS-style landing grid with analytics
├── editor/[id]/      # Map editor route wired to the MapEditor component
└── layout.tsx        # Root layout and global styles
components/
└── MapEditor.tsx     # Main editor logic and Konva canvas
hooks/
├── useAnnotationHistory.ts # Undo/redo manager
└── useMaps.ts               # Storage-aware CRUD helpers
```

### State & Data Flow

- `useMaps` keeps the dashboard in sync with browser storage, broadcasting
  changes across tabs and providing CRUD helpers (`createMap`, `saveMap`,
  `deleteMap`, `getMap`).
- `useAnnotationHistory` tracks annotation snapshots, enabling blazing-fast
  undo/redo and powering the inspector metrics.
- `MapEditor` orchestrates background imagery, Konva layers, snapping logic,
  geometry calculations, and export tooling.

## Quality Checklist

- Type-safe React + Next.js 16 with modern ESLint configuration.
- Declarative Tailwind CSS styling and mobile-first breakpoints.
- Konva error boundary with actionable recovery guidance.
- Geometry cloning utilities to avoid accidental mutation in history snapshots.

## Testing & Linting

Run lint checks to ensure code quality stays production-ready:

```bash
npm run lint
```

## License

MIT
