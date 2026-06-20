// ----------------------------------------------------------------------------
// state.js — reducer + selectors. Couples model: a "personal" bucket (just you)
// and a "shared" bucket (your household). Every entity action carries a scope.
// ----------------------------------------------------------------------------
import { uid, monthKey, seedShared, emptyBucket, setupPersonal } from "./lib.js";

const upd = (state, scope, fn) => ({ ...state, [scope]: fn(state[scope]) });

export function reducer(state, a) {
  if (a.type === "HYDRATE") return a.state;
  const s = a.scope || "personal";

  switch (a.type) {
    case "ADD_TX": return upd(state, s, (b) => ({ ...b, tx: [{ id: uid(), ...a.tx }, ...b.tx] }));
    case "DEL_TX": return upd(state, s, (b) => ({ ...b, tx: b.tx.filter((t) => t.id !== a.id) }));

    case "ADD_CAT": return upd(state, s, (b) => ({ ...b, categories: [...b.categories, { id: uid(), rollover: false, ...a.cat }] }));
    case "UPD_CAT": return upd(state, s, (b) => ({ ...b, categories: b.categories.map((c) => (c.id === a.cat.id ? { ...c, ...a.cat } : c)) }));
    case "DEL_CAT": return upd(state, s, (b) => ({ ...b, categories: b.categories.filter((c) => c.id !== a.id) }));
    case "SET_BUDGET": return upd(state, s, (b) => ({ ...b, categories: b.categories.map((c) => (c.id === a.id ? { ...c, budget: a.value } : c)) }));

    case "ADD_BILL": return upd(state, s, (b) => ({ ...b, bills: [...b.bills, { id: uid(), paidMonths: [], ...a.bill }] }));
    case "UPD_BILL": return upd(state, s, (b) => ({ ...b, bills: b.bills.map((x) => (x.id === a.bill.id ? { ...x, ...a.bill } : x)) }));
    case "DEL_BILL": return upd(state, s, (b) => ({ ...b, bills: b.bills.filter((x) => x.id !== a.id) }));
    case "PAY_BILL": return upd(state, s, (b) => {
      const bill = b.bills.find((x) => x.id === a.id);
      if (!bill) return b;
      const signed = (bill.flow === "in" ? 1 : -1) * bill.amount;
      return {
        ...b,
        bills: b.bills.map((x) => (x.id === a.id ? { ...x, paidMonths: [...(x.paidMonths || []), a.mk] } : x)),
        tx: [{ id: uid(), date: a.date, payee: bill.name, amount: signed, categoryId: bill.categoryId, accountId: b.accounts[0]?.id }, ...b.tx],
      };
    });

    case "ADD_HOLD": return upd(state, s, (b) => ({ ...b, holdings: [...b.holdings, { id: uid(), ...a.hold }] }));
    case "DEL_HOLD": return upd(state, s, (b) => ({ ...b, holdings: b.holdings.filter((h) => h.id !== a.id) }));
    case "REFRESH_PRICES": {
      const bump = (b) => ({ ...b, holdings: b.holdings.map((h) => ({ ...h, price: +(h.price * (1 + (Math.random() - 0.48) * 0.04)).toFixed(2) })) });
      return { ...state, personal: bump(state.personal), shared: bump(state.shared) };
    }

    case "ADD_GOAL": return upd(state, s, (b) => ({ ...b, goals: [...b.goals, { id: uid(), saved: 0, ...a.goal }] }));
    case "DEL_GOAL": return upd(state, s, (b) => ({ ...b, goals: b.goals.filter((g) => g.id !== a.id) }));
    case "CONTRIBUTE": return upd(state, s, (b) => ({ ...b, goals: b.goals.map((g) => (g.id === a.id ? { ...g, saved: Math.max(0, g.saved + a.amount) } : g)) }));

    case "SET_SETTING": return { ...state, settings: { ...state.settings, [a.key]: a.value } };
    case "CONNECT": return { ...state, integrations: { ...state.integrations, [a.key]: a.value } };

    case "QUICK_SETUP": return { ...state, personal: setupPersonal(a.payload), settings: { ...state.settings, onboarded: true } };

    case "LINK_PARTNER": return {
      ...state,
      household: { linked: true, partnerName: a.name || "Partner", inviteCode: a.code || uid().toUpperCase() },
      shared: a.seed ? seedShared() : state.shared,
    };
    case "UNLINK_PARTNER": return { ...state, household: { linked: false, partnerName: "", inviteCode: "" }, shared: emptyBucket() };

    case "RESET": return a.state;
    default: return state;
  }
}

// Tag entities with their scope so combined views can show a badge.
const tag = (arr, scope) => arr.map((x) => ({ ...x, _scope: scope }));

export function getView(state, viewScope) {
  const p = state.personal, sh = state.shared;
  if (viewScope === "personal") return mapBucket(p, "personal");
  if (viewScope === "shared") return mapBucket(sh, "shared");
  // combined
  const keys = ["accounts", "categories", "tx", "bills", "holdings", "liabilities", "goals"];
  const out = {};
  keys.forEach((k) => { out[k] = [...tag(p[k], "personal"), ...tag(sh[k], "shared")]; });
  return out;
}
function mapBucket(b, scope) {
  const out = {};
  Object.keys(b).forEach((k) => { out[k] = tag(b[k], scope); });
  return out;
}

// Derived monthly metrics over whatever bucket-view is passed in.
export function derive(bucket, cursor) {
  const mk = monthKey(cursor);
  const inMonth = (iso) => monthKey(iso) === mk;

  const spentByCat = {};
  bucket.tx.filter((t) => inMonth(t.date) && t.amount < 0).forEach((t) => {
    spentByCat[t.categoryId] = (spentByCat[t.categoryId] || 0) + Math.abs(t.amount);
  });
  const income = bucket.tx.filter((t) => inMonth(t.date) && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenseCats = bucket.categories.filter((c) => c.group === "expense");
  const incomeCats = bucket.categories.filter((c) => c.group === "income");
  const totalBudgeted = expenseCats.reduce((s, c) => s + c.budget, 0);
  const totalSpent = Object.values(spentByCat).reduce((s, v) => s + v, 0);
  const plannedIncome = income || incomeCats.reduce((s, c) => s + c.budget, 0);
  const toBeBudgeted = plannedIncome - totalBudgeted;

  const portfolioValue = bucket.holdings.reduce((s, h) => s + h.units * h.price, 0);
  const portfolioCost = bucket.holdings.reduce((s, h) => s + h.units * h.avgCost, 0);
  const cash = bucket.accounts.reduce((s, a) => s + a.balance, 0);
  const debt = bucket.liabilities.reduce((s, l) => s + l.balance, 0);
  const netWorth = cash + portfolioValue - debt;

  return { mk, inMonth, spentByCat, income, expenseCats, incomeCats, totalBudgeted,
    totalSpent, plannedIncome, toBeBudgeted, portfolioValue, portfolioCost, cash, debt, netWorth };
}
