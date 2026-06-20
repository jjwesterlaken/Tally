// ----------------------------------------------------------------------------
// backend.js — auth + persistence behind one interface, with two modes:
//
//   LOCAL (default): accounts and data live in this browser. Zero setup, works
//     on any device immediately. "Logins" are device-local and NOT secure —
//     fine for trying the product or single-device use.
//
//   CLOUD: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (.env) and run
//     supabase/schema.sql. Real email/password auth that syncs across devices,
//     and real partner linking where two people share one household row.
//
// The app calls the same methods regardless of mode.
// ----------------------------------------------------------------------------
import { freshState, seedShared, uid } from "./lib.js";
import { awsBackend } from "./backend.aws.js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PICK = (import.meta.env.VITE_BACKEND || "local").toLowerCase();
export const CLOUD = Boolean(URL && KEY);

export function createBackend() {
  if (PICK === "aws") return awsBackend();
  if (PICK === "supabase" || CLOUD) return cloudBackend();
  return localBackend();
}

/* ============================== LOCAL MODE =============================== */

function localBackend() {
  const USERS = "tally:users";
  const SESSION = "tally:session";
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  let subs = [];
  const notify = (s) => subs.forEach((cb) => cb(s));
  const sessionFor = (id) => { const u = read(USERS, {})[id]; return u ? { user: { id, email: u.email, name: u.name } } : null; };

  return {
    mode: "local",
    async getSession() { const id = read(SESSION, null); return id ? sessionFor(id) : null; },
    onChange(cb) { subs.push(cb); return () => { subs = subs.filter((x) => x !== cb); }; },

    async signUp({ email, password, name }) {
      const users = read(USERS, {});
      const existing = Object.entries(users).find(([, u]) => u.email === email.toLowerCase());
      if (existing) throw new Error("An account with that email already exists on this device.");
      const id = uid();
      users[id] = { email: email.toLowerCase(), name: name || email.split("@")[0], pass: btoa(password) };
      write(USERS, users);
      write(SESSION, id);
      write("tally:data:" + id, freshState());
      const s = sessionFor(id); notify(s); return s;
    },
    async signIn({ email, password }) {
      const users = read(USERS, {});
      const found = Object.entries(users).find(([, u]) => u.email === email.toLowerCase());
      if (!found || found[1].pass !== btoa(password)) throw new Error("Email or password is incorrect.");
      write(SESSION, found[0]);
      const s = sessionFor(found[0]); notify(s); return s;
    },
    async signOut() { localStorage.removeItem(SESSION); notify(null); },

    async signInWithProvider() {
      throw new Error("Google and Apple sign-in need a cloud backend. Set VITE_BACKEND to 'aws' (or 'supabase') and configure the provider — see GO-LIVE.md.");
    },
    async getToken() { return null; },

    async loadState(session) { return read("tally:data:" + session.user.id, freshState()); },
    async saveState(session, state) { write("tally:data:" + session.user.id, state); },

    // Local partner linking is simulated on this device (there is no second
    // user/device to sync with). Cloud mode does real linking.
    async createInvite() { return { code: uid().toUpperCase().slice(0, 6) }; },
    async acceptInvite() { return { ok: true }; },
  };
}

/* ============================== CLOUD MODE ============================== */
// Data model (see supabase/schema.sql):
//   app_data   : one row per user  { user_id, household_id, personal, settings, integrations }
//   households : one row per couple { id, invite_code, members[], shared }
// Assembled at runtime as { personal, shared, settings, integrations, household }.

function cloudBackend() {
  let client = null;
  const getClient = async () => {
    if (!client) {
      const { createClient } = await import("@supabase/supabase-js");
      client = createClient(URL, KEY);
    }
    return client;
  };
  const toSession = (s) => (s?.user ? { user: { id: s.user.id, email: s.user.email, name: s.user.user_metadata?.name || s.user.email } } : null);

  return {
    mode: "cloud",
    async getSession() { const c = await getClient(); const { data } = await c.auth.getSession(); return toSession(data.session); },
    onChange(cb) {
      let unsub = () => {};
      getClient().then((c) => { const { data } = c.auth.onAuthStateChange((_e, s) => cb(toSession(s))); unsub = () => data.subscription.unsubscribe(); });
      return () => unsub();
    },
    async signUp({ email, password, name }) {
      const c = await getClient();
      const { data, error } = await c.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw new Error(error.message);
      return toSession(data.session || { user: data.user });
    },
    async signIn({ email, password }) {
      const c = await getClient();
      const { data, error } = await c.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return toSession(data.session);
    },
    async signOut() { const c = await getClient(); await c.auth.signOut(); },

    async signInWithProvider(provider) {
      const c = await getClient();
      const { error } = await c.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
      if (error) throw new Error(error.message);
    },
    async getToken() { const c = await getClient(); const { data } = await c.auth.getSession(); return data.session?.access_token || null; },

    async loadState(session) {
      const c = await getClient();
      let { data: row } = await c.from("app_data").select("*").eq("user_id", session.user.id).maybeSingle();
      if (!row) {
        const init = freshState();
        await c.from("app_data").insert({ user_id: session.user.id, personal: init.personal, settings: init.settings, integrations: init.integrations, household_id: null });
        row = { personal: init.personal, settings: init.settings, integrations: init.integrations, household_id: null };
      }
      const state = freshState();
      state.personal = row.personal; state.settings = row.settings; state.integrations = row.integrations;
      if (row.household_id) {
        const { data: hh } = await c.from("households").select("*").eq("id", row.household_id).maybeSingle();
        if (hh) {
          state.shared = hh.shared;
          state.household = { linked: true, partnerName: "Partner", inviteCode: hh.invite_code, householdId: hh.id };
        }
      }
      return state;
    },
    async saveState(session, state) {
      const c = await getClient();
      await c.from("app_data").upsert({ user_id: session.user.id, personal: state.personal, settings: state.settings, integrations: state.integrations, household_id: state.household?.householdId || null }, { onConflict: "user_id" });
      if (state.household?.householdId) await c.from("households").update({ shared: state.shared }).eq("id", state.household.householdId);
    },
    async createInvite(session, state) {
      const c = await getClient();
      const code = uid().toUpperCase().slice(0, 6);
      const id = uid();
      await c.from("households").insert({ id, invite_code: code, members: [session.user.id], shared: state.shared.accounts.length ? state.shared : seedShared() });
      await c.from("app_data").update({ household_id: id }).eq("user_id", session.user.id);
      return { code, householdId: id };
    },
    async acceptInvite(session, code) {
      const c = await getClient();
      const { data: hh } = await c.from("households").select("*").eq("invite_code", code.toUpperCase()).maybeSingle();
      if (!hh) throw new Error("No household found for that code.");
      await c.from("households").update({ members: Array.from(new Set([...(hh.members || []), session.user.id])) }).eq("id", hh.id);
      await c.from("app_data").update({ household_id: hh.id }).eq("user_id", session.user.id);
      return { ok: true, householdId: hh.id };
    },
  };
}
