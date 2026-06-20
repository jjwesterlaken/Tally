import { defineAuth, secret } from "@aws-amplify/backend";

/**
 * Cognito auth with email/password + Google + Apple.
 *
 * Before first deploy, store the provider secrets once with the Amplify CLI:
 *   npx ampx sandbox secret set GOOGLE_CLIENT_ID
 *   npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
 *   npx ampx sandbox secret set APPLE_CLIENT_ID
 *   npx ampx sandbox secret set APPLE_TEAM_ID
 *   npx ampx sandbox secret set APPLE_KEY_ID
 *   npx ampx sandbox secret set APPLE_PRIVATE_KEY
 * (and the equivalent in the Amplify console for your production branch).
 *
 * Replace the callback/logout URLs with your real domain(s). For the native
 * apps, add your custom scheme too, e.g. "au.com.tally.app://".
 * See GO-LIVE.md for where each value comes from.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret("GOOGLE_CLIENT_ID"),
        clientSecret: secret("GOOGLE_CLIENT_SECRET"),
        scopes: ["email", "profile", "openid"],
        attributeMapping: { email: "email", fullname: "name" },
      },
      signInWithApple: {
        clientId: secret("APPLE_CLIENT_ID"),
        teamId: secret("APPLE_TEAM_ID"),
        keyId: secret("APPLE_KEY_ID"),
        privateKey: secret("APPLE_PRIVATE_KEY"),
        scopes: ["email", "name"],
      },
      callbackUrls: [
        "http://localhost:5173/",
        "https://YOUR-DOMAIN.com/",
        "au.com.tally.app://",
      ],
      logoutUrls: [
        "http://localhost:5173/",
        "https://YOUR-DOMAIN.com/",
        "au.com.tally.app://",
      ],
    },
  },
});
