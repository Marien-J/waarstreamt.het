# ADR 001: Web App Architecture — React/Vite SPA

**Status:** Accepted
**Date:** 2026-05-08
**Deciders:** Developer (implementing task `20260508-nl-streaming-web-app`)

## Context

We need a fast, modern web interface for the multi-country streaming catalog. The existing Python Dash dashboard (see `docs/features/dashboard.md`) works but has limitations:
- Server-side rendering overhead
- Limited interactivity (Dash callback model)
- Harder to deploy (requires Python runtime)
- Not optimized for large datasets (10k+ titles)

Requirements for v1:
- **Performance**: sub-100ms search, virtualized grid for 10k titles
- **Offline-first**: no backend, CSV → JSON at build time
- **Shareable**: URL state for filters (v2)
- **Responsive**: mobile-first, works on all devices
- **Fast iteration**: modern DX with HMR, TypeScript, linting

## Decision

Build a **React 18 + Vite 5 SPA** with the following stack:

### Core Framework
- **React 18** — mature, well-documented, huge ecosystem
- **TypeScript (strict)** — type safety, better DX
- **Vite 5** — instant dev server, optimized production builds

### State & Routing
- **Zustand** — minimal global state (dark mode, provider selection)
  - Alternative considered: Redux (overkill), Context API (verbose)
  - Why Zustand: < 1 KB, zero boilerplate, excellent TypeScript support
- **TanStack Router** (v2) — type-safe routing with URL state sync
  - Alternative: React Router (less type-safe), Next.js (overkill)

### Search & Filtering
- **Orama** — in-memory search + faceted filtering
  - BM25 ranking > Fuse.js fuzzy ratio
  - Native facet support (live counts for filters)
  - Modern API, actively maintained
  - Alternative considered: Fuse.js (no facets), MiniSearch (less features)

### Virtualization
- **@tanstack/react-virtual** — only library that handles variable-height grids well
  - Alternative: react-window (less flexible), react-virtualized (deprecated)

### UI & Styling
- **Tailwind CSS** — utility-first, fast prototyping, excellent DX
- **shadcn/ui patterns** (copy-paste components, not installed library)
  - Alternative: Material UI (too heavy), Chakra (overkill), custom CSS (slow)

### Build Pipeline
- **CSV → JSON preprocessing** (Node script with Papaparse)
  - Runs at build time (`npm run build`)
  - Aggregates title×offer grain to title-level
  - Outputs to `public/data/titles.json` (static asset)
  - Alternative: runtime CSV parsing (slower), SQLite (overkill)

### Hosting
- **Vercel** (for now, easily switchable)
  - Automatic previews, edge CDN, zero config
  - Alternative: Netlify, Cloudflare Pages, GitHub Pages

## Consequences

### Positive
- **Fast development**: Vite HMR is instant, Tailwind speeds up styling
- **Great performance**: virtualization + Orama + code splitting = snappy UX
- **Simple deployment**: static site, works anywhere
- **Type safety**: TypeScript catches bugs at compile time
- **No backend needed**: CSV → JSON at build, served as static asset

### Negative
- **No SEO**: SPA = no server-side rendering (fine for v1, not a public site)
- **Client-side bundle**: initial 200 KB JS download (mitigated by code splitting)
- **Build step required**: CSV changes need rebuild (acceptable trade-off)

### Neutral
- **Zustand over Redux**: less boilerplate, but smaller ecosystem
- **Orama is new**: less mature than Fuse.js, but better feature set

## Alternatives Considered

### Profile B: Next.js App Router
- **Pro**: SSR for SEO, React Server Components, image optimization
- **Con**: Overkill for static catalog, requires Node.js runtime, heavier bundle
- **Verdict**: Not needed for v1 (no SEO requirement, no auth/accounts)

### Profile C: Svelte + SvelteKit
- **Pro**: Smaller bundles, simpler syntax
- **Con**: Smaller ecosystem, less TypeScript support, team unfamiliarity
- **Verdict**: React has better library support (Orama, TanStack Virtual)

### Profile D: Vue + Nuxt
- **Pro**: Great DX, Composition API
- **Con**: Same as Svelte — smaller ecosystem
- **Verdict**: React ecosystem wins for this use case

## Notes

- **Mobile-first**: Tailwind breakpoints, responsive grid
- **Dark mode default**: millennial aesthetic, CSS custom properties
- **Keyboard navigation**: `/` for search, arrow keys for grid, `Esc` to close
- **Accessibility**: ARIA labels, semantic HTML, contrast-checked colors
- **Extensibility**: router ready for URL state (v2), Orama supports facets (v2 filters)

## References

- Task spec: `tasks/20260508-nl-streaming-web-app.md`
- Feature doc: `docs/features/nl-streaming-web-app.md`
- Orama docs: https://docs.oramasearch.com
- TanStack Virtual: https://tanstack.com/virtual/latest
