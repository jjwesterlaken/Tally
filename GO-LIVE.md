# Tally — going live (AWS, real sign-in, real connections, app stores)

This is the "you supply the rest" guide. It's organised so you can see, up front,
which parts are **code (done / ready)** and which parts are **accounts, credentials
and accreditation** that only you can obtain.

---

## What's real now vs what you supply

| Capability | In the code | What you must supply to switch it on |
|---|---|---|
| Email / password sign-in | ✅ wired (AWS Cognito + Supabase + local) | An AWS or Supabase project |
| Google sign-in button | ✅ wired (`signInWithRedirect`) | Google Cloud OAuth client ID/secret |
| Apple sign-in button | ✅ wired | Apple Developer account ($99/yr) + Service ID & key |
| Cross-device accounts + couples sync | ✅ wired (Cognito + DynamoDB) | Deployed AWS backend |
| Database | ✅ schema + adapter ready | Your AWS account (free tier is fine to start) |
| Installable on phones (no store) | ✅ PWA, works today | Just deploy the web app |
| Native App Store / Play Store apps | ✅ Capacitor configured | Apple ($99/yr) + Google Play ($25) dev accounts, a Mac for iOS, store review |
| Bank data (read) | ✅ secure flow + example Lambda | CDR accreditation or an aggregator contract (Basiq/Frollo) + keys |
| Bill autopay (PayTo) | ✅ secure flow | Merchant agreement with Stripe/Adyen/GoCardless/Monoova |
| Investment sync | ✅ secure flow | SnapTrade/Sharesight + market-data API keys |

The honest summary: **all the software is written and wired.** What remains is
registering accounts and (for the financial rails) passing the providers'
onboarding/accreditation. No code can shortcut those — they're legal/contractual.

---

## 0. Accounts you'll likely need

- **AWS account** (database, auth, hosting). Free tier covers early usage.
- **Google Cloud** project (for Google sign-in) — free.
- **Apple Developer Program** ($99/yr) — for Apple sign-in *and* the iOS App Store.
- **Google Play Console** ($25 one-off) — for the Play Store.
- **A domain name** (recommended) for the hosted web app and OAuth redirect URLs.
- For live financial data: **Basiq or Frollo** (bank/CDR), a **PayTo provider**, and
  **SnapTrade/Sharesight + a market-data feed** (investments). See §6.

---

## 1. Stand up the database + auth on AWS (Amplify Gen 2 + Cognito)

The project already contains the backend definition in `amplify/`
(`auth/resource.ts`, `data/resource.ts`, `backend.ts`).

```bash
# from the project root, install Amplify tooling and the CLI
npm install
npm install -D @aws-amplify/backend @aws-amplify/backend-cli

# log in to AWS once (creates a local AWS profile)
npx ampx configure profile

# spin up a personal cloud sandbox that watches amplify/ and deploys it
npx ampx sandbox
```

When the sandbox finishes it writes **`amplify_outputs.json`** to the project root.
Copy that file into **`public/`** so the app can load it at runtime:

```bash
cp amplify_outputs.json public/amplify_outputs.json
```

Then point the app at AWS — in `.env`:

```
VITE_BACKEND=aws
```

Run `npm run dev` and create an account. That's real Cognito auth backed by DynamoDB,
syncing across every device you log into. For production you connect this Amplify
backend to your Git branch in the Amplify console so it deploys on every push.

> Security note: the `Household` model currently allows any signed-in user to read/write
> (so an invited partner can join via code). Before launch, tighten it to a members-based
> rule or a custom resolver — there's a comment in `amplify/data/resource.ts`.

## 2. Turn on Google sign-in

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**
   (Web application).
2. Authorised redirect URI: your Cognito domain + `/oauth2/idpresponse`
   (the sandbox/console shows your user-pool domain).
3. Copy the **client ID** and **client secret**, then store them as Amplify secrets:
   ```bash
   npx ampx sandbox secret set GOOGLE_CLIENT_ID
   npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
   ```
4. Redeploy. The "Continue with Google" button now works.

## 3. Turn on Apple sign-in

1. In your **Apple Developer** account: create an **App ID**, a **Services ID**
   (this is the client ID), and a **Sign in with Apple key** (.p8) — note the Key ID
   and your Team ID.
2. Add your Cognito domain callback (`/oauth2/idpresponse`) to the Services ID config.
3. Store the secrets:
   ```bash
   npx ampx sandbox secret set APPLE_CLIENT_ID      # the Services ID
   npx ampx sandbox secret set APPLE_TEAM_ID
   npx ampx sandbox secret set APPLE_KEY_ID
   npx ampx sandbox secret set APPLE_PRIVATE_KEY    # contents of the .p8 file
   ```
4. Redeploy. "Continue with Apple" now works. (Apple sign-in is also *required* by
   App Store rules if you offer any other social login in an iOS app.)

Remember to add your real domain and the native scheme `au.com.tally.app://` to
`callbackUrls`/`logoutUrls` in `amplify/auth/resource.ts`.

## 4. Deploy the web app (the "click an icon" experience)

Easiest is **AWS Amplify Hosting** (same console): connect your repo, it builds with
`npm run build` and serves `dist/`. Or use any static host (Netlify, Cloudflare Pages,
S3 + CloudFront). Once it's live at `https://yourdomain`, users open it and choose
**Add to Home Screen** — it installs as an app icon (it's a PWA) with no app store and
no code for them to run. This already satisfies most of "download and it just works".

## 5. Native App Store / Play Store apps (Capacitor)

Capacitor is configured (`capacitor.config.ts`). To produce real native apps:

```bash
npm install
npm run build
npx cap add ios        # needs macOS + Xcode
npx cap add android    # needs Android Studio
npm run cap:ios        # builds, syncs, opens Xcode
npm run cap:android    # builds, syncs, opens Android Studio
```

In Xcode / Android Studio you set the app icon, signing (with *your* Apple/Google
developer accounts), then archive and upload. **You** submit to the stores and go
through review — that part can't be automated for you, and review is strict for finance
apps, especially anything touching bank data. Budget time for it.

For the OAuth redirect to return into the native app, keep the custom scheme
`au.com.tally.app://` in your Amplify `callbackUrls`/`logoutUrls` and register it in
the iOS `Info.plist` / Android intent filters (Capacitor docs cover this).

## 6. Real bank / autopay / investment connections

These never call providers from the browser (that would leak secret keys). Instead the
app calls **your** API; your API holds the secrets and runs the consent flow. Set
`VITE_API_BASE` to your deployed API URL. An example handler is in
`aws/functions/cdr-connect.example.mjs`.

- **Bank data — Consumer Data Right (Open Banking).** Read-only. You must either become
  an **Accredited Data Recipient** (ACCC) or operate under an aggregator's accreditation
  as a representative/affiliate. Practical path: contract with **Basiq** (owned by Cuscal)
  or **Frollo** (an ACCC-regulated ADR), get keys, deploy the connect/fetch Lambdas.
  CDR cannot move money — read only.
- **Bill autopay — PayTo.** Sign up with a payments provider (**Stripe, Adyen,
  GoCardless or Monoova**), complete their business onboarding, and use their PayTo API
  to create mandates. The customer approves each mandate **inside their own banking app**;
  it lives in the NPP Mandate Management Service and they can cancel it there.
- **Investments.** Use **SnapTrade** or **Sharesight** for read-only holdings sync
  (CommSec, Selfwealth, Stake, Pearler, etc.) and a market-data feed such as **EODHD**
  for ASX prices. Both need paid API keys.

Deploy these as Lambdas behind API Gateway (with a Cognito authorizer so each call is
tied to the signed-in user), put the provider secrets in Lambda env vars / AWS Secrets
Manager, and set `VITE_API_BASE` to the API Gateway URL.

## 7. The accreditation reality (read this before promising launch dates)

Live bank data and live debits in Australia are regulated. Expect: a registered business
entity, an external dispute-resolution membership, security/assurance documentation,
insurance, and signed agreements with the ACCC and/or your aggregator and payments
provider. Lead times are weeks to months, not days. The app is ready for that day; the
paperwork is the long pole.

Tally is a tracking and planning tool, **not financial advice** and not a licensed
financial product. Get legal advice on your specific setup before going live.

---

## 8. Monetisation — local-first, free + Premium

Tally is **local-first**: the entire core app (the guided setup, manual budgeting,
bills, investments, goals, net worth) runs on-device with no account and no network,
and is free forever. Money is made two ways, both scaffolded in the code:

**Free tier — with ads.** Ad slots render via the `<AdSlot>` component (in `ui.jsx`),
shown only to free users. Replace the placeholder with a real ad unit:
- Mobile (the Capacitor apps): Google AdMob via a Capacitor community plugin.
- Web: Google AdSense (or another network).
Keep them tasteful; finance users churn fast on clutter.

**Premium subscription.** `src/entitlements.js` defines the plan and the gated
features. Premium currently unlocks: bank linking (CDR), PayTo autopay, cross-device
sync, couples sharing across devices, and removes ads. The paywall UI is in `ui.jsx`
(`Paywall`). To make billing real, wire these two functions in `entitlements.js`:
- `startSubscription()` / `restorePurchases()`
- **Mobile:** use in-app purchases — the App Store and Play Store *require* IAP for
  digital subscriptions (you can't use Stripe for in-app digital goods on iOS).
  **RevenueCat** is the simplest cross-platform wrapper and works with Capacitor.
- **Web:** **Stripe** Checkout/Billing.
On a successful purchase or restore, set `settings.plan = "premium"` (the helper already
does this). In cloud mode you'd also persist the entitlement against the account and
verify it server-side (RevenueCat webhooks / Stripe webhooks → your AWS backend) so it
can't be spoofed client-side.

> In this build the paywall just flips the plan locally so you can see the gated
> experience. Swap in real billing before launch, and verify entitlements server-side.

Because the app is local-first, none of this requires a backend to *start* — you can
ship the free, ad-supported, on-device app first, then turn on Premium (and the AWS
backend) when you're ready.

### Cost control built in

The app is wired so **free users never touch your paid database**: all data saves to
the device, and the cloud sync (the only per-user running cost beyond static hosting)
runs *only* for Premium users (`backend.mode !== "local" && isPremium(data)` in
`App.jsx`). Bank linking, PayTo and investment sync — the paid-API features — are also
Premium-only. So your running costs scale with paying users, not free ones. Free users
are monetised by ads (banner `AdSlot` + interstitial `PopupAd`).

If you later ship a cloud backend for everyone, keep this guard (or instantiate the
cloud backend only after a Premium entitlement is confirmed) so a flood of free signups
can't run up DynamoDB/Cognito costs.
