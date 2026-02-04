# TaskFlow Pro

**White-label project management for agencies and teams.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS&envDescription=Required%20environment%20variables%20for%20TaskFlow%20Pro.%20See%20DEPLOYMENT.md%20for%20details.&envLink=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro%2Fblob%2Fmain%2FDEPLOYMENT.md&project-name=taskflow-pro&repository-name=taskflow-pro)

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
- **Multi-Tenant Workspaces** — Isolated workspaces with invite-based team management
- **Subscription Billing** — Stripe-powered Pro and Business plans with usage limits
- **White-Label Theming** — Swap name, logo, colours, and emails via env vars
- **Dark Mode** — Beautiful dark UI built with Tailwind CSS
- **Setup Wizard** — First-visit guided setup for workspace creation

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres + Auth + Realtime) |
| Payments | Stripe (Subscriptions + Webhooks) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | TanStack React Query + Zustand |
| Email | Resend |
| Drag & Drop | dnd-kit |
| Language | TypeScript |

---

## 🚀 One-Click Deploy

The fastest way to get your own TaskFlow Pro instance running.

### Step 1 — Deploy to Vercel

Click the button below to clone this repo and deploy it to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS&envDescription=Required%20environment%20variables%20for%20TaskFlow%20Pro.%20See%20DEPLOYMENT.md%20for%20details.&envLink=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro%2Fblob%2Fmain%2FDEPLOYMENT.md&project-name=taskflow-pro&repository-name=taskflow-pro)

Vercel will prompt you for the required environment variables. Don't worry — follow the steps below to get them.

### Step 2 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** from Settings → API (keep this secret!)

### Step 3 — Set Up the Database

Run these SQL files in order using Supabase's **SQL Editor** (Dashboard → SQL Editor → New query):

1. **Base schema** — [`supabase/schema.sql`](supabase/schema.sql) — Creates all tables, RLS policies, and functions
2. **Multi-tenant migration** — [`supabase/migrations/20260204_multi_tenant.sql`](supabase/migrations/20260204_multi_tenant.sql) — Adds workspace isolation and team management
3. **Subscriptions migration** — [`supabase/migrations/20260204_subscriptions.sql`](supabase/migrations/20260204_subscriptions.sql) — Adds Stripe subscription tracking

> **Tip:** Copy each file's contents, paste into the SQL Editor, and click **Run**.

### Step 4 — Set Up Stripe

1. Create a [Stripe account](https://stripe.com) (or use an existing one)
2. Create two Products in Stripe Dashboard → Products:
   - **Pro Plan** — e.g. $29/month. Copy the Price ID (`price_...`)
   - **Business Plan** — e.g. $79/month. Copy the Price ID (`price_...`)
3. Create a webhook endpoint:
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Webhook Signing Secret** (`whsec_...`)

### Step 5 — Add Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro plan |
| `STRIPE_PRICE_BUSINESS` | Stripe Price ID for the Business plan |

**Optional variables** (for branding, email, notifications):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Custom app name (default: "TaskFlow Pro") |
| `NEXT_PUBLIC_APP_TAGLINE` | Custom tagline |
| `NEXT_PUBLIC_APP_LOGO` | Path to custom logo |
| `NEXT_PUBLIC_APP_URL` | Your app's canonical URL |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for notifications |

> See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the complete environment variable reference.

### Step 6 — Visit Your App

1. Redeploy on Vercel (if you added env vars after the initial deploy)
2. Visit your app URL
3. The **Setup Wizard** will run on first visit — follow it to create your workspace
4. You're live! 🎉

---

## 🛠 Local Development

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

Fill in your Supabase and Stripe credentials. See [`.env.example`](.env.example) for all available variables.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

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

---

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (admin)/         # Admin dashboard (projects, clients, reports…)
│   ├── portal/          # Client-facing portal
│   ├── onboard/         # Lead intake form
│   ├── setup/           # First-run setup wizard
│   ├── api/             # API routes (email, stripe, notifications)
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

TaskFlow Pro uses Supabase with row-level security. The base schema is in `supabase/schema.sql` and migrations live in `supabase/migrations/`.

## 📬 Email

Transactional email is sent via [Resend](https://resend.com). Templates in `src/emails/` use mustache-style `{{VARIABLE}}` placeholders that are replaced at send time. See `src/emails/README.md` for details.

## 🚢 Deployment

Deploy anywhere Next.js runs — Vercel (recommended), Railway, Docker, or any Node.js host.

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed guides covering:
- ✅ Vercel (recommended, one-click deploy)
- 🚂 Railway (alternative PaaS)
- 🐳 Docker / self-hosted
- 📋 Complete environment variable reference
- 🎨 White-labeling guide
- 🔄 Update / redeploy process

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## 📄 License

All rights reserved. Contact for licensing.
