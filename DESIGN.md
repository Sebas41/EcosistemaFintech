# Design Decisions

## Architecture

Monorepo with two workspaces (`apps/api`, `apps/web`) sharing TypeScript, tooling,
and CI/CD. Chosen to reduce friction between frontend and backend while keeping
types and tooling consistent in a single repository.

## Stack Choices

- **Express 5**: lightweight, well-known, sufficient for the API scope.
- **Prisma 6**: type-safe ORM with migrations, supports both PostgreSQL and SQLite.
- **PostgreSQL / SQLite**: PostgreSQL for production / CI (transactional integrity,
  relational constraints); SQLite for local dev without Docker.
- **React 18 + Vite 8**: fast HMR, modern build tooling.
- **Tailwind CSS 4**: utility-first CSS with `@theme` tokens for consistent palette.
- **Recharts 2**: composable React chart library for bar, pie, and horizontal bar charts.
- **Lucide React**: consistent icon set.
- **JWT httpOnly cookies**: session management without localStorage XSS risk.
- **bcryptjs**: password hashing.
- **Zod**: runtime request validation.

## UI Design

- **Color palette**: blue, indigo, purple accents on neutral gray background — modern
  fintech look. Defined as CSS `@theme` tokens, no hardcoded raw hex values.
- **Layout**: fixed dark sidebar (gradient `#0f172a` → `#1e1b4b`) + glassmorphism navbar
  + scrollable content area with `pl-64` offset.
- **Cards**: white with `rounded-2xl`, subtle borders (`border-indigo-100/50`), hover
  shadows.
- **Forms**: modal-based for create/edit operations; gradient buttons with matching
  shadow.
- **Responsiveness**: grid layouts adapt from single column to 2-3 columns.

## Data Flow

1. Auth: login → server sets httpOnly JWT cookie → client reads user from `/api/auth/me`.
2. All subsequent API calls include credentials (`credentials: "include"`).
3. Server validates JWT, extracts `userId`, and scopes all queries by owner.
4. Budget alerts computed server-side on expense creation; returned alongside transaction.
5. Categories with spent amounts computed via `/api/categories/status` (aggregates
   current month expenses per category with usage percentage).
