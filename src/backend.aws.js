// ----------------------------------------------------------------------------
// backend.aws.js — production backend on AWS (Amazon Cognito for auth incl.
// Google/Apple, Amplify Data/DynamoDB for storage). Activated by VITE_BACKEND=aws.
//
// It reads amplify_outputs.json (generated when you deploy the Amplify backend —
// copy it into /public so it is served at /amplify_outputs.json) and lazily
// loads the aws-amplify SDK so the default local build is unaffected.
// See GO-LIVE.md for the full setup.
// ----------------------------------------------------------------------------
import { freshState, seedShared, uid } from "./lib.js";

let configured = false;
async function ensure() {
  if (configured) return;
  const res = await fetch("/amplify_outputs.json");
  if (!res.ok) throw new Error("AWS backend selected but /amplify_outputs.json is missing. Deploy the Amplify backend and copy the file into /public (see GO-LIVE.md).");
  const outputs = await res.json();
  const { Amplify } = await import("aws-amplify");
  Amplify.configure(outputs);
  configured = true;
}

export function awsBackend() {
  let profileId = null;

  const buildSession = async () => {
    const { getCurrentUser, fetchUserAttributes } = await import("aws-amplify/auth");
    try {
      const u = await getCurrentUser();
      let attrs = {};
      try { attrs = await fetchUserAttributes(); } catch { /* attrs optional */ }
      return { user: { id: u.userId, email: attrs.email || u.username, name: attrs.name || attrs.email || u.username } };
    } catch { return null; }
  };

  return {
    mode: "aws",

    async getSession() { await ensure(); return buildSession(); },

    onChange(cb) {
      let unsub = () => {};
      (async () => {
        await ensure();
        const { Hub } = await import("aws-amplify/utils");
        unsub = Hub.listen("auth", async ({ payload }) => {
          if (payload.event === "signedIn") cb(await buildSession());
          if (payload.event === "signedOut") cb(null);
        });
      })();
      return () => unsub();
    },

    async signUp({ email, password, name }) {
      await ensure();
      const { signUp, autoSignIn } = await import("aws-amplify/auth");
      const { nextStep } = await signUp({ username: email, password, options: { userAttributes: { email, name: name || email.split("@")[0] }, autoSignIn: true } });
      if (nextStep?.signUpStep === "CONFIRM_SIGN_UP") return null; // user must confirm via email code
      try { await autoSignIn(); } catch { /* ignore */ }
      return buildSession();
    },

    async signIn({ email, password }) {
      await ensure();
      const { signIn } = await import("aws-amplify/auth");
      await signIn({ username: email, password });
      return buildSession();
    },

    async signInWithProvider(provider) {
      await ensure();
      const { signInWithRedirect } = await import("aws-amplify/auth");
      await signInWithRedirect({ provider: provider === "apple" ? "Apple" : "Google" }); // redirects away
    },

    async signOut() { await ensure(); const { signOut } = await import("aws-amplify/auth"); await signOut(); },

    async getToken() { await ensure(); const { fetchAuthSession } = await import("aws-amplify/auth"); const s = await fetchAuthSession(); return s.tokens?.idToken?.toString() || null; },

    async loadState(session) {
      await ensure();
      const { generateClient } = await import("aws-amplify/data");
      const client = generateClient();
      const { data: profiles } = await client.models.Profile.list();
      let row = profiles && profiles[0];
      if (!row) {
        const init = freshState();
        const { data } = await client.models.Profile.create({ personal: init.personal, settings: init.settings, integrations: init.integrations, householdId: null });
        row = data;
      }
      profileId = row.id;
      const state = freshState();
      state.personal = row.personal; state.settings = row.settings; state.integrations = row.integrations;
      if (row.householdId) {
        const { data: hh } = await client.models.Household.get({ id: row.householdId });
        if (hh) { state.shared = hh.shared; state.household = { linked: true, partnerName: "Partner", inviteCode: hh.inviteCode, householdId: hh.id }; }
      }
      return state;
    },

    async saveState(session, st) {
      await ensure();
      const { generateClient } = await import("aws-amplify/data");
      const client = generateClient();
      if (!profileId) { const { data } = await client.models.Profile.list(); profileId = data?.[0]?.id; }
      if (profileId) await client.models.Profile.update({ id: profileId, personal: st.personal, settings: st.settings, integrations: st.integrations, householdId: st.household?.householdId || null });
      if (st.household?.householdId) await client.models.Household.update({ id: st.household.householdId, shared: st.shared });
    },

    async createInvite(session, st) {
      await ensure();
      const { generateClient } = await import("aws-amplify/data");
      const client = generateClient();
      const code = uid().toUpperCase().slice(0, 6);
      const { data: hh } = await client.models.Household.create({ inviteCode: code, members: [session.user.id], shared: st.shared.accounts.length ? st.shared : seedShared() });
      if (!profileId) { const { data } = await client.models.Profile.list(); profileId = data?.[0]?.id; }
      if (profileId) await client.models.Profile.update({ id: profileId, householdId: hh.id });
      return { code, householdId: hh.id };
    },

    async acceptInvite(session, code) {
      await ensure();
      const { generateClient } = await import("aws-amplify/data");
      const client = generateClient();
      const { data: list } = await client.models.Household.list({ filter: { inviteCode: { eq: code.toUpperCase() } } });
      const hh = list && list[0];
      if (!hh) throw new Error("No household found for that code.");
      await client.models.Household.update({ id: hh.id, members: Array.from(new Set([...(hh.members || []), session.user.id])) });
      if (!profileId) { const { data } = await client.models.Profile.list(); profileId = data?.[0]?.id; }
      if (profileId) await client.models.Profile.update({ id: profileId, householdId: hh.id });
      return { ok: true, householdId: hh.id };
    },
  };
}
