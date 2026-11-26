import { esc } from '../utils/html.js';
import { fmtDate } from '../utils/dateUtils.js';
import { allPending } from '../utils/calculations.js';
const LABEL = { collections: 'collection', deposits: 'deposit', markets: 'market', expenses: 'expense' };
export default {
  render(c) {
    const ap = c.can('approve');
    const pend = ap ? allPending(c.d).reverse() : [];
    const mine = !ap ? ['collections', 'deposits', 'markets', 'expenses'].flatMap((col) => (c.d[col] || []).filter((x) => x.status === 'rejected' && x.enteredBy === c.user.id).map((x) => ({ ...x, col }))) : [];
    const card = (x, col) => `<div class="card"><b>${esc(c.t(LABEL[col]))} · ${esc(x.batchName || (x.category ? c.t('cat_' + x.category) : ''))}</b> <span class="b ${x.status}">${c.t(x.status)}</span>
      <div class="mu">${fmtDate(x.date)} · ${c.t('enteredBy')}: ${esc(x.entryName)}${x.entryBatch ? ' (' + esc(x.entryBatch) + ')' : ''}</div><div class="total">${c.money(x.amount)}</div>
      ${x.rejectReason ? `<div class="err">${c.t('reason')}: ${esc(x.rejectReason)}</div>` : ''}
      ${ap && x.status === 'pending' ? `<div class="row"><button class="btn s" data-ok="${col}:${x.id}">${c.t('approve')}</button><button class="btn s r" data-no="${col}:${x.id}">${c.t('reject')}</button></div>` : ''}</div>`;
    const logs = c.d.notifications.slice(-15).reverse().map((n) => `<div class="it"><div>${esc(n.text)}<small>${esc(n.by || '')} · ${new Date(n.createdAt).toLocaleString()}</small></div></div>`).join('');
    return `<h2>${c.t('notifications')}</h2>${pend.map((x) => card(x, x.col)).join('')}
    ${mine.length ? `<h3>${c.t('myRejected')}</h3>${mine.map((x) => card(x, x.col)).join('')}` : ''}
    ${!pend.length && !mine.length ? `<p class="mu">${c.t('noData')}</p>` : ''}<h3>${c.t('recent')}</h3><div class="card">${logs || `<p class="mu">${c.t('noData')}</p>`}</div>`;
  },
  bind(m, c) {
    const decide = async (key, ok) => {
      const [col, id] = key.split(':'), x = c.d[col].find((r) => r.id === id); let reason = '';
      if (c.closed(x.month)) return c.toast(c.t('monthClosed')); if (!ok) { reason = (prompt(c.t('rejectReason')) || '').trim(); if (!reason) return; }
      await c.db.update(col, id, { status: ok ? 'approved' : 'rejected', decidedBy: c.user.id, decidedAt: new Date().toISOString(), rejectReason: reason });
      await c.db.log(c.user.id, ok ? 'approve' : 'reject', key, reason);
      await c.db.add('notifications', { type: ok ? 'approved' : 'rejected', text: `${c.t(ok ? 'approved' : 'rejected')}: ${x.batchName || ''} ${c.money(x.amount)}`, by: c.user.name });
      c.refresh();
    };
    m.querySelectorAll('[data-ok]').forEach((el) => (el.onclick = () => decide(el.dataset.ok, true)));
    m.querySelectorAll('[data-no]').forEach((el) => (el.onclick = () => decide(el.dataset.no, false)));
  },
};
