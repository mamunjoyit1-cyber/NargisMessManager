import { esc } from './html.js';
import { fmtDate } from './dateUtils.js';
const download = (name, mime, content) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
export const comparisonText = (r, c) => (r.diff == null ? '-' : (r.diff > 0 ? c.t('cmpMore') : r.diff < 0 ? c.t('cmpLess') : c.t('cmpSame')).replace('{n}', c.money(Math.abs(r.diff))));

export function exportCsv(r, c) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`, s = r.s, t = c.t;
  const rows = [[c.d.settings.collegeName, t('monthly'), r.month], [t('openingCash'), s.opening], [t('totalCollection'), s.collection], [t('totalDeposit'), s.deposit], [t('totalExpense'), s.expense], [t('closingCash'), s.cash], [t('prevCompare'), comparisonText(r, c)], [],
    [t('batchWise')], [t('batch'), t('paidStudents'), t('amount')], ...r.batchWise.map((x) => [x.name, x.paid, x.total]), [],
    [t('catWise')], ...r.catWise.map((x) => [x.name, x.total]), [],
    [t('dayByDay')], [t('date'), t('collection'), t('deposit'), t('totalExpense'), t('details')], ...r.dayByDay.map((x) => [fmtDate(x.date), x.collection, x.deposit, x.expense, x.lines.join(' | ')])];
  download(`Mess_Report_${r.month}.csv`, 'text/csv;charset=utf-8', '\uFEFF' + rows.map((a) => a.map(q).join(',')).join('\n'));
}

export function buildHtml(r, c) {
  const t = c.t, m = c.money, s = r.s, st = c.d.settings;
  const tbl = (heads, rows) => `<table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr>${x.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${heads.length}">${t('noData')}</td></tr>`}</tbody></table>`;
  return `<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:14px;color:#1e293b}h1{color:#1b4d3e;font-size:20px;margin:0}h2{color:#0f766e;font-size:15px;margin-top:18px;border-bottom:1px solid #cbd5e1}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}th,td{border:1px solid #cbd5e1;padding:5px 7px;text-align:left;vertical-align:top}th{background:#e2e8f0}.box{background:#f1f5f9;padding:8px;margin:8px 0;font-size:13px}</style></head><body>
<h1>${esc(st.collegeNameBn)} (${esc(st.collegeName)})</h1><div>${esc(st.hostelName)} · ${esc(r.month)}</div>
<div class="box">${t('openingCash')}: ${m(s.opening)} | ${t('totalCollection')}: ${m(s.collection)} | ${t('totalDeposit')}: ${m(s.deposit)} | ${t('totalExpense')}: ${m(s.expense)} | <b>${t('closingCash')}: ${m(s.cash)}</b><br>${t('prevCompare')}: ${esc(comparisonText(r, c))} | ${t('pendingCount')}: ${s.pendingCount}</div>
<h2>${t('batchWise')}</h2>${tbl([t('batch'), t('paidStudents'), t('amount')], r.batchWise.map((x) => [esc(x.name), x.paid, m(x.total)]))}
<h2>${t('catWise')}</h2>${tbl([t('category'), t('amount')], r.catWise.map((x) => [esc(x.name), m(x.total)]))}
<h2>${t('unpaidList')}</h2>${tbl([t('studentName'), t('batch'), t('due')], r.unpaid.map((x) => [esc(x.studentName), esc(x.batchName), m(x.amount)]))}
<h2>${t('dayByDay')}</h2>${tbl([t('date'), t('collection'), t('deposit'), t('totalExpense'), t('details')], r.dayByDay.map((x) => [fmtDate(x.date), m(x.collection), m(x.deposit), m(x.expense), x.lines.map(esc).join('<br>')]))}</body></html>`;
}
export const exportWord = (r, c) => download(`Mess_Report_${r.month}.doc`, 'application/msword', buildHtml(r, c));
export function exportPdf(r, c) {
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0'; f.srcdoc = buildHtml(r, c);
  f.onload = () => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 60000); }; document.body.append(f);
}
