# ProjoFlow Deployment Guide

**Complete guide to deploying your self-hosted ProjoFlow instance.**

---

## 📋 Prerequisites

Before you start, you'll need:

- **Node.js 20+** and npm/pnpm/yarn
- **Supabase account** (free tier works fine)
- **Vercel account** (optional, for one-click deploy)
- **GitHub account** (for repo access)
- **Resend account** (optional, for email invitations)

---

## 🚀 Option 1: One-Click Deploy (Vercel)

**Fastest way to get started (5-10 minutes).**

### Step 1: Deploy to Vercel

1. Click the Deploy button in the README or go to:
   ```
   https://vercel.com/new/clone?repository-url=https://github.com/mahmoudsheikh94/projoflow-selfhosted
   ```

2. **Connect GitHub**  
   Authorize Vercel to access your GitHub account.

3. **Create a Git Repository**  
   Vercel will fork the repo to your account (or use the existing one).

4. **Configure Environment Variables** (leave empty for now)  
   We'll add these after setting up Supabase.

5. **Click "Deploy"**  
   Vercel will build the app (this will fail without env vars, but that's OK).

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name:** projoflow (or whatever you want)
   - **Database Password:** (generate a strong one and save it)
   - **Region:** Choose closest to your users
4. Click **Create Project** (takes ~2 minutes)

### Step 3: Run Database Migrations

**Option A: Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Clone your repo locally
git clone https://github.com/your-username/projoflow-selfhosted.git
cd projoflow-selfhosted

# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

**Option B: Manual SQL**

1. In Supabase dashboard, go to **SQL Editor**
2. Open each file in `supabase/migrations/` folder
3. Copy the SQL content
4. Paste and run in SQL Editor
5. Run in order (check timestamps in filenames)

### Step 4: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

### Step 5: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings → Environment Variables**
3. Add these variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   RESEND_API_KEY=re_your_key_here (optional)
   ```

4. Click **Save**

### Step 6: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the three dots (**...**) on the latest deployment
3. Click **Redeploy**
4. Wait for build to complete (~2 minutes)

### Step 7: Run Setup Wizard

1. Visit your deployed URL (e.g., `https://projoflow.vercel.app`)
2. Go to `/setup`
3. Create your admin account
4. Set workspace name and branding
5. Done! 🎉

---

## 🛠️ Option 2: Manual Deployment (Any Platform)

**Works with Railway, Render, or your own servers.**

### Step 1: Clone and Install

```bash
git clone https://github.com/mahmoudsheikh94/projoflow-selfhosted.git
cd projoflow-selfhosted
npm install
```

### Step 2: Set Up Supabase

Follow **Option 1, Step 2-4** above to:
1. Create Supabase project
2. Run migrations
3. Get credentials

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
RESEND_API_KEY=re_your_key_here  # Optional
```

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000/setup` and complete setup wizard.

### Step 5: Build and Deploy

**For Vercel:**
```bash
npx vercel
```

**For Railway:**
1. Create new project in Railway
2. Connect your GitHub repo
3. Add environment variables
4. Deploy

**For Render:**
1. Create new Web Service
2. Connect your GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables

**For Self-Hosted (PM2):**
```bash
npm run build
npm install -g pm2
pm2 start npm --name "projoflow" -- start
pm2 save
pm2 startup
```

---

## 🎨 Post-Deployment: Branding Setup

### 1. Upload Your Logo

1. Log in to your ProjoFlow instance
2. Go to **Settings → Branding**
3. Click **Upload Logo**
4. Select your logo file (PNG/JPG/SVG)
5. Logo will be stored in Supabase Storage and shown in sidebar/login

### 2. Customize Colors

1. Still in **Settings → Branding**
2. Toggle between **Light** and **Dark** theme
3. Customize:
   - Background
   - Foreground
   - Card
   - Primary
   - Secondary
   - Muted
   - Accent
   - Destructive
   - Border

4. Click **Save**
5. Changes apply instantly across all users

### 3. Set Workspace Name

1. In **Settings → General**
2. Update **Workspace Name**
3. This shows in page titles, emails, and client portal

---

## 📧 Email Setup (Optional)

**For client invitation emails, you'll need Resend.**

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 100 emails/day)
3. Verify your domain (or use their test domain)

### 2. Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Copy the key (starts with `re_`)

### 3. Add to Environment Variables

**For Vercel:**
1. Go to project **Settings → Environment Variables**
2. Add `RESEND_API_KEY` with your key
3. Redeploy

**For local/self-hosted:**
1. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_key_here
   ```
2. Restart server

### 4. Test Email

1. Go to **Clients** in ProjoFlow
2. Create a client
3. Invite a user (use your own email to test)
4. Check inbox (and spam folder)

---

## 🤖 MCP Server Setup (AI Integration)

**Enable Claude Code, Cursor, and Cline to control ProjoFlow.**

### 1. Navigate to MCP Server Folder

```bash
cd mcp-server
```

### 2. Follow Setup Instructions

See `mcp-server/README.md` for detailed setup for:
- **Claude Code** (OpenClaw)
- **Cursor**
- **Cline** (VS Code extension)

### 3. Test MCP Integration

Once configured, ask your AI:

```
"Create a task in [Project Name] called 'Test MCP integration'"
```

If it works, your AI will create the task instantly.

---

## 🔒 Security Checklist

### Before Going Live:

- [ ] **Change default admin password** (if you used setup wizard)
- [ ] **Enable 2FA** in Supabase (Settings → Auth)
- [ ] **Set up custom domain** (optional, but recommended)
- [ ] **Configure CORS** in Supabase (if using API directly)
- [ ] **Review RLS policies** (they're pre-configured, but double-check)
- [ ] **Set up backups** (Supabase auto-backups on paid plans)
- [ ] **Add environment variables** for production (never commit .env files)

### Recommended:

- Use **Vercel's preview deployments** for staging
- Test branding changes in preview before merging to main
- Keep local `.env.local` out of git (it's in .gitignore already)

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error:** `Missing environment variables`

**Fix:**
1. Go to Vercel project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy

---

### Database Migration Errors

**Error:** `relation "workspaces" already exists`

**Fix:**
Migrations were already run. Skip to next step.

**Error:** `permission denied for schema public`

**Fix:**
You're using the wrong Supabase key. Use the **service role key** (Settings → API) only for migrations, not in env vars.

---

### Setup Wizard Not Loading

**Error:** `redirect to /dashboard`

**Fix:**
You're already logged in. Visit `/setup` in an incognito window or log out first.

---

### Logo Upload Not Working

**Error:** `Storage bucket not found`

**Fix:**
1. In Supabase, go to **Storage**
2. Create a bucket called `brand-assets`
3. Set it to **Public**
4. Try uploading again

---

### Emails Not Sending

**Error:** `Resend API error`

**Fix:**
1. Check `RESEND_API_KEY` is set correctly
2. Verify your domain in Resend dashboard
3. Check Resend logs for errors

---

## 📊 Monitoring & Updates

### Check for Updates

ProjoFlow updates are pushed to the GitHub repo.

**To update:**

```bash
git pull origin main
npm install
npm run build
# Redeploy (or let Vercel auto-deploy)
```

### Database Migrations on Update

If we add new features with database changes:

1. Check `supabase/migrations/` for new files
2. Run new migrations via Supabase CLI or SQL Editor
3. Redeploy app

---

## 🆘 Support

### First 100 Licenses

Email support included: **support@projoflow.com**

### After License #100

- **Docs:** This guide + README
- **Community:** Discord (link in license email)
- **Source Code:** You have it — hire developers if needed

---

## 🎯 Post-Launch Checklist

Once deployed:

- [ ] Test user signup/login
- [ ] Create a test project
- [ ] Invite a test client
- [ ] Upload your logo
- [ ] Customize colors
- [ ] Test MCP integration (if using)
- [ ] Send test email invitation
- [ ] Check mobile responsiveness
- [ ] Bookmark your admin panel

---

**Need help?** Email us: support@projoflow.com

**Built with ❤️ for agencies who value ownership.**
