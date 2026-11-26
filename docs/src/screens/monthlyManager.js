import { monthSummary, prevMonthId } from '../utils/calculations.js';
export default {
  render(c) {
    const ms = [...c.d.months].sort((a, b) => b.id.localeCompare(a.id));
    const card = (m) => { const s = monthSummary(c.d, m.id), open = m.status !== 'closed';
      return `<div class="card"><div class="row"><b>${m.id}</b><span class="b ${open ? 'approved' : 'rejected'}">${c.t(open ? 'statusOpen' : 'statusClosed')}</span></div>
      <div class="it"><div>${c.t('openingCash')}</div><div class="amt">${c.money(s.opening)}</div></div><div class="it"><div>${c.t('totalCollection')}</div><div class="amt">${c.money(s.collection)}</div></div>
      <div class="it"><div>${c.t('totalDeposit')}</div><div class="amt">${c.money(s.deposit)}</div></div><div class="it"><div>${c.t('totalExpense')}</div><div class="amt">${c.money(s.expense)}</div></div>
      <div class="it"><div><b>${c.t('closingCash')}</b></div><div class="amt">${c.money(s.cash)}</div></div>
      ${c.can('closeMonth') ? `<label>${c.t('openingCash')}<input type="number" data-open="${m.id}" value="${s.opening}" inputmode="numeric"></label><div class="row"><button class="btn s o" data-osave="${m.id}">${c.t('save')}</button><button class="btn s ${open ? 'r' : ''}" data-st="${m.id}">${c.t(open ? 'closeMonth' : 'reopenMonth')}</button></div>` : ''}</div>`; };
    return `<h2>${c.t('monthly')}</h2>${c.can('approve') ? `<div class="card"><label>${c.t('newMonth')}<input type="month" id="nm"></label><div class="err" id="ne"></div><button class="btn" id="nc">${c.t('createMonth')}</button></div>` : ''}${ms.map(card).join('')}`;
  },
  bind(m, c) {
    const $ = (i) => m.querySelector('#' + i);
    if ($('nc')) $('nc').onclick = async () => {
      const id = $('nm').value;
      if (!id) { $('ne').textContent = c.t('pickMonth'); return; }
      if (c.d.months.some((x) => x.id === id)) { $('ne').textContent = c.t('monthExists'); return; }
      const pm = prevMonthId(c.d, id), opening = pm ? monthSummary(c.d, pm).cash : 0; // আগের মাসের Closing = এই মাসের Opening
      await c.db.add('months', { id, openingCash: opening, status: 'open' });
      await c.db.log(c.user.id, 'month_create', id); localStorage.setItem('nmm_month', id); c.refresh();
    };
    const upd = async (id, patch, act) => { const row = c.d.months.find((x) => x.id === id); await c.db.update('months', row.id, patch); await c.db.log(c.user.id, act, id); c.refresh(); };
    m.querySelectorAll('[data-osave]').forEach((el) => (el.onclick = () => upd(el.dataset.osave, { openingCash: Number(m.querySelector(`[data-open="${el.dataset.osave}"]`).value) || 0 }, 'month_opening')));
    m.querySelectorAll('[data-st]').forEach((el) => (el.onclick = () => { const row = c.d.months.find((x) => x.id === el.dataset.st); upd(row.id, { status: row.status === 'closed' ? 'open' : 'closed' }, 'month_status'); }));
  },
};
