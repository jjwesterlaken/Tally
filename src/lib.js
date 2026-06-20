// ----------------------------------------------------------------------------
// lib.js — pure helpers + seed data. No React, no side effects.
// ----------------------------------------------------------------------------

export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const PALETTE = ["#3C7A67", "#BE7B33", "#AF4E3E", "#4F6D8C", "#7A5C8E",
  "#2E5F50", "#9A7B3F", "#5C6B66", "#C2693F"];
export const KLASSES = ["AU shares", "Intl shares", "ETF", "Crypto", "Cash", "Property"];

export function monthKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}
export function monthLabel(date) {
  return date.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}
export function money(v, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(v || 0);
}

// which calendar days in a given month a LEGACY bill lands on (old freq/dueDay shape)
export function billDaysInMonth(bill, year, month) {
  const days = [];
  const dim = new Date(year, month + 1, 0).getDate();
  if (bill.freq === "monthly" || bill.freq === "yearly") {
    days.push(Math.min(bill.dueDay, dim));
  } else if (bill.freq === "fortnightly") {
    for (let d = bill.dueDay; d <= dim; d += 14) days.push(d);
  } else if (bill.freq === "weekly") {
    for (let d = bill.dueDay; d <= dim; d += 7) days.push(d);
  }
  return days;
}

// recurrence presets offered in the UI
export const RECUR_PRESETS = [
  { id: "1w", label: "Every week", every: 1, unit: "week" },
  { id: "2w", label: "Every 2 weeks", every: 2, unit: "week" },
  { id: "1m", label: "Every month", every: 1, unit: "month" },
  { id: "1y", label: "Every year", every: 1, unit: "year" },
  { id: "once", label: "One-off", every: 0, unit: "once" },
  { id: "custom", label: "Custom…", every: 3, unit: "week" },
];
export const RECUR_UNITS = ["day", "week", "month", "year"];

export function recurrenceLabel(item) {
  if (item.every && item.unit) {
    if (item.unit === "once" || item.every === 0) return "One-off";
    const n = item.every, u = item.unit;
    if (n === 1) return { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" }[u] || `Every ${u}`;
    if (n === 2 && u === "week") return "Fortnightly";
    return `Every ${n} ${u}s`;
  }
  return { weekly: "Weekly", fortnightly: "Fortnightly", monthly: "Monthly", yearly: "Yearly" }[item.freq] || "Monthly";
}

// occurrences (day-of-month numbers) of a scheduled item within a given month.
// Supports the new { anchor, every, unit } model and the legacy { freq, dueDay }.
export function scheduleOccurrences(item, year, month) {
  if (!item.unit || !item.anchor) return billDaysInMonth(item, year, month); // legacy
  const dim = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, dim);
  const start = new Date(item.anchor);
  if (isNaN(start)) return [];
  const out = [];
  if (item.unit === "once" || item.every === 0) {
    if (start.getFullYear() === year && start.getMonth() === month) out.push(start.getDate());
    return out;
  }
  if (item.unit === "day" || item.unit === "week") {
    const stepDays = (item.unit === "week" ? 7 : 1) * item.every;
    const MS = 86400000;
    let d = new Date(start);
    if (d > monthEnd) return out;
    if (d < monthStart) { const jumps = Math.ceil((monthStart - d) / (MS * stepDays)); d = new Date(d.getTime() + jumps * stepDays * MS); }
    while (d <= monthEnd) { if (d >= monthStart) out.push(d.getDate()); d = new Date(d.getTime() + stepDays * MS); }
    return out;
  }
  // month / year
  const stepMonths = (item.unit === "year" ? 12 : 1) * item.every;
  const diff = (year - start.getFullYear()) * 12 + (month - start.getMonth());
  if (diff >= 0 && diff % stepMonths === 0) out.push(Math.min(start.getDate(), dim));
  return out;
}

// flattened, date-sorted list of scheduled items occurring in the cursor's month
export function upcomingBills(bills, cursor, mk) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monName = (d) => new Date(year, month, d).toLocaleDateString("en-AU", { month: "short" });
  const list = [];
  bills.forEach((b) => {
    scheduleOccurrences(b, year, month).forEach((d) => {
      list.push({ ...b, flow: b.flow || "out", key: b.id + "-" + d, day: d, mon: monName(d), paidThisMonth: (b.paidMonths || []).includes(mk) });
    });
  });
  return list.sort((a, b) => a.day - b.day);
}

export const emptyBucket = () => ({
  accounts: [], categories: [], tx: [], bills: [], holdings: [], liabilities: [], goals: [],
});

// ---- seed data ----------------------------------------------------------------

export function seedPersonal() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const day = (n) => new Date(y, m, n).toISOString().slice(0, 10);
  return {
    accounts: [
      { id: "p_every", name: "Everyday", balance: 3240.5, type: "transaction" },
      { id: "p_save", name: "Savings", balance: 12500, type: "savings" },
    ],
    categories: [
      { id: "pc_inc", name: "Salary", group: "income", budget: 5200, color: "#2E5F50", bucket: "income", rollover: false },
      { id: "pc_rent", name: "Rent share", group: "expense", budget: 1075, color: "#3C7A67", bucket: "need", rollover: false },
      { id: "pc_groc", name: "Groceries", group: "expense", budget: 450, color: "#4F6D8C", bucket: "need", rollover: false },
      { id: "pc_tran", name: "Transport", group: "expense", budget: 220, color: "#9A7B3F", bucket: "need", rollover: false },
      { id: "pc_dine", name: "Dining out", group: "expense", budget: 240, color: "#BE7B33", bucket: "want", rollover: true },
      { id: "pc_subs", name: "Subscriptions", group: "expense", budget: 60, color: "#AF4E3E", bucket: "want", rollover: false },
      { id: "pc_inv", name: "Investing", group: "expense", budget: 700, color: "#5C6B66", bucket: "save", rollover: false },
    ],
    tx: [
      { id: uid(), date: day(1), payee: "Acme Pty Ltd — pay", amount: 2600, categoryId: "pc_inc", accountId: "p_every" },
      { id: uid(), date: day(15), payee: "Acme Pty Ltd — pay", amount: 2600, categoryId: "pc_inc", accountId: "p_every" },
      { id: uid(), date: day(3), payee: "Woolworths", amount: -88.4, categoryId: "pc_groc", accountId: "p_every" },
      { id: uid(), date: day(9), payee: "Coles", amount: -64.15, categoryId: "pc_groc", accountId: "p_every" },
      { id: uid(), date: day(6), payee: "Opal top-up", amount: -50, categoryId: "pc_tran", accountId: "p_every" },
      { id: uid(), date: day(7), payee: "Thai Riffic", amount: -42.5, categoryId: "pc_dine", accountId: "p_every" },
      { id: uid(), date: day(4), payee: "Spotify", amount: -13.99, categoryId: "pc_subs", accountId: "p_every" },
      { id: uid(), date: day(16), payee: "Auto-invest VAS", amount: -700, categoryId: "pc_inv", accountId: "p_every" },
    ],
    bills: [
      { id: uid(), name: "Salary", amount: 2600, flow: "in", anchor: day(1), every: 2, unit: "week", categoryId: "pc_inc", autopay: false, paidMonths: [] },
      { id: uid(), name: "Phone", amount: 45, flow: "out", anchor: day(18), every: 1, unit: "month", categoryId: "pc_subs", autopay: false, paidMonths: [] },
      { id: uid(), name: "Gym", amount: 22, flow: "out", anchor: day(8), every: 1, unit: "week", categoryId: "pc_dine", autopay: true, paidMonths: [] },
    ],
    holdings: [
      { id: uid(), symbol: "VAS", name: "Vanguard Aus Shares ETF", units: 120, avgCost: 88.4, price: 101.2, klass: "AU shares" },
      { id: uid(), symbol: "VGS", name: "Vanguard Intl Shares ETF", units: 60, avgCost: 102.1, price: 132.6, klass: "Intl shares" },
    ],
    liabilities: [{ id: uid(), name: "HECS / HELP", balance: 18400 }],
    goals: [{ id: uid(), name: "Travel fund", target: 6000, saved: 2300, targetDate: `${y + 1}-01-01` }],
  };
}

// joint/household bucket — only used once a partner is linked
export function seedShared() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const day = (n) => new Date(y, m, n).toISOString().slice(0, 10);
  return {
    accounts: [
      { id: "s_joint", name: "Joint everyday", balance: 5120.75, type: "transaction" },
      { id: "s_offset", name: "Joint offset", balance: 22600, type: "offset" },
    ],
    categories: [
      { id: "sc_rent", name: "Rent / Mortgage", group: "expense", budget: 2150, color: "#3C7A67", bucket: "need", rollover: false },
      { id: "sc_util", name: "Utilities", group: "expense", budget: 320, color: "#7A5C8E", bucket: "need", rollover: false },
      { id: "sc_groc", name: "Household groceries", group: "expense", budget: 600, color: "#4F6D8C", bucket: "need", rollover: false },
      { id: "sc_house", name: "Home deposit", group: "expense", budget: 1500, color: "#2E5F50", bucket: "save", rollover: false },
    ],
    tx: [
      { id: uid(), date: day(2), payee: "Landlord", amount: -2150, categoryId: "sc_rent", accountId: "s_joint" },
      { id: uid(), date: day(5), payee: "Origin Energy", amount: -141.2, categoryId: "sc_util", accountId: "s_joint" },
      { id: uid(), date: day(11), payee: "Costco", amount: -210.3, categoryId: "sc_groc", accountId: "s_joint" },
      { id: uid(), date: day(16), payee: "To home deposit", amount: -1500, categoryId: "sc_house", accountId: "s_offset" },
    ],
    bills: [
      { id: uid(), name: "Rent", amount: 2150, flow: "out", anchor: day(2), every: 1, unit: "month", categoryId: "sc_rent", autopay: true, paidMonths: [] },
      { id: uid(), name: "Electricity", amount: 141.2, flow: "out", anchor: day(5), every: 1, unit: "month", categoryId: "sc_util", autopay: true, paidMonths: [monthKey(day(5))] },
      { id: uid(), name: "Internet", amount: 79, flow: "out", anchor: day(12), every: 1, unit: "month", categoryId: "sc_util", autopay: true, paidMonths: [] },
    ],
    holdings: [
      { id: uid(), symbol: "VDHG", name: "Vanguard Diversified High Growth", units: 90, avgCost: 58.2, price: 67.4, klass: "ETF" },
    ],
    liabilities: [{ id: uid(), name: "Home loan", balance: 412000 }],
    goals: [{ id: uid(), name: "House deposit", target: 80000, saved: 31500, targetDate: `${y + 2}-06-01` }],
  };
}

export function freshState() {
  return {
    settings: { currency: "AUD", method: "zero", productName: "Tally", plan: "free", onboarded: false },
    integrations: { bank: false, payto: false, invest: false },
    household: { linked: false, partnerName: "", inviteCode: "" },
    personal: seedPersonal(),
    shared: emptyBucket(),
  };
}

// convert an amount at a given frequency to a monthly figure
export function toMonthly(amount, freq) {
  const a = Number(amount) || 0;
  if (freq === "weekly") return Math.round((a * 52) / 12);
  if (freq === "fortnightly") return Math.round((a * 26) / 12);
  if (freq === "yearly") return Math.round(a / 12);
  return Math.round(a);
}

// build a personal bucket from the simple "what I earn / what I spend" setup
export function setupPersonal({ income, freq, items }) {
  const incMonthly = toMonthly(income, freq);
  const date = todayISO();
  const incId = uid();
  const categories = [{ id: incId, name: "Income", group: "income", budget: incMonthly, color: "#2E5F50", bucket: "income", rollover: false }];
  const tx = [{ id: uid(), date, payee: "Income", amount: incMonthly, categoryId: incId, accountId: "p_cash" }];
  let spend = 0;
  (items || []).filter((i) => Number(i.amount) > 0).forEach((i, idx) => {
    const cid = uid();
    const amt = Math.round(Number(i.amount));
    categories.push({ id: cid, name: i.name, group: "expense", budget: amt, color: PALETTE[idx % PALETTE.length], bucket: i.bucket || "need", rollover: false });
    tx.push({ id: uid(), date, payee: i.name, amount: -amt, categoryId: cid, accountId: "p_cash" });
    spend += amt;
  });
  return {
    accounts: [{ id: "p_cash", name: "Everyday", balance: Math.max(0, incMonthly - spend), type: "transaction" }],
    categories, tx, bills: [], holdings: [], liabilities: [], goals: [],
  };
}

// categories offered in the quick setup
export const SETUP_ITEMS = [
  { name: "Rent / Mortgage", bucket: "need" },
  { name: "Groceries", bucket: "need" },
  { name: "Utilities", bucket: "need" },
  { name: "Transport", bucket: "need" },
  { name: "Eating out", bucket: "want" },
  { name: "Subscriptions", bucket: "want" },
  { name: "Fun", bucket: "want" },
  { name: "Savings", bucket: "save" },
];

