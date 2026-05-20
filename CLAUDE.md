# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (Vite)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # Run ESLint across the codebase
npm run preview    # Preview production build locally
```

No test runner is configured in this project.

## Architecture

**FinPloit Dashboard** — a personal finance management SPA built with React 19, TypeScript, Vite, and Tailwind CSS 4.

### Directory structure

```
src/
├── pages/               # Route-level pages
│   ├── AuthPages/       # SignIn, SignUp, ResetPassword, 2FA (OTP)
│   ├── FInance/         # FinancePage.tsx — main dashboard with 6 tabs
│   └── OtherPage/       # NotFound, Success
├── components/
│   ├── ui/              # Base UI primitives (buttons, cards, modals, tabs, dropdowns, etc.)
│   ├── finance-metrics/ # Domain components (dashboards, charts, goals, shopping, recurring, categories)
│   ├── auth/            # Auth forms
│   ├── protected-route/ # Wraps routes requiring auth
│   └── public-route/    # Wraps routes requiring no auth
├── layout/              # AppLayout, Sidebar, Header, Backdrop
├── context/             # Global state via React Context API
│   ├── AuthContext.tsx  # User/token state + login/logout/register methods + useAuth hook
│   ├── ThemeContext.tsx  # Dark/light theme
│   └── SidebarContext.tsx
├── hooks/               # Domain hooks (useFinance, useGoals, useRecurringFinance, useShopping, useFinanceCategory, useUserProfile, useModal)
├── services/
│   ├── http.ts          # HttpClient class — Axios wrapper with auth interceptors
│   └── api.ts           # Configured HttpClient instance (import this, not http.ts directly)
├── types/               # TypeScript interfaces (user.ts, finance.ts, api.ts)
├── schemas/             # Zod validation schemas
└── icons/               # SVG icons imported as React components via vite-plugin-svgr
```

### Data flow pattern

Pages/components → custom domain hooks (`hooks/`) → `services/api.ts` (HttpClient) → backend API

Global state (auth, theme, sidebar) lives in `context/` and is consumed via the exported hooks (`useAuth`, `useTheme`, `useSidebar`).

### HTTP client

`HttpClient` in `src/services/http.ts` wraps Axios with:
- Automatic `Authorization: Bearer <token>` header injection
- Token refresh / logout on 401/403
- Response envelope unwrapping — the backend returns `{ success, message, data }`; the client extracts `.data` automatically

Always import from `src/services/api.ts` (the configured instance), not `http.ts` directly.

### Key tech

| Concern | Library |
|---|---|
| Routing | React Router 7 |
| Forms | React Hook Form + Zod |
| Charts | ApexCharts + react-apexcharts |
| Auth | Custom JWT + Google OAuth (`@react-oauth/google`) |
| Notifications | Sonner (toasts) |
| Calendar | FullCalendar 6 |
| Drag & Drop | react-dnd 16 |
| Date utilities | date-fns + flatpickr |
| Icons | FontAwesome 7 + custom SVGs |

### SVG icons

SVGs in `src/icons/` are transformed to React components by `vite-plugin-svgr`. Import them as `import IconName from '../icons/icon-name.svg?react'`.
