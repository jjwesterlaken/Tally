# Testing Tally on a phone (APK, iOS, and the no-build option)

There are four ways to get Tally onto a phone, from "30 seconds, no tools" to "full
native store builds." Pick based on how much setup you want.

---

## Option 1 — PWA install (fastest, both platforms, no build) ✅ recommended for testing

Tally is a PWA, so once it's hosted at a URL you (and your testers) can install it
with no APK/IPA and no developer accounts.

1. Deploy the web app (e.g. Vercel/Netlify — `npm run build`, output `dist/`).
2. Open the URL on the phone:
   - **Android (Chrome):** ⋮ menu → **Install app**.
   - **iPhone (Safari):** Share → **Add to Home Screen**.
3. It installs with its own icon and opens fullscreen. Data is stored on the device.

This is the quickest way for "us to test on mobile" right now, and it behaves almost
identically to the native app for everything except the native-only integrations.

## Option 2 — Downloadable APK with NO local tooling (PWABuilder)

If you specifically want an installable `.apk`/`.aab` but don't want to install
Android Studio:

1. Deploy the web app (Option 1, step 1) so it has a public URL.
2. Go to **https://www.pwabuilder.com**, paste your URL, and let it package the app.
3. Download the Android package and side-load the APK, or upload the `.aab` to Play.

PWABuilder also generates an iOS package, but you still need a Mac + Apple account to
build/submit that one.

## Option 3 — Downloadable APK from the cloud (GitHub Actions)  ← included

This repo includes `.github/workflows/android-apk.yml`. Push the project to GitHub, open
the **Actions** tab, run **Build Android APK**, and when it finishes download the
**tally-debug-apk** artifact. GitHub's runners have the Android SDK, so you get a real
debug APK without installing anything locally. Side-load it on a phone (enable "Install
unknown apps" for your browser/files app).

There's also `.github/workflows/ios-build.yml`, which builds an unsigned **simulator**
app on a macOS runner. Useful for a quick look in the iOS Simulator on a Mac, but it
**cannot** run on a real iPhone (that needs signing — see Option 4).

## Option 4 — Native builds on your own machine

Capacitor is already configured (`capacitor.config.ts`, app id `au.com.tally.app`).

**Android APK (needs Android Studio):**
```bash
npm install
npm run build
npx cap add android      # first time only
npm run cap:android      # builds, syncs, opens Android Studio
```
In Android Studio: Build → Build Bundle(s)/APK(s) → Build APK. The APK lands in
`android/app/build/outputs/apk/`.

**iOS (needs a Mac + Xcode + Apple Developer account):**
```bash
npm install
npm run build
npx cap add ios          # first time only (runs CocoaPods)
npm run cap:ios          # builds, syncs, opens Xcode
```
In Xcode: set your Team (signing), pick your device, then Run to test on a connected
iPhone, or Product → Archive → distribute to **TestFlight** for your testers.

---

## iOS testing — the honest version

There is no way to produce an installable iPhone build without a **Mac + Xcode + an
Apple Developer account ($99/yr)**. For getting it onto testers' iPhones, **TestFlight**
is the standard route: archive in Xcode (or via CI with your signing secrets), upload to
App Store Connect, and invite testers by email. Until you set that up, use the **PWA**
(Option 1) on iPhones — it's the no-account way to test on iOS today.

## Quick recommendation

- Want to test on your phones in the next few minutes → **Option 1 (PWA)**.
- Want an actual APK file to pass around → **Option 3** (or **Option 2** if you prefer
  no GitHub).
- Heading toward the stores → **Option 4**, then GO-LIVE.md §5.
