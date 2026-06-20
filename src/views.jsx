import React, { useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis,
} from "recharts";
import {
  Plus, Trash2, Pencil, X, Check, Repeat, RefreshCw, ArrowUpRight, ArrowDownRight,
  Landmark, ShieldCheck, TrendingUp, Lock, AlertTriangle, RefreshCw as Spin, Users, Target, UserPlus, Sparkles,
} from "lucide-react";
import { money, PALETTE, upcomingBills, scheduleOccurrences, recurrenceLabel, todayISO } from "./lib.js";
import { Money, CardHead, Stat, Empty, ScopeTag, AdSlot } from "./ui.jsx";
import { cancelSubscription } from "./entitlements.js";
import { integrationAdapters, hasBackend } from "./integrations.js";

/* ============================== DASHBOARD =============================== */

export function Dashboard({ ctx, go }) {
  const { bucket, income, totalSpent, totalBudgeted, netWorth, portfolioValue, cash, debt, cursor, mk, cur } = ctx;
  const safeToSpend = income - totalSpent;
  const expenseCats = bucket.categories.filter((c) => c.group === "expense");
  const topCats = [...expenseCats].sort((a, b) => (ctx.spentByCat[b.id] || 0) - (ctx.spentByCat[a.id] || 0)).slice(0, 5);
  const upcoming = upcomingBills(bucket.bills, cursor, mk).slice(0, 4);
  const recent = bucket.tx.slice(0, 6);

  return (
    <>
    <AdSlot ctx={ctx} label="Track everything in one place — go Premium to link your bank" />
    <div className="grid">
      <section className="card hero span-2">
        <div className="hero-rule" />
        <div className="hero-grid">
          <div>
            <div className="kicker">Safe to spend this month</div>
            <Money value={safeToSpend} big />
            <div className="hero-sub">
              <span className="up"><ArrowUpRight size={14} /> {money(income, cur)} in</span>
              <span className="down"><ArrowDownRight size={14} /> {money(totalSpent, cur)} out</span>
            </div>
          </div>
          <div className="hero-stats">
            <Stat label="Budgeted" value={totalBudgeted} cur={cur} />
            <Stat label="Spent" value={totalSpent} cur={cur} />
            <Stat label="Remaining" value={totalBudgeted - totalSpent} cur={cur} />
          </div>
        </div>
      </section>

      <section className="card">
        <CardHead title="Money mix" />
        <div className="mini-row"><span>Cash</span><Money value={cash} /></div>
        <div className="mini-row"><span>Investments</span><Money value={portfolioValue} /></div>
        <div className="mini-row"><span>Debt</span><Money value={-debt} /></div>
        <div className="mini-row total"><span>Net worth</span><Money value={netWorth} /></div>
      </section>

      <section className="card">
        <CardHead title="Coming up" action="See all" onAction={() => go("bills")} />
        {upcoming.length === 0 && <Empty>No bills due in this window.</Empty>}
        {upcoming.map((b) => (
          <div key={b.key} className="bill-row">
            <div className={`bill-date ${b.flow === "in" ? "in" : ""}`}><span>{b.day}</span><small>{b.mon}</small></div>
            <div className="bill-meta">
              <div className="bill-name">{b.name} {b.flow === "in" && <span className="tag tag-sage">income</span>} {b.autopay && <span className="tag tag-sage"><Repeat size={11} /> PayTo</span>}</div>
              <div className="bill-sub">{recurrenceLabel(b)}</div>
            </div>
            <Money value={b.flow === "in" ? b.amount : -b.amount} />
          </div>
        ))}
      </section>

      <section className="card span-2">
        <CardHead title="Where it's going" action="Open budget" onAction={() => go("budget")} />
        {topCats.length === 0 && <Empty>No spending categories yet.</Empty>}
        {topCats.map((c) => {
          const spent = ctx.spentByCat[c.id] || 0;
          const pct = c.budget ? Math.min(100, (spent / c.budget) * 100) : 0;
          const over = spent > c.budget;
          return (
            <div key={c.id} className="prog-row">
              <div className="prog-top">
                <span className="dot" style={{ background: c.color }} />
                <span className="prog-name">{c.name}</span><ScopeTag scope={c._scope} />
                <span className="prog-num">{money(spent, cur)} <small>/ {money(c.budget, cur)}</small></span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%`, background: over ? "var(--clay)" : c.color }} /></div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <CardHead title="Recent activity" />
        {recent.map((t) => {
          const c = bucket.categories.find((x) => x.id === t.categoryId);
          return (
            <div key={t.id} className="tx-row">
              <span className="dot" style={{ background: c?.color || "#999" }} />
              <div className="tx-meta"><div>{t.payee}</div><small>{c?.name}</small></div>
              <Money value={t.amount} />
            </div>
          );
        })}
      </section>
    </div>
    </>
  );
}

/* =============================== BUDGET ================================= */

export function Budget({ ctx }) {
  const { data, dispatch, bucket, spentByCat, plannedIncome, totalBudgeted, toBeBudgeted, setModal, cur, viewScope } = ctx;
  const method = data.settings.method;
  const expenseCats = bucket.categories.filter((c) => c.group === "expense");
  const incomeCats = bucket.categories.filter((c) => c.group === "income");

  const buckets = { need: 0, want: 0, save: 0 };
  expenseCats.forEach((c) => { buckets[c.bucket] = (buckets[c.bucket] || 0) + (spentByCat[c.id] || 0); });
  const targets = { need: plannedIncome * 0.5, want: plannedIncome * 0.3, save: plannedIncome * 0.2 };
  const scopeFor = (c) => c._scope || (viewScope === "combined" ? "personal" : viewScope);

  return (
    <div className="stack">
      <div className="section-head">
        <div><h2>Budget</h2><p className="muted">Customise every category — colour, target, rollover and bucket.</p></div>
        <div className="row-gap">
          <select className="select" value={method} onChange={(e) => dispatch({ type: "SET_SETTING", key: "method", value: e.target.value })}>
            <option value="custom">Custom</option><option value="zero">Zero-based</option><option value="503020">50 / 30 / 20</option>
          </select>
          <button className="btn" onClick={() => setModal({ type: "category" })}><Plus size={16} /> Category</button>
        </div>
      </div>

      {method === "zero" && (
        <div className={`card method-banner ${Math.abs(toBeBudgeted) < 1 ? "ok" : toBeBudgeted < 0 ? "bad" : ""}`}>
          <div><div className="kicker">To be budgeted</div><Money value={toBeBudgeted} big /></div>
          <p className="muted">{toBeBudgeted > 0 ? "Give every dollar a job — assign the rest to a category." : toBeBudgeted < 0 ? "You've assigned more than you earn. Trim a category." : "Every dollar is assigned. Nice."}</p>
        </div>
      )}

      {method === "503020" && (
        <div className="card">
          <CardHead title="50 / 30 / 20 — spent vs target" />
          {["need", "want", "save"].map((b) => {
            const labels = { need: "Needs (50%)", want: "Wants (30%)", save: "Savings (20%)" };
            const pct = targets[b] ? Math.min(100, (buckets[b] / targets[b]) * 100) : 0;
            const over = buckets[b] > targets[b];
            return (
              <div key={b} className="prog-row">
                <div className="prog-top"><span className="prog-name">{labels[b]}</span><span className="prog-num">{money(buckets[b], cur)} <small>/ {money(targets[b], cur)}</small></span></div>
                <div className="bar"><div className="bar-fill" style={{ width: `${pct}%`, background: over ? "var(--clay)" : "var(--sage)" }} /></div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <CardHead title="Income" />
        {incomeCats.length === 0 && <Empty>No income categories in this view.</Empty>}
        {incomeCats.map((c) => (
          <div key={c.id} className="cat-row">
            <span className="dot" style={{ background: c.color }} /><span className="cat-name">{c.name}</span><ScopeTag scope={c._scope} />
            <span className="cat-spacer" />
            <BudgetField c={c} dispatch={dispatch} scope={scopeFor(c)} />
            <button className="icon-btn ghost" onClick={() => setModal({ type: "category", data: c })}><Pencil size={15} /></button>
          </div>
        ))}
      </div>

      <div className="card">
        <CardHead title="Expenses" subtitle={`${money(totalBudgeted, cur)} budgeted`} />
        {expenseCats.map((c) => {
          const spent = spentByCat[c.id] || 0;
          const remaining = c.budget - spent;
          const pct = c.budget ? Math.min(100, (spent / c.budget) * 100) : 0;
          const over = spent > c.budget;
          return (
            <div key={c.id} className="cat-block">
              <div className="cat-row">
                <span className="dot" style={{ background: c.color }} /><span className="cat-name">{c.name}</span>
                <ScopeTag scope={c._scope} />
                {c.rollover && <span className="tag"><Repeat size={11} /> rollover</span>}
                <span className="bucket-tag">{c.bucket}</span>
                <span className="cat-spacer" />
                <BudgetField c={c} dispatch={dispatch} scope={scopeFor(c)} />
                <button className="icon-btn ghost" onClick={() => setModal({ type: "category", data: c })}><Pencil size={15} /></button>
                <button className="icon-btn ghost" onClick={() => dispatch({ type: "DEL_CAT", scope: scopeFor(c), id: c.id })}><Trash2 size={15} /></button>
              </div>
              <div className="cat-foot">
                <div className="bar slim"><div className="bar-fill" style={{ width: `${pct}%`, background: over ? "var(--clay)" : c.color }} /></div>
                <span className={`remaining ${over ? "neg" : ""}`}>{over ? `${money(-remaining, cur)} over` : `${money(remaining, cur)} left`}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <CardHead title="Transactions" action="Add" onAction={() => setModal({ type: "tx" })} />
        <div className="table">
          {bucket.tx.filter((t) => ctx.inMonth(t.date)).map((t) => {
            const c = bucket.categories.find((x) => x.id === t.categoryId);
            return (
              <div key={t.id} className="trow">
                <span className="tcell tdate">{t.date.slice(8, 10)}/{t.date.slice(5, 7)}</span>
                <span className="tcell tgrow">{t.payee}</span>
                <span className="tcell"><span className="dot sm" style={{ background: c?.color }} />{c?.name}</span>
                <span className="tcell tnum"><Money value={t.amount} /></span>
                <button className="icon-btn ghost" onClick={() => dispatch({ type: "DEL_TX", scope: t._scope || scopeFor(t), id: t.id })}><X size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BudgetField({ c, dispatch, scope }) {
  const [v, setV] = useState(String(c.budget));
  return (
    <span className="budget-input">
      <span className="ccy">$</span>
      <input value={v} inputMode="decimal"
        onChange={(e) => setV(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => dispatch({ type: "SET_BUDGET", scope, id: c.id, value: parseFloat(v) || 0 })} />
    </span>
  );
}

/* =========================== BILLS / CALENDAR ========================== */

export function Bills({ ctx }) {
  const { bucket, dispatch, cursor, mk, setModal, cur } = ctx;
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  bucket.bills.forEach((b) => scheduleOccurrences(b, year, month).forEach((d) => { (byDay[d] = byDay[d] || []).push(b); }));
  const upcoming = upcomingBills(bucket.bills, cursor, mk);

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="stack">
      <div className="section-head">
        <div><h2>Bills & income</h2><p className="muted">Schedule recurring money in and out. Pick a preset interval or set a custom one.</p></div>
        <div className="row-gap">
          <button className="btn ghost" onClick={() => setModal({ type: "bill", flow: "in" })}><Plus size={16} /> Income</button>
          <button className="btn" onClick={() => setModal({ type: "bill", flow: "out" })}><Plus size={16} /> Bill</button>
        </div>
      </div>

      <div className="card">
        <div className="cal-head">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="cal-grid">
          {cells.map((d, i) => (
            <div key={i} className={`cal-cell ${d ? "" : "blank"} ${d && isToday(d) ? "today" : ""}`}>
              {d && <span className="cal-day">{d}</span>}
              {d && (byDay[d] || []).map((b) => (
                <button key={b.id + "-" + d} className={`cal-bill ${b.flow === "in" ? "income" : b.autopay ? "auto" : ""}`} onClick={() => setModal({ type: "bill", data: b })} title={`${b.name} — ${money(b.amount, cur)}`}>
                  <span className="cal-bill-name">{b.name}</span>
                  <span className="cal-bill-amt">{b.flow === "in" ? "+" : ""}{money(b.amount, cur)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="cal-legend"><span><i className="lg income" /> Income</span><span><i className="lg auto" /> Autopay</span><span><i className="lg" /> Manual bill</span></div>
      </div>

      <div className="card">
        <CardHead title="Upcoming" subtitle="this month, in order" />
        {upcoming.length === 0 && <Empty>Nothing scheduled this month. Add a bill or income.</Empty>}
        {upcoming.map((b) => {
          const income = b.flow === "in";
          return (
            <div key={b.key} className="bill-row big">
              <div className={`bill-date ${income ? "in" : ""}`}><span>{b.day}</span><small>{b.mon}</small></div>
              <div className="bill-meta">
                <div className="bill-name">{b.name}
                  {income && <span className="tag tag-sage">income</span>}
                  {b.autopay && <span className="tag tag-sage"><Repeat size={11} /> PayTo</span>}
                  <ScopeTag scope={b._scope} />
                  {b.paidThisMonth && <span className="tag tag-ok"><Check size={11} /> {income ? "received" : "paid"}</span>}
                </div>
                <div className="bill-sub">{recurrenceLabel(b)} · {bucket.categories.find((c) => c.id === b.categoryId)?.name}</div>
              </div>
              <Money value={income ? b.amount : -b.amount} />
              {!b.paidThisMonth && <button className="btn ghost sm" onClick={() => dispatch({ type: "PAY_BILL", scope: b._scope || "personal", id: b.id, mk, date: todayISO() })}>{income ? "Mark received" : "Mark paid"}</button>}
              <button className="icon-btn ghost" onClick={() => setModal({ type: "bill", data: b })}><Pencil size={15} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================= INVESTMENTS ============================= */

export function Investments({ ctx }) {
  const { bucket, dispatch, portfolioValue, portfolioCost, setModal, cur } = ctx;
  const gain = portfolioValue - portfolioCost;
  const gainPct = portfolioCost ? (gain / portfolioCost) * 100 : 0;
  const byClass = {};
  bucket.holdings.forEach((h) => { byClass[h.klass] = (byClass[h.klass] || 0) + h.units * h.price; });
  const pie = Object.entries(byClass).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));

  return (
    <div className="stack">
      <div className="section-head">
        <div><h2>Investments</h2><p className="muted">Holdings synced read-only from your broker; prices from a market-data feed.</p></div>
        <div className="row-gap">
          <button className="btn ghost" onClick={() => dispatch({ type: "REFRESH_PRICES" })}><RefreshCw size={15} /> Refresh prices</button>
          <button className="btn" onClick={() => setModal({ type: "hold" })}><Plus size={16} /> Holding</button>
        </div>
      </div>

      <div className="grid">
        <section className="card span-2 hero">
          <div className="hero-grid">
            <div>
              <div className="kicker">Portfolio value</div>
              <Money value={portfolioValue} big />
              <div className="hero-sub">
                <span className={gain >= 0 ? "up" : "down"}>{gain >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {money(gain, cur)} ({gainPct.toFixed(1)}%)</span>
                <span className="muted">cost {money(portfolioCost, cur)}</span>
              </div>
            </div>
            <div style={{ width: 150, height: 150 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie.length ? pie : [{ name: "—", value: 1, color: "#dce3dc" }]} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
                    {(pie.length ? pie : [{ color: "#dce3dc" }]).map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v, cur)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
        <section className="card">
          <CardHead title="Allocation" />
          {pie.length === 0 && <Empty>Add a holding to see your mix.</Empty>}
          {pie.map((p) => (
            <div key={p.name} className="mini-row"><span><span className="dot" style={{ background: p.color }} /> {p.name}</span><span className="fig">{((p.value / portfolioValue) * 100).toFixed(0)}%</span></div>
          ))}
        </section>
      </div>

      <div className="card">
        <CardHead title="Holdings" />
        <div className="table">
          <div className="trow thead"><span className="tcell tgrow">Asset</span><span className="tcell tnum">Units</span><span className="tcell tnum">Price</span><span className="tcell tnum">Value</span><span className="tcell tnum">Gain</span><span /></div>
          {bucket.holdings.map((h) => {
            const value = h.units * h.price;
            const g = value - h.units * h.avgCost;
            return (
              <div key={h.id} className="trow">
                <span className="tcell tgrow"><strong>{h.symbol}</strong> <ScopeTag scope={h._scope} /><small className="muted block">{h.name}</small></span>
                <span className="tcell tnum">{h.units}</span>
                <span className="tcell tnum fig">{money(h.price, cur)}</span>
                <span className="tcell tnum"><Money value={value} /></span>
                <span className={`tcell tnum ${g >= 0 ? "up" : "down"}`}>{money(g, cur)}</span>
                <button className="icon-btn ghost" onClick={() => dispatch({ type: "DEL_HOLD", scope: h._scope || "personal", id: h.id })}><X size={14} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================== NET WORTH ============================== */

export function NetWorth({ ctx }) {
  const { bucket, cash, portfolioValue, debt, netWorth, cur } = ctx;
  const base = [-358000, -349000, -341500, -333000, -322000, -311300];
  const offset = Math.round(netWorth) - base[base.length - 1];
  const history = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label, i) => ({ label, value: base[i] + offset })).concat({ label: "Now", value: Math.round(netWorth) });
  const accounts = bucket.accounts;
  const liabilities = bucket.liabilities;

  return (
    <div className="stack">
      <div className="section-head"><div><h2>Net worth</h2><p className="muted">Everything you own, minus everything you owe.</p></div></div>

      <section className="card hero span-2">
        <div className="kicker">Total net worth</div>
        <Money value={netWorth} big />
        <div style={{ width: "100%", height: 180, marginTop: 14 }}>
          <ResponsiveContainer>
            <AreaChart data={history} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs><linearGradient id="nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--sage)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--sage)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={["dataMin - 20000", "dataMax + 20000"]} />
              <Tooltip formatter={(v) => money(v, cur)} />
              <Area type="monotone" dataKey="value" stroke="var(--sage)" strokeWidth={2.5} fill="url(#nw)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <CardHead title="Assets" />
          {accounts.map((a) => <div key={a.id} className="mini-row"><span>{a.name} <ScopeTag scope={a._scope} /></span><Money value={a.balance} /></div>)}
          <div className="mini-row"><span>Investments</span><Money value={portfolioValue} /></div>
          <div className="mini-row total"><span>Total assets</span><Money value={cash + portfolioValue} /></div>
        </section>
        <section className="card">
          <CardHead title="Liabilities" />
          {liabilities.length === 0 && <Empty>No debts tracked.</Empty>}
          {liabilities.map((l) => <div key={l.id} className="mini-row"><span>{l.name} <ScopeTag scope={l._scope} /></span><Money value={-l.balance} /></div>)}
          <div className="mini-row total"><span>Total debt</span><Money value={-debt} /></div>
        </section>
      </div>
    </div>
  );
}

/* ================================ GOALS ================================ */

export function Goals({ ctx }) {
  const { bucket, dispatch, setModal, cur } = ctx;
  const goals = bucket.goals;
  return (
    <div className="stack">
      <div className="section-head">
        <div><h2>Goals</h2><p className="muted">Save toward something — on your own, or jointly as a household.</p></div>
        <button className="btn" onClick={() => setModal({ type: "goal" })}><Plus size={16} /> Goal</button>
      </div>
      <div className="grid">
        {goals.length === 0 && <div className="card"><Empty>No goals yet. Add one to start tracking.</Empty></div>}
        {goals.map((g) => {
          const pct = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0;
          return (
            <section key={g.id} className="card goal-card">
              <div className="goal-top">
                <div><h3>{g.name}</h3>{g._scope && <ScopeTag scope={g._scope} />}</div>
                <button className="icon-btn ghost" onClick={() => dispatch({ type: "DEL_GOAL", scope: g._scope || "personal", id: g.id })}><Trash2 size={15} /></button>
              </div>
              <div className="goal-fig"><Money value={g.saved} /> <span className="muted">of {money(g.target, cur)}</span></div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%`, background: "var(--sage)" }} /></div>
              <div className="goal-foot">
                <span className="muted">{pct.toFixed(0)}%{g.targetDate ? ` · by ${g.targetDate}` : ""}</span>
                <span className="row-gap">
                  <button className="btn ghost sm" onClick={() => dispatch({ type: "CONTRIBUTE", scope: g._scope || "personal", id: g.id, amount: -50 })}>−$50</button>
                  <button className="btn ghost sm" onClick={() => dispatch({ type: "CONTRIBUTE", scope: g._scope || "personal", id: g.id, amount: 50 })}>+$50</button>
                </span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ============================= CONNECTIONS ============================= */

export function Connections({ ctx }) {
  const { data, dispatch, session, backend } = ctx;
  const [busy, setBusy] = useState(null);
  const [code, setCode] = useState("");
  const [shownCode, setShownCode] = useState(data.household.inviteCode || "");

  const connect = async (key, fn) => {
    setBusy(key);
    try {
      const token = backend.getToken ? await backend.getToken() : null;
      const r = await fn(token);
      if (r.redirecting) return;            // browser is navigating to the provider's consent screen
      if (r.ok) dispatch({ type: "CONNECT", key, value: true });
      else if (r.reason === "no_backend") alert("Connect a backend first.\n\nSet VITE_API_BASE to your deployed API (AWS) so Tally can start the secure consent flow with your bank/broker. See GO-LIVE.md.");
      else alert("Couldn't start the connection (" + (r.message || r.reason || "error") + ").");
    } finally { setBusy(null); }
  };

  const linkPartner = async () => {
    setBusy("partner");
    try {
      if (backend.mode === "cloud") { const r = await backend.createInvite(session, data); setShownCode(r.code); dispatch({ type: "LINK_PARTNER", name: "Partner", code: r.code, seed: false }); }
      else { dispatch({ type: "LINK_PARTNER", name: "Partner", seed: true }); setShownCode("DEMO-LINK"); }
    } finally { setBusy(null); }
  };
  const joinPartner = async () => {
    if (!code) return;
    setBusy("join");
    try {
      if (backend.mode === "cloud") await backend.acceptInvite(session, code);
      dispatch({ type: "LINK_PARTNER", name: "Partner", code, seed: backend.mode !== "cloud" });
    } catch (e) { alert(e.message); } finally { setBusy(null); }
  };

  const cards = [
    { key: "bank", title: "Bank accounts", icon: Landmark, on: data.integrations.bank, blurb: "Read-only transaction and balance feeds via the Consumer Data Right (Open Banking).", detail: "You log in at your own bank's consent screen — Tally never sees your password. Powered by an accredited provider such as Basiq or Frollo. Read access only.", cta: "Connect a bank", fn: integrationAdapters.connectBank },
    { key: "payto", title: "Bill autopay", icon: ShieldCheck, on: data.integrations.payto, blurb: "Set up PayTo mandates so approved bills pay themselves — in real time.", detail: "Each mandate is authorised inside your banking app and stored in the NPP Mandate Management Service. Pause or cancel any agreement from your bank at any time. Runs through Stripe, Adyen, GoCardless or Monoova.", cta: "Set up PayTo", fn: integrationAdapters.createPayToMandate },
    { key: "invest", title: "Investments", icon: TrendingUp, on: data.integrations.invest, blurb: "Sync holdings read-only from your broker and pull live-ish prices.", detail: "Connect CommSec, Selfwealth, Stake, Pearler and others via a portfolio aggregator (Sharesight / SnapTrade). Prices come from a market-data feed (e.g. EODHD for ASX).", cta: "Connect investments", fn: integrationAdapters.connectInvestments },
  ];

  return (
    <div className="stack">
      <div className="section-head"><div><h2>Connections & settings</h2><p className="muted">Tally is local-first — everything works offline on your device. The connected features below are Premium and always approved in the provider's own app.</p></div></div>

      {/* plan */}
      <div className={`card plan-card ${ctx.isPremium ? "premium" : ""}`}>
        <div className="connect-top"><span className="connect-icon"><Sparkles size={20} /></span><span className={`status ${ctx.isPremium ? "ok" : ""}`}>{ctx.isPremium ? "Premium" : "Free"}</span></div>
        <h3>{ctx.isPremium ? "Tally Premium" : "You're on the free plan"}</h3>
        <p className="blurb">{ctx.isPremium ? "Thanks for supporting Tally. Bank linking, autopay, device sync and an ad-free experience are unlocked." : "The full budgeting app is free. Upgrade to link your bank, autopay bills, sync across devices and remove ads."}</p>
        {ctx.isPremium
          ? <button className="btn ghost" onClick={() => cancelSubscription(dispatch)}>Switch to free (demo)</button>
          : <button className="btn" onClick={ctx.openPaywall}><Sparkles size={15} /> Upgrade to Premium</button>}
      </div>

      {/* couples / partner */}
      <div className="card partner-card">
        <div className="connect-top"><span className="connect-icon"><Users size={20} /></span><span className={`status ${data.household.linked ? "ok" : ""}`}>{data.household.linked ? "Linked" : "Solo"}</span></div>
        <h3>Partner & household</h3>
        {!data.household.linked ? (
          <>
            <p className="blurb">Link with a partner to share a household — joint accounts, joint budget, shared bills and goals — while keeping your personal money private.</p>
            <p className="detail muted">{backend.mode === "cloud" ? "Invite by sharing a code; your partner enters it on their own account to join the household." : "Local mode links a demo partner on this device so you can explore the combined view. Switch on cloud mode for real two-person linking."}</p>
            <div className="row-gap wrap">
              <button className="btn" disabled={busy === "partner"} onClick={linkPartner}><UserPlus size={15} /> {busy === "partner" ? "Linking…" : "Create household"}</button>
              <span className="join-box"><input placeholder="Enter invite code" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn ghost sm" disabled={busy === "join"} onClick={joinPartner}>Join</button></span>
            </div>
          </>
        ) : (
          <>
            <p className="blurb">You're sharing a household. Use the <strong>scope switch</strong> at the top to move between <em>Just me</em>, <em>Shared</em> and <em>Combined</em>.</p>
            {shownCode && <p className="detail muted">Invite code: <strong>{shownCode}</strong> — share it with your partner to join.</p>}
            <button className="btn ghost" onClick={() => { dispatch({ type: "UNLINK_PARTNER" }); setShownCode(""); }}>Unlink household</button>
          </>
        )}
      </div>

      <div className="connect-grid">
        {cards.map((c) => (
          <section key={c.key} className={`card connect-card ${c.on ? "on" : ""}`}>
            <div className="connect-top"><span className="connect-icon"><c.icon size={20} /></span><span className={`status ${c.on ? "ok" : ""}`}>{!ctx.isPremium ? "Premium" : c.on ? "Connected" : "Not connected"}</span></div>
            <h3>{c.title}</h3>
            <p className="blurb">{c.blurb}</p>
            <p className="detail muted">{c.detail}</p>
            {!ctx.isPremium ? (
              <button className="btn" onClick={ctx.openPaywall}><Sparkles size={14} /> Unlock with Premium</button>
            ) : (
              <button className={`btn ${c.on ? "ghost" : ""}`} disabled={busy === c.key} onClick={() => c.on ? dispatch({ type: "CONNECT", key: c.key, value: false }) : connect(c.key, c.fn)}>
                {busy === c.key ? <><Spin size={15} className="spin" /> Opening secure consent…</> : c.on ? "Disconnect" : <><Lock size={14} /> {c.cta}</>}
              </button>
            )}
          </section>
        ))}
      </div>

      <div className="card">
        <CardHead title="Preferences" />
        <div className="pref-row"><span>Display currency</span>
          <select className="select" value={data.settings.currency} onChange={(e) => dispatch({ type: "SET_SETTING", key: "currency", value: e.target.value })}>
            {["AUD", "USD", "GBP", "EUR", "NZD"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="pref-row"><span>Budget method</span>
          <select className="select" value={data.settings.method} onChange={(e) => dispatch({ type: "SET_SETTING", key: "method", value: e.target.value })}>
            <option value="custom">Custom</option><option value="zero">Zero-based</option><option value="503020">50 / 30 / 20</option>
          </select>
        </div>
      </div>

      <div className="card note"><AlertTriangle size={16} /><p>{hasBackend ? "Connections call your backend, which performs the secure consent flow with each provider. Live data also requires the provider credentials/accreditation described in GO-LIVE.md." : "Bank, autopay and investment connections need your backend (set VITE_API_BASE) plus provider credentials/accreditation — see GO-LIVE.md. Tally never stores a bank password, and is a tracking tool, not financial advice."}</p></div>
    </div>
  );
}
