# Replit Agent Guide

## Overview

This is a **badminton doubles scorekeeping application** — a full-stack web app for tracking badminton doubles matches. Users set up two teams of two players each, configure the winning score, optionally do a coin toss to determine first serve, and then track the match with a visual court display showing player positions, serving/receiving indicators, and a live scoreboard. Match results are saved to a PostgreSQL database.

The UI includes Vietnamese language labels alongside English, suggesting the primary audience is Vietnamese-speaking badminton players.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React SPA)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with two main routes: `/` (Home/setup) and `/match` (active game)
- **State Management**: React Query (`@tanstack/react-query`) for server state; local React `useState` for game state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS
- **Animations**: Framer Motion for court animations, player position transitions, and score changes
- **Effects**: canvas-confetti for match win celebrations and coin toss results
- **Game Logic**: Custom hook `useGameLogic` manages scoring, server hand tracking (1st/2nd server), player court positions (left/right swaps), undo functionality, and win detection
- **Match data is passed between pages via URL query parameters** (stateless approach — no global store needed)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (Express + Node.js)
- **Framework**: Express.js running on Node with TypeScript (executed via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Route definitions**: Shared route contract in `shared/routes.ts` using Zod schemas — both client and server reference the same type-safe API definitions
- **Development**: Vite dev server runs as middleware for HMR; in production, static files are served from `dist/public`
- **Build**: Custom build script using esbuild for server bundling and Vite for client bundling

### Database
- **Database**: PostgreSQL (required — `DATABASE_URL` env var must be set)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (in `shared/schema.ts`):
  - `players` table: id, name (unique), totalMatches, wins
  - `matches` table: id, team player names (4 text fields), scores for each team, winningScore, winnerTeam, date
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Storage layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class using Drizzle queries

### Shared Code (`shared/` directory)
- `schema.ts` — Drizzle table definitions, Zod insert schemas, TypeScript types
- `routes.ts` — API route contract with paths, methods, input schemas, and response schemas. This is the single source of truth for the API shape, used by both server route handlers and client hooks.

### Key Design Decisions
1. **Shared API contract**: The `shared/routes.ts` file defines API routes with Zod validation schemas used by both client and server, ensuring type safety across the stack without code generation
2. **URL-based state passing**: Match configuration (player names, winning score, first server) is passed via URL query params from Home to Match page, keeping things simple and stateless
3. **Game logic in a custom hook**: All badminton scoring rules (server rotation, hand tracking, position swaps, win conditions) are encapsulated in `useGameLogic` hook
4. **On-conflict upsert for players**: Creating a player uses `onConflictDoUpdate` to handle duplicate names gracefully
5. **Referee-Manager tournament access**: Referees connected to a Manager (via `manager_connections` table) automatically see that Manager's tournaments. Referees can click directly on pending matches to start them — no manual referee assignment required. The referee is auto-assigned when they start a match. Duplicate match start is prevented server-side.

## External Dependencies

### Required Services
- **PostgreSQL Database**: Must be provisioned with `DATABASE_URL` environment variable set. Used for storing players and match history.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express**: HTTP server framework
- **zod** + **drizzle-zod**: Schema validation (shared between client and server)
- **@tanstack/react-query**: Async server state management on client
- **framer-motion**: Animation library for court and score transitions
- **canvas-confetti**: Confetti effects on match wins and coin toss
- **wouter**: Lightweight client-side routing
- **shadcn/ui components**: Full suite of Radix-based UI components (dialog, select, tabs, toast, etc.)
- **connect-pg-simple**: PostgreSQL session store (available but sessions not currently used for auth)
- **tailwindcss**: Utility-first CSS framework with custom purple/white sports theme