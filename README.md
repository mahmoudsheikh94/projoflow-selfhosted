# TaskFlow Pro

**White-label project management for agencies and teams.**

TaskFlow Pro is a modern, self-hosted project management tool built for agencies that want to manage client work, track time, and give clients a branded portal — all from one place. Ship it under your own brand with zero code changes.

---

## ✨ Features

- **Kanban Board** — Drag-and-drop task management with custom columns
- **Client Portal** — Give clients a dedicated login to see project progress
- **Time Tracking** — Log hours per task, generate reports, set hourly rates
- **Lead Intake** — Shareable onboarding forms that feed your pipeline
- **Client Invitations** — One-click email invites with auto-provisioned accounts
- **Task Comments & @Mentions** — Threaded comments with real-time notifications
- **Reports & Dashboard** — At-a-glance metrics for revenue, utilisation, and status
- **White-Label Theming** — Swap name, logo, colours, and emails via env vars
- **Dark Mode** — Beautiful dark UI built with Tailwind CSS

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres + Auth + Realtime) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | TanStack React Query + Zustand |
| Email | Resend |
| Drag & Drop | dnd-kit |
| Language | TypeScript |

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/mahmoudsheikh94/taskflow-pro.git
cd taskflow-pro
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=re_...
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🎨 White-Label / Theming

Every branding touchpoint reads from environment variables with sensible defaults. Override what you need:

```env
NEXT_PUBLIC_APP_NAME="My Agency PM"
NEXT_PUBLIC_APP_TAGLINE="Ship projects faster"
NEXT_PUBLIC_APP_LOGO="/my-logo.svg"
NEXT_PUBLIC_PRIMARY_COLOR="#6366f1"
NEXT_PUBLIC_ACCENT_COLOR="#4f46e5"
NEXT_PUBLIC_APP_URL=https://pm.myagency.com
NEXT_PUBLIC_SUPPORT_EMAIL=help@myagency.com
NEXT_PUBLIC_EMAIL_FROM="My Agency <no-reply@myagency.com>"
NEXT_PUBLIC_EMAIL_DOMAIN=myagency.com
```

Theme config lives in `src/lib/config/theme.ts`. All UI components, emails, and metadata consume these values — no find-and-replace required.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (admin)/         # Admin dashboard (projects, clients, reports…)
│   ├── portal/          # Client-facing portal
│   ├── onboard/         # Lead intake form
│   ├── api/             # API routes (email, notifications)
│   └── login/           # Admin login
├── components/          # React components
│   ├── layout/          # Sidebar, header
│   ├── project/         # Kanban board, tasks, notes
│   ├── dialogs/         # Modal forms
│   ├── portal/          # Client portal components
│   └── ui/              # shadcn/ui primitives
├── emails/              # HTML email templates
├── lib/
│   ├── config/          # Theme & app configuration
│   ├── hooks/           # React Query hooks
│   └── supabase/        # Supabase client helpers
└── types/               # TypeScript type definitions
```

## 🗄 Database

TaskFlow Pro uses Supabase with row-level security. Migrations live in `supabase/migrations/`. See `supabase/schema.sql` for the full schema.

## 📬 Email

Transactional email is sent via [Resend](https://resend.com). Templates in `src/emails/` use mustache-style `{{VARIABLE}}` placeholders that are replaced at send time. See `src/emails/README.md` for details.

## 🚢 Deployment

Deploy anywhere Next.js runs — Vercel, Railway, Docker, etc.

1. Set all env vars from `.env.example`
2. `npm run build && npm start`

See `DEPLOYMENT.md` for a detailed Vercel + custom domain walkthrough.

## 📄 License

All rights reserved. Contact for licensing.
