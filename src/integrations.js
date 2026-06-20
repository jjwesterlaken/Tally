// ----------------------------------------------------------------------------
// integrations.js — REAL integration clients (no simulation).
//
// Security model: secret provider keys (Basiq, PayTo provider, SnapTrade, etc.)
// must NEVER live in the browser. So these client functions call YOUR backend
// (VITE_API_BASE — e.g. an AWS API Gateway + Lambda), and the backend holds the
// secrets, performs the token exchange, and returns a consent URL that we send
// the user to. The user always authorises inside their own bank/broker app.
//
// Example server handlers are in aws/functions/. Until you deploy a backend and
// set VITE_API_BASE, these return { ok:false, reason:"no_backend" } — the UI
// shows "backend required" instead of pretending to be connected.
// ----------------------------------------------------------------------------

const API = import.meta.env.VITE_API_BASE || "";
export const hasBackend = Boolean(API);

async function call(path, body, token) {
  if (!API) return { ok: false, reason: "no_backend" };
  try {
    const res = await fetch(API.replace(/\/$/, "") + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) return { ok: false, reason: "error", status: res.status };
    return { ok: true, ...(await res.json()) };
  } catch (e) {
    return { ok: false, reason: "network", message: e.message };
  }
}

export const integrationAdapters = {
  // CDR / Open Banking via Basiq or Frollo. Backend creates a consent request
  // and returns the bank's hosted consent URL; we redirect the user there.
  async connectBank(token) {
    const r = await call("/cdr/connect", { redirect: window.location.origin + "?cdr=callback" }, token);
    if (r.ok && r.consentUrl) { window.location.href = r.consentUrl; return { ok: true, redirecting: true }; }
    return r;
  },

  // PayTo: backend creates a mandate; the customer approves it in their banking
  // app. Returns the agreement status / a URL to present.
  async createPayToMandate(payload, token) {
    const r = await call("/payto/mandate", payload, token);
    if (r.ok && r.agreementUrl) { window.location.href = r.agreementUrl; return { ok: true, redirecting: true }; }
    return r;
  },

  // Investments: SnapTrade / Sharesight read-only connect; backend returns the
  // provider's connection portal URL.
  async connectInvestments(token) {
    const r = await call("/investments/connect", { redirect: window.location.origin + "?inv=callback" }, token);
    if (r.ok && r.connectUrl) { window.location.href = r.connectUrl; return { ok: true, redirecting: true }; }
    return r;
  },
};
