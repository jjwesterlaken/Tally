import React, { useState } from "react";
import { Check, X, Trash2, Sparkles, Lock, ChevronRight } from "lucide-react";
import { money, todayISO, PALETTE, KLASSES, SETUP_ITEMS, toMonthly, RECUR_PRESETS, RECUR_UNITS } from "./lib.js";
import { PREMIUM_FEATURES, PRICING, startSubscription, restorePurchases } from "./entitlements.js";

/* ----------------------------- primitives ------------------------------ */

export function Money({ value, big }) {
  const neg = value < 0;
  const [d, c] = Math.abs(value || 0).toFixed(2).split(".");
  const dollars = Number(d).toLocaleString("en-AU");
  return (
    <span className={`fig ${big ? "fig-big" : ""} ${neg ? "neg" : ""}`}>
      {neg ? "\u2212" : ""}${dollars}<span className="cents">.{c}</span>
    </span>
  );
}

export function CardHead({ title, subtitle, action, onAction }) {
  return (
    <div className="card-head">
      <div><h3>{title}</h3>{subtitle && <span className="card-sub">{subtitle}</span>}</div>
      {action && <button className="link-btn" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function Stat({ label, value, cur }) {
  return <div className="stat"><div className="stat-label">{label}</div><div className="stat-value">{money(value, cur)}</div></div>;
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function ScopeTag({ scope }) {
  if (!scope) return null;
  return <span className={`tag ${scope === "shared" ? "tag-sage" : ""}`}>{scope === "shared" ? "shared" : "mine"}</span>;
}

export function BudgetInput({ value, onChange }) {
  const [v, setV] = useState(String(value));
  return (
    <span className="budget-input">
      <span className="ccy">$</span>
      <input value={v} inputMode="decimal"
        onChange={(e) => setV(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => onChange(parseFloat(v) || 0)} />
    </span>
  );
}

/* ------------------------------ auth screen ---------------------------- */

export function AuthScreen({ backend, onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "", name: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      const session = mode === "signup" ? await backend.signUp(f) : await backend.signIn(f);
      if (session) onAuth(session);
      else setErr("Check your email to confirm your account, then sign in.");
    } catch (e) { setErr(e.message || "Something went wrong."); }
    finally { setBusy(false); }
  };

  const social = async (provider) => {
    setErr("");
    try { await backend.signInWithProvider(provider); /* redirects away in cloud mode */ }
    catch (e) { setErr(e.message || `${provider} sign-in isn't available yet.`); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand"><span className="brand-mark">{"\u20B8"}</span><div><div className="brand-name">Tally</div><div className="brand-sub">financial planner</div></div></div>
        <h2>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="muted auth-mode">{backend.mode === "local" ? "Local account — saved on this device." : "Secure account — syncs across your devices."}</p>

        <div className="social-row">
          <button className="btn social" onClick={() => social("google")}>
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.2 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.5H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C40.9 36.7 44 31 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <button className="btn social" onClick={() => social("apple")}>
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.3 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.3-.9-2.4-3.6zM14.3 5.6c.6-.7 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2z"/></svg>
            Continue with Apple
          </button>
        </div>
        <div className="divider"><span>or</span></div>

        <div className="form">
          {mode === "signup" && <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Sam" /></label>}
          <label>Email<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" /></label>
          {err && <div className="auth-err">{err}</div>}
          <button className="btn full" disabled={busy || !f.email || !f.password} onClick={submit}>
            {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </div>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account?" : "New to Tally?"}{" "}
          <button className="link-btn" onClick={() => { setErr(""); setMode(mode === "signup" ? "login" : "signup"); }}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
      <p className="auth-foot muted">Budgeting · bills · investments · net worth — on your own or together.</p>
    </div>
  );
}

/* ------------------------------- modals -------------------------------- */

function ScopePick({ ctx, scope, setScope }) {
  if (!ctx.data.household.linked) return null;
  return (
    <label>Belongs to
      <select value={scope} onChange={(e) => setScope(e.target.value)}>
        <option value="personal">Just me</option>
        <option value="shared">Shared (household)</option>
      </select>
    </label>
  );
}

export function ModalHost({ ctx }) {
  const { modal, setModal } = ctx;
  const close = () => setModal(null);
  return (
    <div className="overlay" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-x" onClick={close}><X size={18} /></button>
        {modal.type === "category" && <CategoryForm ctx={ctx} />}
        {modal.type === "tx" && <TxForm ctx={ctx} />}
        {modal.type === "bill" && <BillForm ctx={ctx} />}
        {modal.type === "hold" && <HoldForm ctx={ctx} />}
        {modal.type === "goal" && <GoalForm ctx={ctx} />}
        {modal.type === "paywall" && <Paywall ctx={ctx} />}
      </div>
    </div>
  );
}

const defaultScope = (ctx) => (ctx.viewScope === "combined" ? "personal" : ctx.viewScope);

function CategoryForm({ ctx }) {
  const { dispatch, setModal, modal } = ctx;
  const edit = modal.data;
  const [scope, setScope] = useState(edit?._scope || defaultScope(ctx));
  const [f, setF] = useState(edit || { name: "", budget: 0, group: "expense", bucket: "need", color: PALETTE[0], rollover: false });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.name) return;
    const cat = { ...f, budget: +f.budget };
    delete cat._scope;
    dispatch(edit ? { type: "UPD_CAT", scope, cat } : { type: "ADD_CAT", scope, cat });
    setModal(null);
  };
  return (
    <div className="form">
      <h3>{edit ? "Edit category" : "New category"}</h3>
      <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Coffee" /></label>
      <label>Monthly budget<input value={f.budget} inputMode="decimal" onChange={(e) => set("budget", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
      <div className="form-row">
        <label>Type<select value={f.group} onChange={(e) => set("group", e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label>Bucket<select value={f.bucket} onChange={(e) => set("bucket", e.target.value)}><option value="need">Need</option><option value="want">Want</option><option value="save">Save</option><option value="income">Income</option></select></label>
      </div>
      {!edit && <ScopePick ctx={ctx} scope={scope} setScope={setScope} />}
      <label>Colour</label>
      <div className="swatches">{PALETTE.map((c) => <button key={c} className={`swatch ${f.color === c ? "sel" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />)}</div>
      <label className="check"><input type="checkbox" checked={!!f.rollover} onChange={(e) => set("rollover", e.target.checked)} /> Roll unspent budget into next month</label>
      <button className="btn full" onClick={save}><Check size={16} /> {edit ? "Save changes" : "Add category"}</button>
    </div>
  );
}

function TxForm({ ctx }) {
  const { bucket, dispatch, setModal } = ctx;
  const [scope, setScope] = useState(defaultScope(ctx));
  const cats = bucket.categories;
  const [f, setF] = useState({ date: todayISO(), payee: "", amount: "", categoryId: cats[0]?.id, sign: "-" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => {
    const amt = (f.sign === "-" ? -1 : 1) * (parseFloat(f.amount) || 0);
    if (!f.payee || !amt) return;
    const cat = cats.find((c) => c.id === f.categoryId);
    dispatch({ type: "ADD_TX", scope: cat?._scope || scope, tx: { date: f.date, payee: f.payee, amount: amt, categoryId: f.categoryId, accountId: ctx.bucket.accounts[0]?.id } });
    setModal(null);
  };
  return (
    <div className="form">
      <h3>Add transaction</h3>
      <label>Description<input value={f.payee} onChange={(e) => set("payee", e.target.value)} placeholder="e.g. Woolworths" /></label>
      <div className="form-row">
        <label>Amount<div className="amt-input"><select value={f.sign} onChange={(e) => set("sign", e.target.value)}><option value="-">{"\u2212"}</option><option value="+">+</option></select><input value={f.amount} inputMode="decimal" onChange={(e) => set("amount", e.target.value.replace(/[^0-9.]/g, ""))} /></div></label>
        <label>Date<input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label>
      </div>
      <label>Category<select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}{c._scope === "shared" ? " · shared" : ""}</option>)}</select></label>
      <button className="btn full" onClick={save}><Check size={16} /> Add</button>
    </div>
  );
}

function BillForm({ ctx }) {
  const { bucket, dispatch, setModal, modal } = ctx;
  const edit = modal.data;
  const [scope, setScope] = useState(edit?._scope || defaultScope(ctx));
  const presetIdFor = (item) => {
    if (!item) return "1m";
    if (item.unit) { const p = RECUR_PRESETS.find((x) => x.every === item.every && x.unit === item.unit); return p ? p.id : "custom"; }
    return { weekly: "1w", fortnightly: "2w", monthly: "1m", yearly: "1y" }[item.freq] || "1m";
  };
  const [f, setF] = useState(edit
    ? { ...edit, flow: edit.flow || "out", anchor: edit.anchor || todayISO(), every: edit.every ?? 1, unit: edit.unit || "month" }
    : { name: "", amount: "", flow: modal.flow || "out", anchor: todayISO(), every: 1, unit: "month", categoryId: null, autopay: false });
  const [preset, setPreset] = useState(presetIdFor(edit));
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  let cats = bucket.categories.filter((c) => (f.flow === "in" ? c.group === "income" : c.group === "expense"));
  if (cats.length === 0) cats = bucket.categories;
  const catId = f.categoryId || cats[0]?.id;

  const setFlow = (flow) => { const next = bucket.categories.filter((c) => (flow === "in" ? c.group === "income" : c.group === "expense")); setF((s) => ({ ...s, flow, categoryId: next[0]?.id || null, autopay: flow === "in" ? false : s.autopay })); };
  const applyPreset = (id) => {
    setPreset(id);
    const p = RECUR_PRESETS.find((x) => x.id === id);
    if (id === "custom") setF((s) => ({ ...s, every: s.every && s.unit !== "once" ? s.every : 3, unit: s.unit && s.unit !== "once" ? s.unit : "week" }));
    else setF((s) => ({ ...s, every: p.every, unit: p.unit }));
  };
  const save = () => {
    if (!f.name) return;
    const bill = { name: f.name, amount: +f.amount, flow: f.flow, anchor: f.anchor, every: f.every, unit: f.unit, categoryId: catId, autopay: f.flow === "in" ? false : !!f.autopay, paidMonths: edit?.paidMonths || [] };
    if (edit) bill.id = edit.id;
    dispatch(edit ? { type: "UPD_BILL", scope, bill } : { type: "ADD_BILL", scope, bill });
    setModal(null);
  };
  const isIncome = f.flow === "in";
  return (
    <div className="form">
      <h3>{edit ? `Edit ${isIncome ? "income" : "bill"}` : `New ${isIncome ? "income" : "bill"}`}</h3>
      <div className="seg">
        <button className={!isIncome ? "active" : ""} onClick={() => setFlow("out")}>Bill / expense</button>
        <button className={isIncome ? "active" : ""} onClick={() => setFlow("in")}>Income</button>
      </div>
      <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={isIncome ? "e.g. Salary" : "e.g. Internet"} /></label>
      <div className="form-row">
        <label>Amount<input value={f.amount} inputMode="decimal" onChange={(e) => set("amount", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
        <label>First date<input type="date" value={f.anchor} onChange={(e) => set("anchor", e.target.value)} /></label>
      </div>
      <div className="form-row">
        <label>Repeats<select value={preset} onChange={(e) => applyPreset(e.target.value)}>{RECUR_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label>Category<select value={catId} onChange={(e) => set("categoryId", e.target.value)}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      {preset === "custom" && (
        <div className="form-row custom-recur">
          <label>Every<input type="number" min="1" value={f.every} onChange={(e) => set("every", Math.max(1, parseInt(e.target.value) || 1))} /></label>
          <label>Unit<select value={f.unit} onChange={(e) => set("unit", e.target.value)}>{RECUR_UNITS.map((u) => <option key={u} value={u}>{u}s</option>)}</select></label>
        </div>
      )}
      {!edit && <ScopePick ctx={ctx} scope={scope} setScope={setScope} />}
      {!isIncome && <label className="check"><input type="checkbox" checked={!!f.autopay} onChange={(e) => set("autopay", e.target.checked)} /> Autopay via PayTo (Premium · approved in your bank)</label>}
      <div className="modal-actions">
        {edit && <button className="btn ghost" onClick={() => { dispatch({ type: "DEL_BILL", scope: edit._scope || scope, id: edit.id }); setModal(null); }}><Trash2 size={15} /> Delete</button>}
        <button className="btn full" onClick={save}><Check size={16} /> {edit ? "Save" : `Add ${isIncome ? "income" : "bill"}`}</button>
      </div>
    </div>
  );
}

function HoldForm({ ctx }) {
  const { dispatch, setModal } = ctx;
  const [scope, setScope] = useState(defaultScope(ctx));
  const [f, setF] = useState({ symbol: "", name: "", units: "", avgCost: "", price: "", klass: "AU shares" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.symbol) return;
    dispatch({ type: "ADD_HOLD", scope, hold: { symbol: f.symbol.toUpperCase(), name: f.name || f.symbol, units: +f.units, avgCost: +f.avgCost, price: +(f.price || f.avgCost), klass: f.klass } });
    setModal(null);
  };
  return (
    <div className="form">
      <h3>Add holding</h3>
      <div className="form-row">
        <label>Ticker<input value={f.symbol} onChange={(e) => set("symbol", e.target.value)} placeholder="VAS" /></label>
        <label>Asset class<select value={f.klass} onChange={(e) => set("klass", e.target.value)}>{KLASSES.map((k) => <option key={k}>{k}</option>)}</select></label>
      </div>
      <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Vanguard Aus Shares ETF" /></label>
      <div className="form-row">
        <label>Units<input value={f.units} inputMode="decimal" onChange={(e) => set("units", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
        <label>Avg cost<input value={f.avgCost} inputMode="decimal" onChange={(e) => set("avgCost", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
        <label>Price<input value={f.price} inputMode="decimal" onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
      </div>
      {ctx.data.household.linked && <ScopePick ctx={ctx} scope={scope} setScope={setScope} />}
      <button className="btn full" onClick={save}><Check size={16} /> Add</button>
    </div>
  );
}

function GoalForm({ ctx }) {
  const { dispatch, setModal } = ctx;
  const [scope, setScope] = useState(defaultScope(ctx));
  const [f, setF] = useState({ name: "", target: "", saved: "", targetDate: "" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.name || !f.target) return;
    dispatch({ type: "ADD_GOAL", scope, goal: { name: f.name, target: +f.target, saved: +(f.saved || 0), targetDate: f.targetDate } });
    setModal(null);
  };
  return (
    <div className="form">
      <h3>New goal</h3>
      <label>Name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="House deposit" /></label>
      <div className="form-row">
        <label>Target<input value={f.target} inputMode="decimal" onChange={(e) => set("target", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
        <label>Saved so far<input value={f.saved} inputMode="decimal" onChange={(e) => set("saved", e.target.value.replace(/[^0-9.]/g, ""))} /></label>
      </div>
      <label>Target date<input type="date" value={f.targetDate} onChange={(e) => set("targetDate", e.target.value)} /></label>
      {ctx.data.household.linked && <ScopePick ctx={ctx} scope={scope} setScope={setScope} />}
      <button className="btn full" onClick={save}><Check size={16} /> Add goal</button>
    </div>
  );
}

/* --------------------------- onboarding / quick setup --------------------- */

export function Onboarding({ ctx }) {
  const { dispatch, cur } = ctx;
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [freq, setFreq] = useState("fortnightly");
  const [items, setItems] = useState(SETUP_ITEMS.map((i) => ({ ...i, amount: "" })));

  const setAmt = (idx, v) => setItems(items.map((it, i) => (i === idx ? { ...it, amount: v.replace(/[^0-9.]/g, "") } : it)));
  const monthlyIncome = toMonthly(income, freq);
  const monthlySpend = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const finish = () => dispatch({ type: "QUICK_SETUP", payload: { income, freq, items } });
  const skip = () => dispatch({ type: "SET_SETTING", key: "onboarded", value: true });

  return (
    <div className="onb-wrap">
      <div className="onb-card">
        <div className="onb-head">
          <div className="auth-brand"><span className="brand-mark">{"\u20B8"}</span><div><div className="brand-name">Tally</div><div className="brand-sub">let's set up your money</div></div></div>
          <button className="link-btn" onClick={skip}>Skip</button>
        </div>

        {step === 0 ? (
          <>
            <h2>What do you earn?</h2>
            <p className="muted onb-sub">Roughly is fine — you can change it anytime.</p>
            <div className="onb-income">
              <span className="big-ccy">$</span>
              <input className="big-input" autoFocus value={income} inputMode="decimal" placeholder="0" onChange={(e) => setIncome(e.target.value.replace(/[^0-9.]/g, ""))} />
            </div>
            <div className="freq-row">
              {[["weekly", "Weekly"], ["fortnightly", "Fortnightly"], ["monthly", "Monthly"], ["yearly", "Yearly"]].map(([v, l]) => (
                <button key={v} className={`freq-pill ${freq === v ? "active" : ""}`} onClick={() => setFreq(v)}>{l}</button>
              ))}
            </div>
            {monthlyIncome > 0 && <p className="muted onb-hint">≈ {money(monthlyIncome, cur)} a month</p>}
            <button className="btn full" disabled={!monthlyIncome} onClick={() => setStep(1)}>Next <ChevronRight size={16} /></button>
          </>
        ) : (
          <>
            <h2>What do you spend on?</h2>
            <p className="muted onb-sub">Add a rough monthly amount for the ones that apply. Leave the rest blank.</p>
            <div className="onb-items">
              {items.map((it, idx) => (
                <div key={it.name} className="onb-item">
                  <span className="onb-item-name">{it.name}<small className="bucket-tag">{it.bucket}</small></span>
                  <span className="budget-input"><span className="ccy">$</span><input value={it.amount} inputMode="decimal" placeholder="0" onChange={(e) => setAmt(idx, e.target.value)} /></span>
                </div>
              ))}
            </div>
            <div className="onb-summary">
              <span>{money(monthlyIncome, cur)} in</span>
              <span>{money(monthlySpend, cur)} planned</span>
              <span className={monthlyIncome - monthlySpend < 0 ? "neg" : "up"}>{money(monthlyIncome - monthlySpend, cur)} left</span>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn full" onClick={finish}><Check size={16} /> Create my budget</button>
            </div>
          </>
        )}
      </div>
      <p className="auth-foot muted">Everything stays on your device. No account needed.</p>
    </div>
  );
}

/* ------------------------------- paywall --------------------------------- */

export function Paywall({ ctx }) {
  const { dispatch, setModal } = ctx;
  const [busy, setBusy] = useState(false);
  const go = async (fn) => { setBusy(true); try { await fn(dispatch); setModal(null); } finally { setBusy(false); } };
  return (
    <div className="form paywall">
      <div className="paywall-badge"><Sparkles size={18} /> Tally Premium</div>
      <h3>Unlock the connected features</h3>
      <ul className="paywall-list">
        {PREMIUM_FEATURES.map((f) => <li key={f}><Check size={15} /> {f}</li>)}
      </ul>
      <div className="paywall-price"><strong>{PRICING.monthly}</strong> · or {PRICING.yearly} · {PRICING.trial}</div>
      <button className="btn full" disabled={busy} onClick={() => go(startSubscription)}><Sparkles size={16} /> {busy ? "One moment…" : "Start free trial"}</button>
      <button className="link-btn center" onClick={() => go(restorePurchases)}>Restore purchase</button>
      <p className="muted paywall-note">Billing is a placeholder in this build — see entitlements.js to wire RevenueCat (mobile) or Stripe (web). The core app stays free forever.</p>
    </div>
  );
}

/* ------------------------------- ad slot --------------------------------- */
// Shows only on the free plan. Replace the inner placeholder with a real ad
// unit (Google AdMob on mobile via a Capacitor plugin, or AdSense on web).
export function AdSlot({ ctx, label }) {
  if (ctx.isPremium) return null;
  return (
    <div className="ad-slot" role="complementary">
      <span className="ad-tag">Ad</span>
      <span className="ad-body">{label || "Your ad could be here"}</span>
      <button className="ad-remove" onClick={ctx.openPaywall}><Lock size={11} /> Remove ads</button>
    </div>
  );
}

/* ----------------------------- interstitial ad --------------------------- */
// A pop-up ad shown to free users (e.g. once per session). Replace the inner
// placeholder with a real interstitial (AdMob interstitial on mobile, or an
// interstitial unit on web). Premium users never see it.
export function PopupAd({ onClose, onUpgrade }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal popup-ad" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-x" onClick={onClose}><X size={18} /></button>
        <span className="ad-tag">Advertisement</span>
        <div className="popup-ad-body">
          <Sparkles size={26} />
          <h3>Your message here</h3>
          <p className="muted">This is where a sponsored ad would show on the free plan.</p>
        </div>
        <button className="btn full" onClick={onUpgrade}><Sparkles size={15} /> Remove ads with Premium</button>
        <button className="link-btn center" onClick={onClose}>Continue with ads</button>
      </div>
    </div>
  );
}
