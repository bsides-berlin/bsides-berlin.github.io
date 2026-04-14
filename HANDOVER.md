# Handover Document
_Last updated: 2026-04-14_

This document summarises all work completed in the current session and the exact steps needed to finish the remaining tasks.

---

## What was completed this session

### 1. CLAUDE.md (merged via PR #8)
A comprehensive AI assistant guide was created at the repo root covering:
- Repository structure and technology stack
- Progressive reveal pattern (sections intentionally commented out)
- Current 2026 speaker roster with image naming conventions
- Known HTML bugs / technical debt
- CSS/JS conventions, vendor library policy
- Deployment model and common pitfalls

### 2. Buy Tickets button (merged via PR #8)
Stripe payment link `https://buy.stripe.com/00geX4dPM8LqgWQ4gh` added in two places:
- **Header navbar** — persistent red `.buy-tickets` pill button (top-right on all scroll positions)
- **Hero section** — solid red CTA button with ticket icon, glow animation, and hover lift

### 3. Stripe invoice webhook — new standalone repo
A reusable Vercel serverless function was written for automatic VAT invoice sending.
- **Repo:** https://github.com/Pisush/stripe-invoice-webhook
- **BSides PR:** bsides-berlin/bsides-berlin.github.io#9 (branch `claude/stripe-invoice-webhook`)
- Files written to `/home/user/stripe-invoice-webhook/` but **not yet pushed** to GitHub (see To-Do below)

---

## What still needs to be done

### Step 1 — Rotate the exposed Stripe key (URGENT)
A live Stripe secret key was accidentally shared in the chat session. It must be rotated immediately:
1. Stripe Dashboard → Developers → API keys → Roll the secret key
2. Use the new key everywhere below

### Step 2 — Push the webhook repo
The files already exist at `/home/user/stripe-invoice-webhook/`. Run:
```bash
cd /home/user/stripe-invoice-webhook
git push -u origin main
```
If starting fresh locally, create the 5 files listed at the bottom of this doc.

### Step 3 — Deploy to Vercel (twice — once per Stripe account)

#### BSides Berlin deployment
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import `Pisush/stripe-invoice-webhook`
3. Framework preset: **Other**
4. Project name: `bsides-invoice-webhook`
5. Add environment variables:
   | Variable | Value |
   |----------|-------|
   | `STRIPE_SECRET_KEY` | BSides Stripe secret key (`sk_live_...`) |
   | `STRIPE_WEBHOOK_SECRET` | Fill in after step 6 |
6. Deploy — note the deployment URL (e.g. `bsides-invoice-webhook.vercel.app`)
7. In BSides Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
   - URL: `https://bsides-invoice-webhook.vercel.app/api/webhook`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`)
8. Paste signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel → **Redeploy**

#### GopherCon EU deployment
Repeat the exact same steps above but:
- Project name: `gophercon-invoice-webhook`
- Use GopherCon's Stripe secret key and webhook signing secret
- Register the webhook URL in the GopherCon Stripe account

### Step 4 — Test each deployment
```bash
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

stripe trigger checkout.session.completed
```
Check Stripe Dashboard → **Billing → Invoices** — you should see a finalized, paid, sent invoice with 19% MwSt applied.

### Step 5 — Merge PR #9 into bsides repo
Once the standalone webhook repo is live, PR #9 (`claude/stripe-invoice-webhook`) in `bsides-berlin/bsides-berlin.github.io` can be **closed without merging** — the `api/webhook.js` in the bsides repo is superseded by the standalone repo.

---

## File contents for the webhook repo

If starting fresh, create these 5 files in `Pisush/stripe-invoice-webhook`:

### `api/webhook.js`
See: https://github.com/bsides-berlin/bsides-berlin.github.io/blob/claude/stripe-invoice-webhook/api/webhook.js

### `package.json`
```json
{
  "name": "stripe-invoice-webhook",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "stripe": "^17.0.0"
  }
}
```

### `vercel.json`
```json
{
  "functions": {
    "api/webhook.js": {
      "memory": 128,
      "maxDuration": 15
    }
  }
}
```

### `.gitignore`
```
node_modules/
.vercel/
.env
.env.local
```

---

## Open PRs

| PR | Repo | Branch | Status |
|----|------|--------|--------|
| #8 | bsides-berlin/bsides-berlin.github.io | `claude/add-claude-documentation-ZSLIS` | Merged |
| #9 | bsides-berlin/bsides-berlin.github.io | `claude/stripe-invoice-webhook` | Open — superseded by standalone repo, close without merging |

---

## Key contacts / accounts
- **GitHub:** github.com/Pisush (Natalie Pistunovich)
- **BSides contact:** contact@bsides.berlin
- **BSides Stripe account:** separate from GopherCon
- **GopherCon Stripe account:** separate from BSides
