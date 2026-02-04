# Contributing to TaskFlow Pro

Thanks for your interest in contributing! This guide will help you get set up and make your first contribution.

---

## 🛠 Local Development Setup

### Prerequisites

- **Node.js 18+** (20 recommended)
- **npm** (comes with Node.js)
- A **Supabase** project (free tier works fine for development)
- A **Stripe** account (test mode)

### Getting Started

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/taskflow-pro.git
cd taskflow-pro

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# 4. Set up the database
# Run these SQL files in order via Supabase SQL Editor:
#   - supabase/schema.sql
#   - supabase/migrations/20260204_multi_tenant.sql
#   - supabase/migrations/20260204_subscriptions.sql

# 5. Start the dev server
npm run dev

# 6. Open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🏗 Architecture Overview

TaskFlow Pro is built with **Next.js 16** using the **App Router** pattern.

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/            # Admin dashboard (layout group)
│   │   ├── projects/       # Project management pages
│   │   ├── clients/        # Client management
│   │   ├── reports/        # Reports & analytics
│   │   └── settings/       # Workspace settings
│   ├── portal/             # Client-facing portal
│   ├── onboard/            # Public lead intake form
│   ├── setup/              # First-run setup wizard
│   ├── login/              # Authentication
│   └── api/                # API routes
│       ├── admin/          # Admin API endpoints
│       ├── invitations/    # Client invitation endpoints
│       ├── mentions/       # @mention notification endpoints
│       ├── setup/          # Setup wizard endpoints
│       └── stripe/         # Stripe webhook & checkout endpoints
├── components/
│   ├── layout/             # App shell (sidebar, header)
│   ├── project/            # Kanban board, task cards, notes
│   ├── dialogs/            # Modal forms (new project, new task, etc.)
│   ├── portal/             # Client portal components
│   └── ui/                 # shadcn/ui primitives
├── emails/                 # HTML email templates
├── lib/
│   ├── config/             # App & theme configuration (theme.ts)
│   ├── hooks/              # React Query hooks (data fetching)
│   └── supabase/           # Supabase client helpers (browser, server, middleware)
└── types/                  # TypeScript type definitions
```

### Key Patterns

#### Data Fetching — React Query Hooks

All data fetching is done through custom hooks in `src/lib/hooks/`. Each hook uses TanStack React Query for caching, refetching, and optimistic updates.

```typescript
// Example: src/lib/hooks/use-projects.ts
export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId),
  })
}
```

#### Workspace Context

Multi-tenancy is handled via a workspace context. The current workspace ID is resolved from the authenticated user's membership and passed through React context.

#### White-Label Theming

All branding values come from `src/lib/config/theme.ts`, which reads environment variables with fallback defaults. Components import `appConfig` rather than hardcoding brand values.

#### Supabase Clients

- **Browser client** — `src/lib/supabase/client.ts` — Used in client components
- **Server client** — `src/lib/supabase/server.ts` — Used in Server Components and API routes
- **Service client** — Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations (bypasses RLS)

---

## 📝 Code Style

### TypeScript

- **Strict mode** is enabled
- Use explicit types for function parameters and return values
- Prefer interfaces over type aliases for object shapes
- Use `as const` for constant arrays and objects

### Tailwind CSS

- Use Tailwind utility classes directly in JSX
- Prefer `cn()` (from `src/lib/utils.ts`) for conditional classes
- Follow the existing dark mode pattern: `bg-white dark:bg-zinc-900`

### Components

- Use **function components** with named exports
- Colocate component-specific types in the same file
- Follow the existing shadcn/ui patterns for UI primitives
- Use `"use client"` directive only when necessary (interactivity, hooks)

### Naming

- **Files:** kebab-case (`use-projects.ts`, `project-card.tsx`)
- **Components:** PascalCase (`ProjectCard`, `TaskBoard`)
- **Hooks:** camelCase with `use` prefix (`useProjects`, `useTimeEntries`)
- **Types:** PascalCase (`Project`, `TaskComment`)

---

## 🔀 Pull Request Process

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** following the code style above

3. **Test locally:**
   ```bash
   npm run build    # Ensure TypeScript compiles clean
   npm run lint     # Fix any lint issues
   ```

4. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add task priority levels"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation changes
   - `refactor:` — Code refactoring
   - `chore:` — Build/tooling changes

5. **Push** and open a Pull Request against `main`

6. **Describe** what your PR does, why, and how to test it

---

## 🐛 Reporting Issues

- Use GitHub Issues to report bugs or suggest features
- Include steps to reproduce, expected vs actual behaviour, and screenshots if relevant
- Check existing issues first to avoid duplicates

---

## 📄 License

All rights reserved. By contributing, you agree that your contributions will be subject to the project's license.
