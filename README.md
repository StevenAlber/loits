# LOITS — v1.0 prototype

> A digital oracle. Type a decision. Watch your body answer.

---

## What this is

A working web app that:
- Uses your real device camera
- Detects your face with Google MediaPipe (468 landmarks)
- Reads your real heart rate from skin tone fluctuations (rPPG)
- Flashes one of two choices for exactly 150ms
- Tracks your involuntary eye blink, mouth asymmetry, and BPM elevation in the 400ms window after the flash
- Generates a verdict based on those signals

**This is the first cut.** Single HTML file. No backend yet. Stripe paywall is wired but routes to `alert()` — you replace with real Stripe Checkout links.

---

## How to deploy in 10 minutes

### Option A: GitHub Pages (free, instant)

1. Create new repo on GitHub called `loits` (or anything)
2. Upload `index.html` to the repo root
3. Go to Settings → Pages → Source → `main` branch → root
4. Wait 1 minute → your site is live at `https://<your-username>.github.io/loits/`

### Option B: Cloudflare Pages or Netlify drop

1. Drag the folder to https://app.netlify.com/drop OR https://pages.cloudflare.com
2. Done. You get a URL instantly.

### Option C: Connect your domain (loits.app)

1. Buy `loits.app` on Gandi or Namecheap (check availability first)
2. Point DNS A/CNAME to your Pages host
3. Set the custom domain in your hosting dashboard

---

## What works right now (real, not fake)

- ✅ Camera access (mobile + desktop)
- ✅ MediaPipe Face Landmarker (real Google AI, 468 points)
- ✅ rPPG heart rate detection from forehead skin (green channel detrending + zero-crossing frequency estimation)
- ✅ Real-time pulse graph
- ✅ 8-second baseline calibration
- ✅ Flash timing — 150ms ± frame drift
- ✅ Eye blink detection via MediaPipe blendshapes
- ✅ Mouth asymmetry tracking
- ✅ Heuristic-based verdict logic
- ✅ Replay screen with annotated overlays
- ✅ Industrial-clinical visual design (JetBrains Mono + Fraunces serif)
- ✅ Mobile-responsive
- ✅ Disclaimer + ethical framing

---

## What's not connected yet (you wire these)

### 1. Stripe paywall

Replace the two `alert()` calls in `index.html` near `Unlock 5 readings` and `€14.99 — Lifetime unlimited`:

```js
// Replace:
onclick="alert('Payment integration...')"
// With:
onclick="window.location='https://buy.stripe.com/YOUR_LINK_HERE'"
```

In Stripe dashboard (you already have KRYONIS account):
- Create new Product: **Loits — 5 Readings**, €4.99 one-time
- Create new Product: **Loits — Lifetime**, €14.99 one-time
- Get the Payment Link URLs and paste them in

### 2. Tracking who paid

For v1: use Stripe's success_url to redirect back to `?paid=5` or `?paid=lifetime`. Read it with JS and set `localStorage.readingsLeft = 5`. Decrement on each new reading. This is not bulletproof, but it works for the test phase.

For v2: real backend (Cloudflare Workers + KV, or Supabase) to verify Stripe sessions server-side.

### 3. Video export ("Subconscious Receipt")

The replay screen currently shows the camera live. To create a *shareable MP4*:
- Use `MediaRecorder` API to record the video element + canvas overlay
- Compose them into a single canvas, record that
- Export as `.webm`, optionally re-encode via ffmpeg-wasm

This is the second-biggest viral driver after the verdict itself. Build it in week 2.

### 4. Real GPT-4o verdict copy

Currently verdicts are template strings. To make them feel uncanny and specific to the user's typed dilemma:
- Send the dilemma + measurements to Claude/GPT-4o API
- Get back a verdict in the requested tone (clinical, mystical, blunt)
- Replace `generateVerdict()` text rendering with API response

Use Claude API directly. Cost per verdict: ~$0.002. Margin remains ~99%.

---

## Known issues + risks

1. **Low light**: rPPG fails in dim rooms. The system falls back to a default 72 BPM. Either constrain the use case to "do this in good light" or just be honest about it.
2. **Android Chrome**: camera latency varies wildly. Test on at least 3 Android devices.
3. **iOS Safari**: `playsinline` works, but PWA installation needs proper manifest. Add `manifest.json` + service worker before App Store-equivalent install prompt.
4. **Apple App Store**: when you later wrap this in Capacitor for App Store submission, expect review pushback on "lie detector" language. Frame strictly as "self-reflection art" — don't ever claim diagnostic accuracy.
5. **AI hallucination of verdicts**: the heuristic mixes real signal with semi-random fallback when signal is weak. This is by design (oracle theater), but you must always show the disclaimer prominently.

---

## The honest disclosure

Loits is **70% real measurement + 30% interpretive theater**. This is documented in the disclaimer text. The real measurements are heart rate, blink, asymmetry. The theater is the leap from "your blink was at 180ms" → "your body wants the other choice." That leap is not science.

The ethical posture: this is an art object and a self-reflection rite, not a diagnostic instrument. The verdict is a mirror with edges, not a fact. People who use it knowing this get a real experience. People who use it believing it's medical-grade get a placebo experience that might still be useful — but they may overestimate certainty.

Always keep the disclaimer visible. Never market with words like "scientifically proven" or "lie detector".

---

## File structure

```
loits/
├── index.html       # Everything — UI, logic, styles
└── README.md        # This file
```

That's it. No build step. No npm install. Open `index.html` in any modern browser (Chrome / Safari / Firefox / Edge) and grant camera permission.

---

## Next 3 steps (when you're ready)

1. Test it. Send the link to 10 friends. Ask if it gave them a chill. If yes → keep going. If no → kill the project.
2. Hook up Stripe. Make sure the paywall actually charges money.
3. Build the "Subconscious Receipt" MP4 export. This is the viral driver.

After that — Capacitor wrapper, App Store submission, real backend, real API verdicts, multi-language.

---

Built in one session. No external dependencies beyond MediaPipe (loaded from CDN) and Google Fonts.

Loits v1 / Build 0001 / 2026
