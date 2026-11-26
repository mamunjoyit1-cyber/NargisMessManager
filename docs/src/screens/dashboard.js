import { monthSummary } from '../utils/calculations.js';
import { fmtNum } from '../utils/i18n.js';
export default {
  render(c) {
    const s = monthSummary(c.d, c.month), full = c.can('approve');
    const k = (l, v, cl = '') => `<div class="card ${cl}"><small>${c.t(l)}</small><b>${v}</b></div>`;
    return `<h2>${c.t('dashboard')} · ${c.month}</h2><div class="grid">
    ${full ? k('cash', c.money(s.cash), 'cash') : ''}
    ${k('totalBatches', fmtNum(c.d.batches.length))}${k('totalStudents', fmtNum(s.students))}
    ${k('totalCollection', c.money(s.collection))}${full ? k('totalDeposit', c.money(s.deposit)) : k('unpaidStudents', fmtNum(s.unpaidCount))}
    ${full ? k('marketExpense', c.money(s.marketExpense)) + k('otherExpense', c.money(s.otherExpense)) + k('pendingDeposit', c.money(s.notDeposited)) + k('unpaidStudents', fmtNum(s.unpaidCount)) : ''}
    ${k('pendingCount', fmtNum(s.pendingCount))}${k('pendingAmount', c.money(s.pendingAmount))}</div>`;
  },
  bind() {},
};
