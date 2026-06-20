import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the built web app (dist/) into native iOS + Android apps for the stores.
// After `npm run build`, run `npx cap add ios` / `npx cap add android` once, then
// `npm run cap:ios` / `npm run cap:android`. See GO-LIVE.md.
const config: CapacitorConfig = {
  appId: "au.com.tally.app",
  appName: "Tally",
  webDir: "dist",
  server: { androidScheme: "https" },
};

export default config;
