// ----------------------------------------------------------------------------
// entitlements.js — the free vs Premium model.
//
// Tally is LOCAL-FIRST: the whole core app (manual budgeting, bills, investments,
// goals, net worth) is free and works offline with no account. Premium unlocks the
// connected + convenience features and removes ads.
//
// Billing is stubbed here. To make it real:
//   • Mobile (App Store / Play): use in-app purchases via RevenueCat (recommended)
//     or StoreKit/Play Billing. Store rules require IAP for digital subscriptions.
//   • Web: use Stripe Checkout / Billing.
// Wire those into startSubscription()/restorePurchases() below; on success they
// set settings.plan = "premium".
// ----------------------------------------------------------------------------

export const isPremium = (data) => data?.settings?.plan === "premium";

// Owner / comp accounts: these emails ALWAYS get full access (no paywall, no
// ads), regardless of billing. Add your own email(s) here.
//
// NOTE: this is a client-side allowlist — perfect for you/testing, but it is
// NOT a secure entitlement (anyone reading the code can see these addresses).
// When you wire real billing + AWS, move this check server-side (or keep it as
// a private owner override and verify paying customers' entitlements server-side).
export const OWNER_EMAILS = ["owner@tally.app"];
export const isOwner = (session) => {
  const e = session?.user?.email?.toLowerCase();
  return !!e && OWNER_EMAILS.map((x) => x.toLowerCase()).includes(e);
};
// the check the app uses everywhere: a real subscription OR the owner allowlist
export const hasPremium = (data, session) => isPremium(data) || isOwner(session);

export const PREMIUM_FEATURES = [
  "Automatic bank linking (Open Banking / CDR)",
  "Autopay bills with PayTo",
  "Sync across all your devices",
  "Couples / household sharing across devices",
  "No ads",
];

export const PRICING = { monthly: "$4.99/mo", yearly: "$39.99/yr", trial: "7-day free trial" };

// premium-gated connection keys
export const PREMIUM_CONNECTIONS = ["bank", "payto", "invest"];

export async function startSubscription(dispatch /*, plan */) {
  // TODO: replace with RevenueCat (mobile) or Stripe (web). On a successful
  // purchase/restore, set the plan to premium:
  dispatch({ type: "SET_SETTING", key: "plan", value: "premium" });
  return { ok: true };
}

export async function restorePurchases(dispatch) {
  // TODO: query the store/Stripe for an active entitlement, then set the plan.
  dispatch({ type: "SET_SETTING", key: "plan", value: "premium" });
  return { ok: true };
}

export function cancelSubscription(dispatch) {
  // For demo only — real cancellation happens in the store / Stripe portal.
  dispatch({ type: "SET_SETTING", key: "plan", value: "free" });
}
