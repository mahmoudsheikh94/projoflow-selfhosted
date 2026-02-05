# ProjoFlow Landing Page - Improvement Plan
**Date:** February 5, 2026  
**Current:** TaskFlow Pro branding on projoflow.com  
**Goal:** Rebrand + Add AI-first positioning  

---

## ✅ What's Already Great

**Current strengths:**
- Clean, professional design
- Clear structure (Hero → Features → Pricing → FAQ → CTA)
- Good copy flow
- Strong features section
- Pricing is simple and clear
- Mobile-responsive layout

**Keep these:**
- Overall layout and structure
- Feature icons and grid
- Pricing cards design
- FAQ accordion
- Footer structure

---

## 🔄 Critical Changes (Must Do)

### 1. **REBRAND: TaskFlow Pro → ProjoFlow**

**Everywhere it appears:**
- [ ] Page title (browser tab)
- [ ] Logo (top left, footer)
- [ ] Text mentions (15+ places)
- [ ] Meta tags (SEO)
- [ ] Favicon
- [ ] Email addresses (support@projoflow.com)

**Priority:** URGENT (can't launch with wrong name!)

---

### 2. **Hero Section - Add AI-First Angle**

**Current:**
> "Project management that gets out of your way"
> "Track projects, manage clients, log time, and close deals"

**Improved (Option A - Bold):**
```
Badge: 🤖 Built for agencies that work with AI

H1: The only project manager your AI can control

Subheadline: Built on MCP. Your AI assistant can create projects, manage tasks, and log time — while you focus on what matters. Plus all the features agencies need.

CTA: Start Free — No Card Required
CTA 2: Watch AI Demo (30 sec video)
```

**Improved (Option B - Balanced):**
```
Badge: ⚡ Built for agencies that move fast

H1: Project management that gets out of your way — and works with your AI

Subheadline: The first PM tool with native AI assistant support (MCP). Plus white-label branding, client portals, time tracking, and everything agencies need.

CTA: Start Free — No Card Required
CTA 2: See AI Demo
```

**Recommendation:** Option B (balanced - doesn't alienate non-AI users, but highlights differentiation)

---

### 3. **Add MCP Feature (New Feature Card)**

**Insert as first feature:**
```
Icon: 🤖 (or robot icon)
Title: AI Assistant Integration (MCP)
Description: Your AI assistant can create projects, add tasks, log time, and manage workflows through Model Context Protocol. The future of project management.
```

**Reorder features:**
1. 🤖 AI Assistant Integration (NEW)
2. 🏢 Multi-Tenant Workspaces
3. 👥 Client Portal
4. ⏱️ Time Tracking & Billing
5. 💬 @Mentions & Comments
6. 🎨 White-Label Branding

(Remove "Lead Intake Forms" or move to FAQ)

---

### 4. **Update Social Proof**

**Current:**
> "Trusted by 100+ agencies worldwide"
> Agency One, Studio X, DevShop, PixelCraft

**Improved:**
```
"Used by agencies, consultancies, and dev teams worldwide"
[Remove fake names - we have zero customers yet]
OR
"Launching February 2026 — Join the waitlist"
```

**Recommendation:** Be authentic. Either:
- Remove the social proof section entirely
- Change to: "Join agencies building smarter" (no number claims)
- Add: "Built by Z-Flow team" (real credibility)

---

### 5. **Pricing - Add AI Mention**

**Pro Plan - Add bullet:**
```
✓ AI assistant integration (MCP)
```

**Business Plan - Highlight:**
```
✓ Full AI/MCP integration
✓ API access for custom workflows
```

Keep pricing the same ($29/$79) - it's good.

---

### 6. **FAQ - Add AI Question**

**New FAQ (insert at position 1):**
```
Q: How does AI integration work?
A: ProjoFlow is built on Model Context Protocol (MCP), which lets AI assistants like Claude Code and Cursor directly interact with your projects. Your AI can create tasks, update status, log time, and more — all through natural conversation. No API setup required.
```

**Update existing FAQ:**
- Change all "TaskFlow Pro" → "ProjoFlow"

---

### 7. **CTA Section - Strengthen**

**Current:**
> "Ready to streamline your agency?"

**Improved:**
```
Icon: ✨ (sparkle)
H2: Ready to manage projects like it's 2026?

Subheadline: Join agencies using AI to move faster. Free to start, no credit card required.

CTA: Start Free Today
Small print: 14-day trial on paid plans · AI integration included
```

---

### 8. **Meta Tags & SEO**

**Update these (in HTML head):**
```html
<title>ProjoFlow - Project Management for AI-Powered Agencies</title>
<meta name="description" content="The first PM tool your AI can control. MCP-native project management with white-label branding, client portals, and time tracking for agencies.">
<meta property="og:title" content="ProjoFlow - AI-Powered Project Management">
<meta property="og:description" content="Built on MCP. Your AI assistant can manage projects while you focus on what matters.">
<meta property="og:image" content="https://projoflow.com/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
```

---

## 🎨 Visual Improvements (Nice to Have)

### 1. **Add Demo Video/GIF**
- 30-second screen recording of AI creating a project
- Place in hero section (right side) or features section
- Huge conversion boost

### 2. **Update Hero Image**
- Current: Dashboard mockup (good)
- Add: Small "AI assistant" chat overlay
- Shows the AI integration visually

### 3. **Feature Icons**
- Current icons are good
- Add: Robot icon for AI feature
- Make sure they're consistent

### 4. **Add Trust Badges**
- "Built on Supabase" badge
- "MCP Compatible" badge
- "SOC 2 Compliant" (if applicable)

### 5. **Color Scheme**
- Current: Green/teal (good)
- Consider: Add AI-themed accent color (purple/blue for AI sections)

---

## 📝 Copy Improvements (Throughout)

### Tone Adjustments:
**Before:** "Everything you need"  
**After:** "Built for the future"

**Before:** "Zero complexity"  
**After:** "Simple enough for humans, smart enough for AI"

**Before:** "Choose the plan that fits your agency"  
**After:** "Pick your plan (AI included in all)"

### Remove Corporate Jargon:
- ❌ "superpowers"
- ❌ "effortlessly"
- ✅ Keep it direct and honest

---

## 🚀 Implementation Priority

### Phase 1: URGENT (Before posting tomorrow)
- [ ] Rebrand TaskFlow Pro → ProjoFlow (everywhere)
- [ ] Update logo/favicon
- [ ] Fix email addresses
- [ ] Update meta tags

### Phase 2: HIGH (This week)
- [ ] Update hero section (add AI angle)
- [ ] Add MCP feature card
- [ ] Update social proof (be authentic)
- [ ] Add AI FAQ

### Phase 3: MEDIUM (Next week)
- [ ] Record 30-sec AI demo video
- [ ] Add demo to hero section
- [ ] Update hero image with AI visual
- [ ] Create OG image for social sharing

### Phase 4: POLISH (Ongoing)
- [ ] Copy refinements
- [ ] Trust badges
- [ ] Feature screenshots
- [ ] Customer testimonials (when we have real ones)

---

## 📋 Detailed Rebrand Checklist

**Files to update:**
- [ ] `apps/web/src/app/layout.tsx` (meta tags)
- [ ] `apps/web/src/components/layout/Navbar.tsx` (logo, name)
- [ ] `apps/web/src/app/page.tsx` (landing page copy)
- [ ] `apps/web/public/logo.svg` (replace logo)
- [ ] `apps/web/public/favicon.ico` (replace favicon)
- [ ] `package.json` (name, description)
- [ ] `README.md` (project name)
- [ ] All email templates
- [ ] Footer copyright

**Search & replace:**
- "TaskFlow Pro" → "ProjoFlow" (case-sensitive)
- "taskflow.pro" → "projoflow.com"
- "TaskFlow" → "ProjoFlow"

---

## 💡 Suggested Copy Updates

### Hero Section (Recommended):

```jsx
<div className="badge">
  ⚡ Built for agencies that move fast
</div>

<h1>
  Project management that gets out of your way
  <span className="highlight"> — and works with your AI</span>
</h1>

<p className="subheadline">
  The first PM tool with native AI assistant support. Your AI can create projects, 
  manage tasks, and log time through MCP — while you focus on what matters. 
  Plus white-label branding, client portals, time tracking, and everything agencies need.
</p>

<div className="cta-buttons">
  <Button primary>Start Free — No Card Required</Button>
  <Button secondary>Watch AI Demo (30s)</Button>
</div>
```

### New Feature Card:

```jsx
<FeatureCard
  icon={<BotIcon />}
  title="AI Assistant Integration"
  description="Built on Model Context Protocol (MCP). Your AI assistant can create projects, add tasks, log time, and manage workflows through natural conversation. The future of project management."
  badge="NEW"
/>
```

### Updated Pricing Bullets (Pro Plan):

```jsx
<PricingPlan
  name="Pro"
  price="$29/mo"
  popular={true}
  features={[
    "Unlimited projects",
    "10 team members",
    "AI assistant integration (MCP)", // NEW
    "Client portal",
    "Time tracking & billing",
    "@Mentions & comments",
    "Lead intake forms",
    "Priority email support"
  ]}
/>
```

---

## 🎯 Before/After Comparison

### BEFORE (Current):
- Generic agency PM tool
- No differentiation
- TaskFlow Pro branding
- Fake social proof

### AFTER (Improved):
- AI-first positioning (unique!)
- MCP integration highlighted
- ProjoFlow branding (memorable)
- Authentic messaging
- Clear value prop

---

## 📊 Expected Impact

**With AI positioning:**
- ✅ Stand out from Asana/Monday/ClickUp
- ✅ Appeal to developer/tech-forward agencies
- ✅ Product Hunt differentiation
- ✅ Content marketing angle (AI stories)
- ✅ Press-worthy ("First MCP PM tool")

**Conversion improvements:**
- Hero video: +20-30% conversions (industry standard)
- Clear differentiation: +15-25% conversions
- Social proof authenticity: Better trust (long-term)

---

## 🚀 Mike's Action Plan

**I will do (next 24 hours):**
1. ✅ Create rebrand script (search & replace all files)
2. ✅ Write updated copy for hero/features/FAQ
3. ✅ Design new logo (ProjoFlow wordmark)
4. ✅ Update meta tags + SEO
5. ✅ Create AI demo GIF (from screen recording)

**Mahmoud does:**
1. Record 30-sec AI demo video (optional but powerful)
2. Approve new copy
3. Deploy rebrand

**Timeline:**
- Rebrand: 2-3 hours (Mike)
- Copy updates: 1 hour (Mike writes, Mahmoud approves)
- Deploy: 30 min (Mahmoud)
- **Total: Can be done tonight!**

---

## ✅ Final Recommendations

### Must Do:
1. **Rebrand to ProjoFlow** (URGENT)
2. **Add AI angle to hero** (differentiation)
3. **Add MCP feature card** (show uniqueness)
4. **Fix social proof** (be authentic)

### Should Do:
1. Record AI demo video
2. Update all copy with AI mentions
3. Add AI FAQ
4. Update pricing bullets

### Nice to Have:
1. New logo design
2. Hero image with AI visual
3. Trust badges
4. Feature screenshots

---

**Ready to execute? Give me the green light and I'll start the rebrand!** 🚀

**Estimated time:** 3-4 hours for full rebrand + improvements.

**When can we deploy?** Tonight? Tomorrow morning?

---

**Created by:** Mike  
**Status:** Ready to execute! 🔥
