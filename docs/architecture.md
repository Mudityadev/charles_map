# Architecture

## Overview
- **Frontend**: Next.js 16 App Router with React Server Components for data fetching and client components for interactive map tools.
- **State**: Zustand store per project for client-side map context, TanStack Query for server mutations and caching.
- **Mapping stack**: MapLibre GL JS, MapLibre Draw, deck.gl overlays, Turf.js for geoprocessing, Proj4 for reprojection.
- **Backend**: Prisma ORM against PostgreSQL + PostGIS with Next.js route handlers. Server actions wrap writes for project/layer APIs.
- **Jobs**: BullMQ queues (IMPORT, EXPORT, AI) processed by Node workers under `/workers/*`.
- **Realtime**: Socket.IO (stubbed) to support collaboration features; wiring occurs in `/lib/jobs` and future `/app/api/socket` handlers.
- **Feature flags**: Unleash client is proxied via `lib/flags/server.ts` with tier defaults.
- **Observability**: Sentry SDK integration placeholder via `@sentry/nextjs` and OpenTelemetry endpoint configuration via env.

## RSC boundaries
- `/app/(dashboard)` and `/app/(editor)` pages are server components that call Prisma.
- Map interaction components under `components/map/*` are client components to keep deck.gl/MapLibre on the browser.
- Server actions live alongside server utilities in `lib/db/clientActions.ts` and `lib/db/projects.ts`.

## Jobs lifecycle
1. UI calls `/api/import`, `/api/export`, or `/api/ai`.
2. Handler enqueues a BullMQ job with org/user metadata.
3. Worker in `/workers` processes the task, writing to storage (stubbed) and updating results.
4. Clients poll job status (API placeholder) and deliver notifications.

## Feature gating
- `lib/flags/server.ts` merges tier defaults with DB-driven overrides.
- API handlers verify tier before running heavy tasks and return `402` for upsell flows.
- UI components render CTAs when `flags.features` lacks required capability.

## Data access controls
- `requireUser()` ensures calls are scoped to the user's org.
- Prisma queries filter by `orgId`.
- Audit logs capture style, telemetry, and admin operations.

## Future work
- Implement realtime collaboration channel, offline tile export, analytics processors, and AI integrations.
- Harden RBAC with role-specific middleware and integrate Unleash SDK for runtime toggles.
