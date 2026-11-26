import { esc } from '../utils/html.js';
import { fmtDate } from '../utils/dateUtils.js';
import { reportData } from '../utils/calculations.js';
import { exportCsv, exportWord, exportPdf, comparisonText } from '../utils/exporter.js';
export default {
  render(c) {
    const r = reportData(c.d, c.month, c.t), s = r.s;
    const k = (l, v) => `<div class="it"><div>${c.t(l)}</div><div class="amt">${v}</div></div>`;
    const rows = (l, f) => l.map(f).join('') || `<p class="mu">${c.t('noData')}</p>`;
    return `<h2>${c.t('reports')} · ${c.month}</h2><div class="card">${k('openingCash', c.money(s.opening))}${k('totalCollection', c.money(s.collection))}${k('totalDeposit', c.money(s.deposit))}${k('totalExpense', c.money(s.expense))}${k('closingCash', c.money(s.cash))}
    <p class="mu"><b>${c.t('prevCompare')}:</b> ${esc(comparisonText(r, c))}</p>
    <div class="row"><button class="btn s" id="xc">${c.t('csv')}</button><button class="btn s" id="xw">${c.t('word')}</button><button class="btn s" id="xp">${c.t('pdf')}</button></div></div>
    <h3>${c.t('batchWise')}</h3><div class="card">${rows(r.batchWise, (x) => `<div class="it"><div>${esc(x.name)}<small>${c.t('paidStudents')}: ${x.paid}</small></div><div class="amt">${c.money(x.total)}</div></div>`)}</div>
    <h3>${c.t('collectorWise')}</h3><div class="card">${rows(r.collectorWise, (x) => `<div class="it"><div>${esc(x.name)}</div><div class="amt">${c.money(x.total)}</div></div>`)}</div>
    <h3>${c.t('catWise')}</h3><div class="card">${rows(r.catWise, (x) => `<div class="it"><div>${esc(x.name)}</div><div class="amt">${c.money(x.total)}</div></div>`)}</div>
    <h3>${c.t('dayByDay')}</h3><div class="card">${rows(r.dayByDay, (x) => `<div class="it"><div><b>${fmtDate(x.date)}</b>${x.lines.map((l) => `<small>${esc(l)}</small>`).join('')}</div><div class="amt"><span style="color:var(--gn)">+${c.money(x.collection + x.deposit)}</span><br><span style="color:var(--rd)">−${c.money(x.expense)}</span></div></div>`)}</div>`;
  },
  bind(m, c) {
    const r = () => reportData(c.d, c.month, c.t);
    m.querySelector('#xc').onclick = () => exportCsv(r(), c);
    m.querySelector('#xw').onclick = () => exportWord(r(), c);
    m.querySelector('#xp').onclick = () => exportPdf(r(), c);
  },
};
