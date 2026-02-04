# Deployment Guide

Complete guide to deploying your own TaskFlow Pro instance.

---

## Table of Contents

- [Vercel Deployment (Recommended)](#-vercel-deployment-recommended)
- [Railway Deployment](#-railway-deployment)
- [Self-Hosted / Docker](#-self-hosted--docker)
- [Environment Variables Reference](#-environment-variables-reference)
- [Supabase Setup](#-supabase-setup)
- [Stripe Setup](#-stripe-setup)
- [White-Labeling](#-white-labeling)
- [Updating](#-updating)
- [Troubleshooting](#-troubleshooting)
- [Security Notes](#-security-notes)

---

## 🚀 Vercel Deployment (Recommended)

Vercel is the recommended deployment platform — it's what Next.js is built for.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_PRO,STRIPE_PRICE_BUSINESS&envDescription=Required%20environment%20variables%20for%20TaskFlow%20Pro.%20See%20DEPLOYMENT.md%20for%20details.&envLink=https%3A%2F%2Fgithub.com%2Fmahmoudsheikh94%2Ftaskflow-pro%2Fblob%2Fmain%2FDEPLOYMENT.md&project-name=taskflow-pro&repository-name=taskflow-pro)

### Manual Vercel Setup

If you prefer to set up manually:

1. **Fork or clone** the repository to your GitHub account
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set the **Framework Preset** to `Next.js` (should be auto-detected)
5. Add environment variables (see [Environment Variables Reference](#-environment-variables-reference))
6. Click **Deploy**

### Custom Domain

1. In your domain registrar, add a CNAME record:
   ```
   Name: app  (or @ for apex domain)
   Type: CNAME
   Value: cname.vercel-dns.com
   ```
2. In Vercel Dashboard → project Settings → Domains:
   - Add your domain
   - Vercel will auto-provision an SSL certificate
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain
4. Update Supabase redirect URLs (see [Supabase Setup](#-supabase-setup))

---

## 🚂 Railway Deployment

[Railway](https://railway.app) is a great alternative to Vercel with simple pricing.

### Steps

1. Create a Railway account at [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Connect your GitHub and select the taskflow-pro repository
4. Railway will auto-detect it as a Node.js project
5. Add environment variables in the **Variables** tab (see [Environment Variables Reference](#-environment-variables-reference))
6. Set the **Start Command** to:
   ```bash
   npm run build && npm start
   ```
7. Railway will assign a `*.up.railway.app` URL. Optionally add a custom domain.

### Notes

- Railway charges based on resource usage (CPU, memory, bandwidth)
- You may need to set `PORT=3000` or Railway will assign a random port
- The build step runs automatically on each push

---

## 🐳 Self-Hosted / Docker

You can self-host TaskFlow Pro on any machine that runs Node.js 18+ or Docker.

### Using Docker Compose

A basic `docker-compose.yml` is included in the repository. It runs the Next.js application and reads environment variables from a `.env` file.

```bash
# 1. Clone the repository
git clone https://github.com/mahmoudsheikh94/taskflow-pro.git
cd taskflow-pro

# 2. Create your environment file
cp .env.example .env
# Edit .env with your actual values

# 3. Build and start
docker compose up -d --build

# 4. Open http://localhost:3000
```

> **Note:** The Docker Compose setup assumes Supabase is hosted externally (e.g., [supabase.com](https://supabase.com)). The compose file does **not** include a local Supabase instance.

### Without Docker

```bash
# 1. Clone & install
git clone https://github.com/mahmoudsheikh94/taskflow-pro.git
cd taskflow-pro
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with your actual values

# 3. Build & run
npm run build
npm start
```

The app runs on port 3000 by default. Use a reverse proxy (nginx, Caddy) for SSL termination and custom domains.

### Custom Dockerfile

If you need more control, you can create a custom `Dockerfile`. The standard Next.js standalone output mode works well:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📋 Environment Variables Reference

Complete list of all environment variables. Required variables must be set for the app to function.

### Required

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL | `https://abcdefg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public API key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key (server-side only, never expose to client) | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_SECRET_KEY` | ✅ Yes | Stripe secret key (server-side only) | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_PRO` | ✅ Yes | Stripe Price ID for the Pro plan | `price_1ABC...` |
| `STRIPE_PRICE_BUSINESS` | ✅ Yes | Stripe Price ID for the Business plan | `price_1DEF...` |

### Optional — Email

| Variable | Required | Description | Example |
|---|---|---|---|
| `RESEND_API_KEY` | Optional | [Resend](https://resend.com) API key for transactional email (invitations, notifications) | `re_123abc...` |

### Optional — Branding / White-Label

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Optional | Application display name (sidebar, login, emails) | `My Agency PM` |
| `NEXT_PUBLIC_APP_TAGLINE` | Optional | One-liner tagline shown on marketing pages | `Ship projects faster` |
| `NEXT_PUBLIC_APP_LOGO` | Optional | Path to logo image (relative to `/public` or absolute URL) | `/my-logo.svg` |
| `NEXT_PUBLIC_APP_URL` | Optional | Canonical app URL (no trailing slash) | `https://pm.myagency.com` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Optional | Primary brand colour (hex) | `#6366f1` |
| `NEXT_PUBLIC_ACCENT_COLOR` | Optional | Secondary accent colour (hex) | `#4f46e5` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional | Support email shown to users | `help@myagency.com` |
| `NEXT_PUBLIC_EMAIL_FROM` | Optional | "From" address for transactional email | `My Agency <no-reply@myagency.com>` |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | Optional | Domain used for sending email | `myagency.com` |

### Optional — Notifications

| Variable | Required | Description | Example |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token for admin notifications | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID` | Optional | Telegram chat ID to receive notifications | `-1001234567890` |

---

## 🗄 Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**
3. Choose an organization, name your project, and set a database password
4. Select a region close to your users
5. Click **Create new project** and wait for provisioning (~2 minutes)

### 2. Get Your API Keys

1. Go to **Settings → API** in the Supabase Dashboard
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The service role key has **full access** to your database. Never expose it in client-side code.

### 3. Run the Database Schema

Open the **SQL Editor** in Supabase Dashboard (left sidebar → SQL Editor → New query).

Run these SQL files **in order**:

1. **Base schema** — Copy the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates all core tables (projects, clients, tasks, time entries, etc.), RLS policies, and database functions.

2. **Multi-tenant migration** — Copy the contents of [`supabase/migrations/20260204_multi_tenant.sql`](supabase/migrations/20260204_multi_tenant.sql) and run it. This adds workspace isolation, team membership, and invite-based access.

3. **Subscriptions migration** — Copy the contents of [`supabase/migrations/20260204_subscriptions.sql`](supabase/migrations/20260204_subscriptions.sql) and run it. This adds Stripe subscription tracking (plans, status, limits).

> **Important:** Run them in the order listed above. Each migration builds on the previous one.

### 4. Configure Authentication

Go to **Authentication → Providers → Email** in Supabase Dashboard:

- **Enable Auto Confirm** (Recommended): Set "Enable email confirmations" → **OFF**
  - This allows invited users to sign up and immediately access the portal
  - The invitation token itself validates their email address

### 5. Configure Redirect URLs

Go to **Authentication → URL Configuration**:

**Site URL:**
```
https://your-app-url.vercel.app
```

**Redirect URLs** (add all of these):
```
https://your-app-url.vercel.app/portal
https://your-app-url.vercel.app/portal/invite/*
https://your-app-url.vercel.app/auth/callback
http://localhost:3000/portal
http://localhost:3000/portal/invite/*
http://localhost:3000/auth/callback
```

> The wildcard `*` allows dynamic invitation tokens to work correctly.

---

## 💳 Stripe Setup

### 1. Create Stripe Products

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Products** → **Add product**
3. Create two products:

   **Pro Plan:**
   - Name: `Pro`
   - Pricing: Recurring, e.g. $29/month
   - Click **Save product**
   - Copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_PRO`

   **Business Plan:**
   - Name: `Business`
   - Pricing: Recurring, e.g. $79/month
   - Click **Save product**
   - Copy the **Price ID** → `STRIPE_PRICE_BUSINESS`

### 2. Get API Keys

1. Go to **Developers → API keys**
2. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### 3. Create Webhook Endpoint

1. Go to **Developers → Webhooks → Add endpoint**
2. Set the endpoint URL to:
   ```
   https://your-app-url.vercel.app/api/stripe/webhook
   ```
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Test Mode vs Live Mode

- Use **test mode** keys (`pk_test_`, `sk_test_`) during development
- Switch to **live mode** keys (`pk_live_`, `sk_live_`) when you're ready to accept real payments
- You'll need separate webhook endpoints for test and live modes

---

## 🎨 White-Labeling

TaskFlow Pro is built from the ground up for white-labeling. Every customer-facing brand element is controlled via environment variables.

### What You Can Customize

| Element | Variable | Default |
|---|---|---|
| App name | `NEXT_PUBLIC_APP_NAME` | TaskFlow Pro |
| Tagline | `NEXT_PUBLIC_APP_TAGLINE` | Project management that gets out of your way |
| Logo | `NEXT_PUBLIC_APP_LOGO` | `/logo.svg` |
| Primary colour | `NEXT_PUBLIC_PRIMARY_COLOR` | `#10b981` (emerald) |
| Accent colour | `NEXT_PUBLIC_ACCENT_COLOR` | `#059669` |
| Support email | `NEXT_PUBLIC_SUPPORT_EMAIL` | support@taskflow.pro |
| Email "From" | `NEXT_PUBLIC_EMAIL_FROM` | TaskFlow Pro \<no-reply@taskflow.pro\> |
| Email domain | `NEXT_PUBLIC_EMAIL_DOMAIN` | taskflow.pro |

### How It Works

All branding values are defined in `src/lib/config/theme.ts` with environment variable overrides. Every UI component, email template, and metadata tag consumes these values — no code changes required.

### Custom Logo

1. Add your logo file to the `public/` directory (e.g., `public/my-logo.svg`)
2. Set `NEXT_PUBLIC_APP_LOGO=/my-logo.svg`
3. Redeploy

### Custom Domain + Branding Example

```env
NEXT_PUBLIC_APP_NAME="Acme Projects"
NEXT_PUBLIC_APP_TAGLINE="Manage client work effortlessly"
NEXT_PUBLIC_APP_LOGO="/acme-logo.svg"
NEXT_PUBLIC_PRIMARY_COLOR="#3b82f6"
NEXT_PUBLIC_ACCENT_COLOR="#2563eb"
NEXT_PUBLIC_APP_URL=https://projects.acme.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@acme.com
NEXT_PUBLIC_EMAIL_FROM="Acme Projects <no-reply@acme.com>"
NEXT_PUBLIC_EMAIL_DOMAIN=acme.com
```

---

## 🔄 Updating

### Vercel (automatic)

If you deployed via the Deploy button, Vercel created a Git repository in your GitHub account. To update:

1. Add the upstream remote (one-time):
   ```bash
   git remote add upstream https://github.com/mahmoudsheikh94/taskflow-pro.git
   ```
2. Pull latest changes:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```
3. Resolve any conflicts and push:
   ```bash
   git push origin main
   ```
4. Vercel will automatically redeploy on push.

### Railway

Same Git-based workflow. Push to your repository and Railway redeploys automatically.

### Docker / Self-Hosted

```bash
git pull origin main
docker compose up -d --build
```

Or without Docker:
```bash
git pull origin main
npm install
npm run build
npm start   # or restart your process manager (pm2, systemd, etc.)
```

### Database Migrations

When updating, check the `supabase/migrations/` directory for any new migration files. Run them in order via the Supabase SQL Editor.

---

## 🐛 Troubleshooting

### Build fails on Vercel

- **Missing env vars:** Make sure all required environment variables are set. Go to Vercel → Settings → Environment Variables.
- **TypeScript errors:** Run `npm run build` locally to see the exact error. Fix and push.

### "Invalid API key" errors

- Double-check your Supabase anon key and URL — they must match the project you set up the schema in.
- Make sure you're not mixing up the **anon key** and the **service role key**.

### Stripe webhook not working

- Verify the webhook URL is correct: `https://your-domain.com/api/stripe/webhook`
- Make sure the webhook is set to **active** (not disabled)
- Check that the correct events are selected
- In Stripe Dashboard → Webhooks, check the **Logs** tab for delivery attempts

### Email not sending

1. Check your `RESEND_API_KEY` is correct
2. Verify your sending domain is verified in the [Resend dashboard](https://resend.com/domains)
3. Check Vercel function logs for errors

### Invitation link doesn't work

1. Verify Supabase redirect URLs include your domain + `/portal/invite/*`
2. Check the invitation token hasn't expired (7 days default)
3. Ensure the invitation hasn't already been accepted

### "Invalid redirect URL" error

1. Go to Supabase → Authentication → URL Configuration
2. Add the exact URL showing in the error to the Redirect URLs list
3. Wait 1-2 minutes for the cache to clear

### Setup wizard doesn't appear

- The setup wizard runs automatically when no workspace exists for the logged-in user
- Make sure you've run all three SQL scripts (schema + both migrations)
- Check the browser console for errors

### White-label changes not showing

- Branding variables prefixed with `NEXT_PUBLIC_` are embedded at **build time**
- After changing them, you must **redeploy** (Vercel does this automatically when you update env vars and redeploy)

---

## 🔐 Security Notes

- Never commit `.env.local` or `.env` files to Git
- The `SUPABASE_SERVICE_ROLE_KEY` has full database access — keep it server-side only
- The `STRIPE_SECRET_KEY` can create charges — never expose it to the client
- Rotate API keys periodically
- Enable Row Level Security (RLS) on all Supabase tables — the schema does this by default
- Monitor Stripe webhook delivery and Supabase auth logs
- Set up Supabase [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits) for production
