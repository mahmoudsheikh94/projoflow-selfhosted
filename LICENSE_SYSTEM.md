# ProjoFlow License System

**Multi-platform license management system for ProjoFlow Self-Hosted.**

Works with: Gumroad, LemonSqueezy, Stripe, AppSumo, or any payment platform.

---

## 🔧 Setup (One-Time)

### 1. Run Database Migration

The `licenses` table is created automatically when you run migrations during setup.

If you need to run it manually:
```sql
-- Run the migration file: supabase/migrations/20260205231400_licenses_table.sql
```

### 2. Set Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```env
# Required for manual license generation
ADMIN_SECRET=your_secure_random_string_here

# Required for webhooks to work
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: For webhook signature verification
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Get ADMIN_SECRET:**
```bash
openssl rand -hex 32
```

**Get SUPABASE_SERVICE_ROLE_KEY:**
- Supabase Dashboard → Settings → API → `service_role` (secret key)

---

## 🎯 Usage

### Option 1: Automatic (Webhooks)

**For Gumroad:**
1. Create product on Gumroad
2. Go to: Settings → Advanced → Ping URL
3. Add: `https://your-domain.com/api/webhooks/gumroad`
4. When customer buys → webhook fires → license auto-generated

**For LemonSqueezy:**
1. Create product on LemonSqueezy
2. Go to: Settings → Webhooks → Add endpoint
3. URL: `https://your-domain.com/api/webhooks/lemonsqueezy`
4. Events: `order_created`
5. When customer buys → webhook fires → license auto-generated

**For Stripe:**
1. Create product/price in Stripe
2. Go to: Developers → Webhooks → Add endpoint
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Events: `checkout.session.completed`
5. When customer pays → webhook fires → license auto-generated

---

### Option 2: Manual (For AppSumo, etc.)

**Generate a license manually:**

```bash
curl -X POST https://your-domain.com/api/admin/license/generate \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseEmail": "customer@example.com",
    "purchasePlatform": "appsumo",
    "purchaseId": "appsumo_abc123",
    "productName": "ProjoFlow Self-Hosted",
    "maxActivations": 999
  }'
```

**Response:**
```json
{
  "success": true,
  "license": {
    "key": "PJ-ABC123-DEF456-GHI789",
    "email": "customer@example.com",
    "platform": "appsumo",
    "createdAt": "2026-02-05T23:00:00Z"
  }
}
```

**Then send the license key to the customer via email.**

---

## 🔍 License Validation

Licenses are validated during ProjoFlow setup (Step 2: Enter License Key).

**How it works:**
1. Customer enters license key
2. App calls `/api/license/validate`
3. Checks database for matching key
4. Verifies status is "active"
5. Checks expiration date (if set)
6. If valid → setup continues

**License format:**
```
PJ-XXXXXX-XXXXXX-XXXXXX
```
- PJ = ProjoFlow prefix
- 6 alphanumeric characters per segment
- Excludes confusing chars (0, O, I, 1)

---

## 📊 License Management

### View All Licenses

Query Supabase directly:
```sql
SELECT 
  license_key,
  purchase_email,
  purchase_platform,
  status,
  activation_count,
  created_at
FROM licenses
ORDER BY created_at DESC;
```

### Revoke a License

```sql
UPDATE licenses
SET status = 'revoked', revoked_at = NOW()
WHERE license_key = 'PJ-XXXXXX-XXXXXX-XXXXXX';
```

### Check Activation Count

```sql
SELECT license_key, activation_count, max_activations
FROM licenses
WHERE purchase_email = 'customer@example.com';
```

---

## 🔐 Security

### License Table RLS Policies

- **Public (anon) can:** Read active licenses (for validation)
- **Service role can:** Insert/update/delete licenses (via API)
- **Authenticated users:** No access (licenses are server-side only)

### Admin API Protection

`/api/admin/license/generate` requires:
- `Authorization: Bearer YOUR_ADMIN_SECRET` header
- Keep ADMIN_SECRET secret (never commit to git)

### Webhook Signature Verification

LemonSqueezy and Stripe webhooks verify signatures (when secrets are set).  
Gumroad doesn't have signature verification (use HTTPS only).

---

## 🎁 License Features

### Current Settings (Per License):

- **max_activations:** 999 (unlimited)
- **expires_at:** NULL (lifetime)
- **status:** active, revoked, expired

### Future Features (Optional):

**Enable activation limits:**
```sql
-- Uncomment in /api/license/validate/route.ts
if (license.activation_count >= license.max_activations) {
  return error('Activation limit reached')
}

await supabase.rpc('increment_license_activation', { p_license_key: cleanKey })
```

**Set expiration date:**
```sql
UPDATE licenses
SET expires_at = NOW() + INTERVAL '1 year'
WHERE license_key = 'PJ-XXXXXX-XXXXXX-XXXXXX';
```

---

## 🧪 Testing

### 1. Generate Test License

```bash
curl -X POST http://localhost:3000/api/admin/license/generate \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseEmail": "test@example.com",
    "purchasePlatform": "manual"
  }'
```

### 2. Validate License

```bash
curl -X POST http://localhost:3000/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "PJ-ABC123-DEF456-GHI789"
  }'
```

### 3. Test in Setup Wizard

1. Visit `/setup`
2. Enter generated license key
3. Should show: "License Verified!"

---

## 📧 Email Integration (Optional)

**Send license keys via email after generation:**

Add to webhook handlers:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'ProjoFlow <noreply@projoflow.com>',
  to: email,
  subject: 'Your ProjoFlow License Key',
  html: `
    <h1>Welcome to ProjoFlow!</h1>
    <p>Your license key: <strong>${licenseKey}</strong></p>
    <p>Get started: https://github.com/mahmoudsheikh94/projoflow-selfhosted</p>
  `,
})
```

---

## 🚨 Troubleshooting

**"Unauthorized. Invalid admin secret."**
- Check ADMIN_SECRET in environment variables
- Ensure Authorization header format: `Bearer YOUR_SECRET`

**"Database not configured"**
- Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Add SUPABASE_SERVICE_ROLE_KEY

**"Failed to generate license key"**
- Run database migrations (licenses table + functions)
- Check Supabase logs for errors

**Webhook not firing**
- Check webhook URL is publicly accessible (use ngrok for local testing)
- Check platform webhook logs (Gumroad, LemonSqueezy, Stripe dashboards)
- Verify webhook secret (if using signature verification)

---

## 📊 Analytics

**Track license sales:**
```sql
SELECT 
  purchase_platform,
  COUNT(*) as total_licenses,
  COUNT(DISTINCT purchase_email) as unique_customers
FROM licenses
WHERE status = 'active'
GROUP BY purchase_platform;
```

**Active licenses by date:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as licenses_generated
FROM licenses
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Need help?** Contact support@projoflow.com
