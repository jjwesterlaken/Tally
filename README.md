# Tally — financial planner

Budgeting, bills, investments and net worth — on your own or together with a partner.
Runs as a web app on any computer, installs on phones as a PWA, and deploys as a static site.

**Local-first & freemium.** The whole core app works offline on-device with no account:
a guided setup asks what you earn and spend and builds your budget in seconds. It's free,
supported by ads. **Premium** (a subscription) unlocks bank linking, PayTo autopay,
cross-device sync and couples sharing, and removes ads. See GO-LIVE.md §8 to wire real
billing (RevenueCat for mobile, Stripe for web) and ads (AdMob/AdSense).

Built for the Australian context (AUD, Consumer Data Right, PayTo, ASX), but currency and
providers are configurable.

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). Create an account on the welcome
screen and you're in. By default Tally runs in **local mode** — your account and data live in
that browser, no setup required.

To make a production build:

```bash
npm run build      # outputs to ./dist
npm run preview    # serve the build locally to check it
```

## 2. Put it on your phone

While `npm run dev` is running, it also serves on your local network. Find your computer's
IP (e.g. `192.168.1.20`) and on your phone — connected to the **same Wi-Fi** — open
`http://192.168.1.20:5173`. In the browser menu choose **Add to Home Screen**; Tally installs
as a standalone app (it's a PWA, so it keeps working offline after the first load).

For a permanent install that works anywhere (not just your Wi-Fi), deploy it (next step) and
add the live URL to your home screen.

## 3. Deploy it (so any device can use it)

The build is a static site, so any static host works. Easiest options:

- **Vercel / Netlify:** point them at this folder. Build command `npm run build`, output
  directory `dist`. Done.
- **GitHub Pages / Cloudflare Pages / any static host:** upload the contents of `dist/`.

After deploying, open the URL on any computer or phone and add it to the home screen.

## 4. Turn on a real backend (cloud accounts + Google/Apple sign-in)

Local mode is great for trying Tally, but accounts are device-local and two people
can't truly share across devices. For real accounts, Google/Apple sign-in and live
couples sync you have two options:

- **AWS (recommended for production):** Amazon Cognito for auth (incl. Google + Apple)
  and DynamoDB for data. The backend is already defined in `amplify/`. Full
  step-by-step is in **GO-LIVE.md**. In short: `npx ampx sandbox`, copy the generated
  `amplify_outputs.json` into `public/`, and set `VITE_BACKEND=aws` in `.env`.
- **Supabase (fastest alternative):** create a project, run `supabase/schema.sql`,
  set `VITE_BACKEND=supabase` and the URL/anon key in `.env`.

The email, **Continue with Google** and **Continue with Apple** buttons are already
wired; they light up once you configure the provider credentials (see GO-LIVE.md).

## 5. Couples / household linking

Tally models couples as two buckets: a **personal** bucket (just you) and a **shared**
household bucket (joint accounts, joint budget, shared bills, shared goals). You keep your
private money private and opt specific things into the shared view.

- Go to **Connections → Partner & household** and create a household.
- In cloud mode you get an **invite code**; your partner signs up on their own device and
  enters the code to join the same household.
- Once linked, a **scope switch** appears in the top bar: **Just me / Shared / Combined**.
  Combined merges both for a full household picture; net worth and goals roll up across both.
- When adding a category, bill, holding or goal, you choose whether it's personal or shared.

(In local mode there's no second device to sync with, so linking attaches a demo partner with
sample joint data so you can explore the combined view.)

## 6. Connecting real banks, bills and investments

The **Connections** tab has three integrations. In this build they're simulated so you can see
the flows; each is built to hand authentication to the user's *own* bank/broker app — Tally
never sees a password. To go live in Australia:

- **Bank data (read-only):** Consumer Data Right / Open Banking, via an accredited provider
  such as **Basiq** or **Frollo**. CDR is read-only — it can't move money. Replace
  `integrationAdapters.connectBank` in `src/integrations.js`.
- **Bill autopay (debits):** **PayTo** mandates, where the customer approves the agreement
  inside their banking app. Integrate via **Stripe, Adyen, GoCardless or Monoova**. Replace
  `integrationAdapters.createPayToMandate`.
- **Investments:** read-only holdings sync via a portfolio aggregator (**Sharesight** or
  **SnapTrade**, which connect CommSec, Selfwealth, Stake, Pearler, etc.) plus a market-data
  feed for prices (e.g. **EODHD** for ASX). Replace `integrationAdapters.connectInvestments`.

Going live with CDR and PayTo involves accreditation/registration and compliance work — plan
for that before flipping these on. Consent tokens and any fetched bank data must be handled
server-side under CDR rules, never bundled into the client.

## 7. Native iOS / Android apps

The code is split into layers so the move to React Native + Expo is mostly a re-skin:
`src/lib.js`, `src/state.js`, `src/backend.js` and `src/integrations.js` (the data, logic and
adapters) port largely unchanged; you rebuild the presentation layer (`*.jsx` views) with
React Native components and a navigation library. The integration adapters are the main place
that differs (native SDKs / deep links for the bank and PayTo consent screens).

## Project structure

```
src/
  main.jsx          entry + service-worker registration
  App.jsx           auth gate, app shell, scope switch, persistence
  views.jsx         Overview, Budget, Bills, Investments, Goals, Net worth, Connections
  ui.jsx            shared components, modal forms, login screen
  state.js          reducer + scope-aware selectors + derived metrics
  backend.js        auth + persistence (local mode + Supabase cloud mode)
  integrations.js   bank / PayTo / investment adapter stubs
  lib.js            helpers + seed data
  styles.js         stylesheet
public/             PWA manifest, icon, service worker
supabase/schema.sql cloud database tables + row-level security
```

## A note

Tally is a tracking and planning tool, not financial advice, and not a licensed financial
product. The simulated connections are for demonstration. Get appropriate advice before
relying on it for decisions, and before integrating regulated data/payment rails.
