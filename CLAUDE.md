# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**GHT - Flores El Trigal** is a single-file PWA (Progressive Web App) for field hydration quality assurance during flower cutting operations. There is no build step, no package manager, and no framework — the entire application lives in `index.html`.

## Deployment

This is a static site hosted on GitHub Pages. To deploy changes:
1. Push commits to the `main` branch — GitHub Pages serves them automatically.
2. **After any change to `index.html`**, increment `CACHE_NAME` in `sw.js` (e.g. `ght-trigal-v25` → `ght-trigal-v26`) so already-installed PWAs detect the update.

To preview locally, serve the folder with any static server:
```bash
npx serve .
# or
python -m http.server 8080
```
Then open `http://localhost:8080` in Chrome (required for service worker registration).

## Architecture

**All application logic is inside `index.html`** — CSS in `<style>`, HTML structure, and a large inline `<script>` block at the bottom. There are no external JS files.

### Key external dependencies (loaded from CDN, cached by service worker)
- `@supabase/supabase-js@2` — auth and cloud sync
- `chart.js` — KPI charts in the "Datos" tab
- `xlsx` (SheetJS) — Excel export
- `jspdf` + `jspdf-autotable` — PDF export
- `html2canvas` — screenshot-to-PDF for charts
- Font Awesome 6 — icons

### Data flow
- Records are written to **`localStorage`** first (offline-first), then synced to **Supabase** asynchronously.
- On app load, pending records (those not yet synced) are retried. Retry also fires on the browser `online` event.
- Each record stores the monitor's `display_name` at capture time — renaming a user in Supabase does not affect historical records.

### Three views (tabs)
- **Captura** — main data entry form; two modes: `Cortador` (field cutter checklist) and `Caneca` (solution drum checklist). KPI cards at the top reflect today's local records.
- **Datos** — filterable table of all local records; Excel and PDF export.
- **Historial** — per-cutter historical cards with bar chart.

### Auth
Supabase Auth (email/password). Only two monitor accounts exist: Mayra and Jesús. After login the session is persisted in `localStorage`. The `profiles` table in Supabase stores `display_name` linked to the auth user.

### Supabase project
- Project ID: `youfqaacnalbroqpysrz`, region: `us-east-1`
- Credentials are hardcoded in the `<script>` block inside `index.html`.

### Offline behavior
The service worker (`sw.js`) uses a **cache-first** strategy: serves cached responses immediately and updates the cache in the background. It caches both the app shell and all CDN assets on first install.

## Important constraints

- **Do not add a build tool or bundler** — the single-file architecture is intentional for simplicity and field deployment.
- **Monitors are fixed** — only Mayra and Jesús. The admin panel in "Captura" manages cutters only, not monitors.
- **Data is device-local** — `localStorage` is per-device/browser. Cross-device consolidation requires a Supabase query not yet implemented.
- Icons live in the repo root (not an `icons/` subfolder) despite the README structure diagram.
