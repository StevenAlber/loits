# LOITS — Setup Guide

A digital oracle. Type a decision. Watch your body answer.

This guide gets the **payment system + AI analysis** live.

---

## Quick Status

The app works **right now** without any setup — it shows the new paywall structure and uses **offline template analyses** as fallback. But to turn on real payments + real AI:

1. Create 4 Stripe Payment Links (10 minutes)
2. Deploy 1 Cloudflare Worker (15 minutes)
3. Replace 5 URLs in `index.html` and re-upload to GitHub

That's it. After that you have a working business.

---

## Pricing Tiers (already in code)

| Tier | Price | What user gets |
|------|-------|----------------|
| Free | €0 | 1 reading, no AI analysis |
| Basic | €4.99 | 5 readings, no AI |
| Premium one-shot | €9.99 | 1 reading **with AI analysis** |
| Monthly | €49/month | Unlimited readings + AI |
| Annual | €299/year | Unlimited readings + AI |

All credits stored in user's browser (localStorage). When user clears browser data, credits reset. This is acceptable for v1 — we can add backend account system later if needed.

---

## STEP 1 — Stripe Payment Links

Go to https://dashboard.stripe.com/payment-links → **+ New**

Create FOUR Payment Links. For each one, set the **Success URL** to redirect back with a parameter.

### Link 1 — Basic Pack
- Product name: `Loits — 5 Readings`
- Price: `€4.99` (one-time)
- Success URL: `https://loits.app?paid=BASIC5`
- Cancel URL: `https://loits.app`
- Copy the resulting link (e.g. `https://buy.stripe.com/abc123`)

### Link 2 — Premium One-Shot
- Product name: `Loits — Premium Reading (1)`
- Price: `€9.99` (one-time)
- Success URL: `https://loits.app?paid=PREMIUM1`
- Copy the link

### Link 3 — Monthly Subscription
- Product name: `Loits — Unlimited Monthly`
- Price: `€49.00` (recurring, monthly)
- Success URL: `https://loits.app?paid=MONTHLY`
- Copy the link

### Link 4 — Annual Subscription
- Product name: `Loits — Unlimited Annual`
- Price: `€299.00` (recurring, yearly)
- Success URL: `https://loits.app?paid=ANNUAL`
- Copy the link

### Paste links into `index.html`

Find the `STRIPE_LINKS` object near the top of the `<script>` block:

```js
const STRIPE_LINKS = {
  basic5: 'https://buy.stripe.com/REPLACE_BASIC_5_PACK',
  premium_oneshot: 'https://buy.stripe.com/REPLACE_PREMIUM_ONESHOT',
  monthly: 'https://buy.stripe.com/REPLACE_MONTHLY',
  annual: 'https://buy.stripe.com/REPLACE_ANNUAL'
};
```

Replace each `REPLACE_...` with the actual Stripe Payment Link URL.

---

## STEP 2 — Cloudflare Worker (for AI analysis)

The Anthropic API key cannot be in the public HTML (anyone could read it). We use Cloudflare Workers as a free, secure proxy.

### 2a. Get an Anthropic API key
1. Go to https://console.anthropic.com
2. Sign in / create account
3. Settings → API Keys → Create Key
4. Copy the key (starts with `sk-ant-...`). You will not see it again.

### 2b. Add credit to Anthropic
1. Anthropic console → Plans & Billing
2. Add €10 starter credit. This buys ~500–1000 AI analyses.

### 2c. Deploy the Worker

1. Go to https://dash.cloudflare.com
2. Sign in / create free account
3. Left sidebar → **Workers & Pages** → **Create application** → **Create Worker**
4. Name it `loits-ai` (or any name). Click **Deploy**.
5. After deploy, click **Edit code**
6. Delete the default code completely
7. Open `cloudflare-worker.js` from this repo and copy its entire contents
8. Paste into the Cloudflare editor
9. Click **Save and deploy**

### 2d. Add the API key as environment variable

1. In the Worker dashboard → **Settings** → **Variables**
2. Under "Environment Variables" → **+ Add variable**
3. Variable name: `ANTHROPIC_API_KEY`
4. Value: paste your `sk-ant-...` key
5. **Click "Encrypt"** before saving (so it's secret)
6. **Save** → **Deploy**

### 2e. Copy the Worker URL

In the Worker dashboard, find the URL — looks like:
```
https://loits-ai.YOUR-SUBDOMAIN.workers.dev
```

Copy it.

### 2f. Paste into `index.html`

Find this line near the top of the script:

```js
const AI_WORKER_URL = 'https://loits-ai.YOUR_SUBDOMAIN.workers.dev';
```

Replace with your actual Worker URL.

---

## STEP 3 — Update GitHub & Deploy

1. Go to https://github.com/StevenAlber/loits
2. Click `index.html` → pencil icon
3. `Cmd+A` to select all → delete
4. Open updated `index.html` → `Cmd+A` → copy entire contents
5. Paste into GitHub
6. Click **Commit changes**
7. Wait 1-2 minutes
8. Hard refresh `loits.app` (Cmd+Shift+R or close & reopen browser)

---

## Testing the flow

### Test 1 — Free reading (works without any setup)
- Open `loits.app` in private/incognito window (so no localStorage)
- Run a reading
- After verdict, you should see the new tiered paywall
- No AI analysis below verdict (only after payment)

### Test 2 — Premium one-shot (requires Stripe + Worker)
- Click "Unlock This Analysis €9.99"
- Complete Stripe checkout (use test card 4242 4242 4242 4242 in test mode)
- You'll be redirected back to `loits.app?paid=PREMIUM1`
- You should see alert: "Payment confirmed"
- Now run a reading → AI analysis appears below verdict

### Test 3 — Monthly subscription
- Click `€49 / month`
- Complete Stripe checkout
- Returned to `loits.app?paid=MONTHLY`
- All future readings include AI analysis until 30 days pass

---

## Architecture summary

```
User's phone (loits.app)
    │
    ├─ Camera + MediaPipe (all on device)
    ├─ Local biometric analysis (all on device)
    ├─ Verdict (all on device)
    │
    └─ If user has AI tier:
          → POST to Cloudflare Worker
                → Worker calls Claude API with hidden key
                → Returns personalized analysis text
                → Displayed below verdict

Payments:
    User clicks "Unlock" → Stripe Payment Link
        → User pays
        → Stripe redirects to loits.app?paid=TYPE
        → App stores credit in localStorage
```

---

## Cost estimates

| Item | Cost |
|------|------|
| Cloudflare Worker | **Free** (100k req/day on free tier) |
| Anthropic API per analysis | ~€0.01–0.03 |
| Stripe fee per €4.99 transaction | ~€0.30 → user pays €4.99, you get ~€4.69 |
| Stripe fee per €49 transaction | ~€1.50 → you get ~€47.50 |
| Stripe fee per €299 transaction | ~€8 → you get ~€291 |

A monthly subscriber generating 30 AI readings/month costs you ~€0.60 in AI. You make ~€47. **97% margin.**

---

## Where things live

- `index.html` — the entire app (HTML + CSS + JS in one file)
- `cloudflare-worker.js` — the Worker code for proxying Claude API
- `README.md` — this file

No build step. No backend server. Everything is either client-side or serverless.

---

## What's left for "v2"

Things we did **not** build for v1 (intentionally — ship now, improve later):

- Backend user accounts (currently credits are per-browser via localStorage)
- Subscription renewal handling (currently expiry just checked locally; Stripe webhook would be more robust)
- Audio version of the AI analysis (for €299 tier later)
- Social sharing "subconscious receipt" image generator
- iOS Capacitor wrap for App Store

These are great v2 features but not blockers for launch.

---

## Tomorrow morning checklist

- [ ] Create 4 Stripe Payment Links
- [ ] Paste their URLs into `index.html`
- [ ] Deploy Cloudflare Worker
- [ ] Add `ANTHROPIC_API_KEY` env var
- [ ] Paste Worker URL into `index.html`
- [ ] Commit to GitHub
- [ ] Wait for deploy
- [ ] Test one flow end-to-end
- [ ] Launch
