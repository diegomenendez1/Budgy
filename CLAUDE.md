# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
npm run test:e2e     # Playwright E2E tests (mobile viewport 390x844)
npm run test:e2e:ui  # Playwright in interactive UI mode
```

## Architecture

**Budgy** is a mobile-first personal finance SPA built with React 19 + Vite + TypeScript. All data is local-first — stored in IndexedDB via Dexie, with auth in localStorage. Supabase is installed but not yet active.

### State & Data Flow

Three React Contexts provide global state:
- **AuthContext** — session management via localStorage (`budgy_session`, `budgy_users`)
- **FinanceContext** — all finance data, computed metrics, CRUD operations. Delegates to custom hooks (`useTransactionManager`, `useRecurringManager`, `useCycleManager`) that read/write Dexie tables
- **ThemeContext** — dark/light mode

Data flows: Components → Context hooks → Custom hooks → Dexie (IndexedDB). All records are scoped by `owner_id` using a stable local user ID.

### Dexie Database Schema (src/db/db.ts)

Tables: `transactions`, `recurringItems`, `cycles`, `userSettings`, `chatSessions`, `chatMessages`. A migration function (`migrateFromLocalStorage`) moves legacy localStorage data to Dexie on first run.

### Business Logic

`src/lib/financeLogic.ts` contains pure calculation functions (cycle metrics, weekly breakdowns, daily spending targets). FinanceContext calls these to compute derived values like `cycleMetrics` and `weeklyBreakdown`.

### AI Integration

- `src/services/aiService.ts` — direct OpenAI fetch calls (gpt-4o-mini) for financial analysis and NLP transaction parsing
- `src/services/coachService.ts` — AI coach conversation logic
- API key is stored per-user in Dexie `userSettings`, not in env vars

### Routing (src/App.tsx)

React Router with `PrivateRoute`/`PublicRoute` guards. Routes: `/welcome`, `/login`, `/register`, `/onboarding`, `/dashboard`. Auth guards are currently bypassed for development (dummy session auto-login).

### Key Domain Concepts

- **Cycle** — a budget period (start/end dates, initial budget, savings goal). Only one active at a time.
- **Transaction** — individual income/expense with date, category, optional `isExceptional` flag
- **RecurringItem** — fixed charges (rent, subscriptions). Supports installments (`isInstallment`, `totalInstallments`, `startDate`)
- **CycleMetrics** — derived calculations: remaining budget, daily target, overspending status, weekly breakdowns

## Styling

Tailwind CSS 3.4 with CSS variable theming (HSL). Dark mode supported. Mobile-first design targeting iPhone dimensions with safe area insets. Path alias: `@/` maps to `src/`.

## Language

The app UI and the `directivas/` SOP documents are in Spanish.
