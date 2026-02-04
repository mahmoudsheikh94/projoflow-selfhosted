# Deployment Guide

## 🚀 Vercel Deployment

### 1. Domain Configuration

Connect your custom domain to Vercel:

1. In your domain registrar, add a CNAME record:
   ```
   Name: app  (or @ for apex)
   Type: CNAME
   Value: cname.vercel-dns.com
   ```

2. In Vercel Dashboard:
   - Go to project Settings → Domains
   - Add your domain
   - Vercel will auto-provision an SSL certificate

### 2. Environment Variables

Add these to Vercel (Settings → Environment Variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=re_your_resend_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

See `.env.example` for the full list of available variables including branding overrides.

**Note:** Add these to all environments (Production, Preview, Development).

---

## 📧 Supabase Configuration

### 1. Authentication Settings

Go to Supabase Dashboard → Authentication → Providers → Email

**Enable Auto Confirm (Recommended):**
- ✅ **Enable email confirmations** → OFF (auto-confirm enabled)
- This allows invited users to sign up and immediately access the portal
- The invitation token itself validates their email address

### 2. URL Configuration

Go to Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://your-domain.com
```

**Redirect URLs (Add all of these):**
```
https://your-domain.com/portal
https://your-domain.com/portal/invite/*
https://your-domain.com/auth/callback
http://localhost:3000/portal
http://localhost:3000/portal/invite/*
http://localhost:3000/auth/callback
```

**Important:** The wildcard `*` allows dynamic invitation tokens to work.

### Email Templates

Update email templates in Supabase to use your production URL:

1. Go to Authentication → Email Templates
2. Update all templates to use your domain
3. Confirm email template (if enabled):
   ```
   {{ .ConfirmationURL }}
   ```

---

## ✉️ Resend Email Service

### Setup

1. **Verify your sending domain** at https://resend.com/domains
2. **Create API key** at https://resend.com/api-keys
3. **Add to Vercel** environment variables
4. Set `NEXT_PUBLIC_EMAIL_DOMAIN` and `NEXT_PUBLIC_EMAIL_FROM` in your env

---

## ✅ Post-Deployment Checklist

- [ ] Custom domain is connected and SSL is active
- [ ] Environment variables are set in Vercel
- [ ] Supabase redirect URLs are configured
- [ ] Resend API key is working and sending domain is verified
- [ ] Test invitation email flow:
  - [ ] Create invitation
  - [ ] Receive email
  - [ ] Click invitation link
  - [ ] Sign up successfully
  - [ ] Access portal
- [ ] Verify welcome email after signup
- [ ] Confirm branding (name, logo) renders correctly

---

## 🔧 Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials
3. Add Resend API key
4. Run `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

---

## 🐛 Troubleshooting

### Email not sending

1. Check Resend API key is correct in Vercel
2. Verify your sending domain is verified in Resend dashboard
3. Check API route logs: Vercel Functions → Logs

### Invitation link doesn't work

1. Verify Supabase redirect URLs include your domain + `/portal/invite/*`
2. Check token hasn't expired (7 days)
3. Ensure invitation hasn't been accepted already

### "Invalid redirect URL" error

1. Go to Supabase → Authentication → URL Configuration
2. Add the exact URL showing in the error
3. Wait 1-2 minutes for cache to clear

---

## 🔐 Security Notes

- Never commit `.env.local` to git
- Rotate API keys periodically
- Keep Supabase service key secure (not in client-side code)
- Monitor invitation email bounces
