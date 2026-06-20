import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  LayoutDashboard, Wallet, CalendarDays, TrendingUp, Scale, Target, Plug,
  ChevronLeft, ChevronRight, LogOut, Users, Sparkles,
} from "lucide-react";
import { createBackend } from "./backend.js";
import { reducer, getView, derive } from "./state.js";
import { monthLabel } from "./lib.js";
import { hasPremium, isPremium } from "./entitlements.js";
import { Money, AuthScreen, ModalHost, Onboarding, AdSlot, PopupAd } from "./ui.jsx";
import { Dashboard, Budget, Bills, Investments, NetWorth, Goals, Connections } from "./views.jsx";
import { CSS } from "./styles.js";

const NAV = [
  ["dashboard", "Overview", LayoutDashboard],
  ["budget", "Budget", Wallet],
  ["bills", "Bills", CalendarDays],
  ["invest", "Invest", TrendingUp],
  ["goals", "Goals", Target],
  ["networth", "Net worth", Scale],
  ["connect", "Connections", Plug],
];

export default function App() {
  const backend = useMemo(() => createBackend(), []);
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    backend.getSession().then((s) => { if (active) { setSession(s); setBooting(false); } });
    const unsub = backend.onChange((s) => { if (active) setSession(s); });
    return () => { active = false; unsub && unsub(); };
  }, [backend]);

  if (booting) return <div className="boot"><span className="brand-mark">{"\u20B8"}</span></div>;
  if (!session) return (<><style>{CSS}</style><AuthScreen backend={backend} onAuth={setSession} /></>);
  return <Workspace key={session.user.id} backend={backend} session={session} onSignOut={() => backend.signOut()} />;
}

function Workspace({ backend, session, onSignOut }) {
  const [data, dispatch] = useReducer(reducer, null);
  const [tab, setTab] = useState("dashboard");
  const [cursor, setCursor] = useState(new Date());
  const [viewScope, setViewScope] = useState("personal");
  const [modal, setModal] = useState(null);
  const [popup, setPopup] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef(null);
  const adShown = useRef(false);

  const LKEY = "tally:data:" + session.user.id;
  const localLoad = () => { try { return JSON.parse(localStorage.getItem(LKEY)); } catch { return null; } };
  const localSave = (d) => { try { localStorage.setItem(LKEY, JSON.stringify(d)); } catch { /* storage full */ } };

  // load this user's data — on-device first (free = zero server cost); only pull
  // from the cloud when the user is Premium and a cloud backend is configured.
  useEffect(() => {
    let active = true;
    (async () => {
      let s = localLoad();
      if (!s) s = await backend.loadState(session);
      if (s?.settings?.plan === "premium" && backend.mode !== "local") {
        try { const c = await backend.loadState(session); if (c) s = c; } catch { /* offline */ }
      }
      if (active) { dispatch({ type: "HYDRATE", state: s }); hydrated.current = true; }
    })();
    return () => { active = false; hydrated.current = false; };
  }, [backend, session]);

  // persist on change. Always save locally (cheap). Sync to the paid cloud DB
  // ONLY for Premium users, so free users never incur database costs.
  useEffect(() => {
    if (!data || !hydrated.current) return;
    localSave(data);
    clearTimeout(saveTimer.current);
    if (backend.mode !== "local" && hasPremium(data, session)) {
      saveTimer.current = setTimeout(() => backend.saveState(session, data), 400);
    }
    return () => clearTimeout(saveTimer.current);
  }, [data, backend, session]);

  // free users see one pop-up ad per session, shortly after the app settles
  useEffect(() => {
    if (!data || adShown.current || !data.settings.onboarded || hasPremium(data, session)) return;
    adShown.current = true;
    const t = setTimeout(() => setPopup(true), 1500);
    return () => clearTimeout(t);
  }, [data]);

  if (!data) return <div className="boot"><span className="brand-mark">{"\u20B8"}</span></div>;

  const linked = data.household.linked;
  const scope = linked ? viewScope : "personal";
  const bucket = getView(data, scope);
  const metrics = derive(bucket, cursor);
  const cur = data.settings.currency;
  const premium = hasPremium(data, session);
  const openPaywall = () => setModal({ type: "paywall" });

  const ctx = { data, dispatch, bucket, cursor, setCursor, modal, setModal, viewScope: scope, session, backend, cur, isPremium: premium, openPaywall, ...metrics };

  // first run: simple "what you earn / spend" setup before the full app
  if (!data.settings.onboarded) {
    return (<div className="tally-root onb-root"><style>{CSS}</style><Onboarding ctx={ctx} />{modal && <ModalHost ctx={ctx} />}</div>);
  }

  return (
    <div className="tally-root">
      <style>{CSS}</style>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{"\u20B8"}</div>
          <div><div className="brand-name">Tally</div><div className="brand-sub">{session.user.name} · {premium ? "Premium" : "Free"}</div></div>
        </div>
        <nav>
          {NAV.map(([key, label, Icon]) => (
            <button key={key} className={`nav-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        {!premium && <button className="nav-item go-premium" onClick={openPaywall}><Sparkles size={18} /><span>Go Premium</span></button>}
        <button className="nav-item signout" onClick={onSignOut}><LogOut size={18} /><span>Sign out</span></button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="month-nav">
            <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
            <span className="month-label">{monthLabel(cursor)}</span>
            <button className="icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
          </div>

          <div className="topbar-right">
            {linked && (
              <div className="scope-switch">
                {[["personal", "Just me"], ["shared", "Shared"], ["combined", "Combined"]].map(([v, l]) => (
                  <button key={v} className={viewScope === v ? "active" : ""} onClick={() => setViewScope(v)}>{l}</button>
                ))}
              </div>
            )}
            <span className="nw-pill">Net worth <Money value={metrics.netWorth} /></span>
          </div>
        </header>

        <div className="view">
          {tab === "dashboard" && <Dashboard ctx={ctx} go={setTab} />}
          {tab === "budget" && <Budget ctx={ctx} />}
          {tab === "bills" && <Bills ctx={ctx} />}
          {tab === "invest" && <Investments ctx={ctx} />}
          {tab === "goals" && <Goals ctx={ctx} />}
          {tab === "networth" && <NetWorth ctx={ctx} />}
          {tab === "connect" && <Connections ctx={ctx} />}
        </div>
      </main>

      <nav className="bottombar">
        {NAV.slice(0, 6).map(([key, label, Icon]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={20} /><span>{label}</span></button>
        ))}
      </nav>

      {modal && <ModalHost ctx={ctx} />}
      {popup && !premium && <PopupAd onClose={() => setPopup(false)} onUpgrade={() => { setPopup(false); openPaywall(); }} />}
    </div>
  );
}
