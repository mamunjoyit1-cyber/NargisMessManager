// হিসাবের সব সূত্র শুধু এখানে। শুধু approved এন্ট্রি ধরা হয়।
const sum = (l) => l.reduce((s, x) => s + Number(x.amount || 0), 0);
export const approved = (l) => l.filter((x) => x.status === 'approved');
export const pendingOf = (l) => l.filter((x) => x.status === 'pending');

export function monthSummary(d, month) {
  const f = (l = []) => l.filter((x) => x.month === month);
  const opening = Number((d.months.find((m) => m.id === month) || {}).openingCash || 0);
  const collection = sum(approved(f(d.collections)));
  const deposit = sum(approved(f(d.deposits)));
  const marketExpense = sum(approved(f(d.markets)));
  const otherExpense = sum(approved(f(d.expenses)));
  const expense = marketExpense + otherExpense;
  const all = [...f(d.collections), ...f(d.deposits), ...f(d.markets), ...f(d.expenses)];
  return {
    opening, collection, deposit, marketExpense, otherExpense, expense,
    cash: opening + deposit - expense, // Opening + Approved Deposits − Approved Expenses
    notDeposited: collection - deposit,
    pendingCount: pendingOf(all).length, pendingAmount: sum(pendingOf(all)),
    unpaidCount: f(d.unpaid).filter((u) => u.status === 'unpaid').length,
    students: d.batches.reduce((s, b) => s + Number(b.totalStudents || 0), 0),
  };
}
export const allPending = (d) => ['collections', 'deposits', 'markets', 'expenses'].flatMap((col) => (d[col] || []).filter((x) => x.status === 'pending').map((x) => ({ ...x, col })));

export function prevMonthId(d, month) {
  const ids = d.months.map((m) => m.id).filter((i) => i < month).sort();
  return ids[ids.length - 1] || null;
}

// রিপোর্টের সব তথ্য (শুধু approved এন্ট্রি)
export function reportData(d, month, t) {
  const f = (l = []) => approved(l.filter((x) => x.month === month));
  const cols = f(d.collections), deps = f(d.deposits), mks = f(d.markets), exs = f(d.expenses);
  const s = monthSummary(d, month);
  const grp = (l, key) => Object.values(l.reduce((a, x) => { const n = key(x) || '-'; if (!a[n]) a[n] = { name: n, total: 0 }; a[n].total += Number(x.amount || 0); return a; }, {}));
  const batchWise = grp(cols, (x) => x.batchName).map((r) => ({ ...r, paid: cols.filter((c) => c.batchName === r.name).reduce((q, c) => q + Number(c.paidCount || 0), 0) }));
  const collectorWise = grp(cols, (x) => x.entryName);
  const catWise = [{ name: t('marketExpense'), total: s.marketExpense }, ...grp(exs, (x) => t('cat_' + x.category))].filter((r) => r.total > 0);
  const days = {};
  const day = (dt) => days[dt] || (days[dt] = { date: dt, collection: 0, deposit: 0, expense: 0, lines: [] });
  cols.forEach((x) => { const r = day(x.date); r.collection += Number(x.amount); r.lines.push(`${t('collection')}: ${x.batchName} ${x.paidCount}×${x.perStudent}`); });
  deps.forEach((x) => { const r = day(x.date); r.deposit += Number(x.amount); r.lines.push(`${t('deposit')}: ${x.batchName} → ${x.receiverName}`); });
  mks.forEach((x) => { const r = day(x.date); r.expense += Number(x.amount); r.lines.push(`${t('market')}: ${(x.items || []).map((i) => `${i.name} ${i.qty} ${i.unit}`).join(', ')}`); });
  exs.forEach((x) => { const r = day(x.date); r.expense += Number(x.amount); r.lines.push(`${t('cat_' + x.category)}${x.description ? ': ' + x.description : ''}`); });
  const pm = prevMonthId(d, month), prevExpense = pm ? monthSummary(d, pm).expense : null;
  return {
    month, s, batchWise, collectorWise, catWise, prevMonth: pm, prevExpense,
    dayByDay: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)),
    diff: prevExpense == null ? null : s.expense - prevExpense,
    unpaid: (d.unpaid || []).filter((u) => u.month === month && u.status === 'unpaid'),
  };
}
