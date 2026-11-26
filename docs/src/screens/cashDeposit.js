import { esc } from '../utils/html.js';
import { today, fmtDate } from '../utils/dateUtils.js';
import { checkAmount } from '../utils/validation.js';
export default {
  render(c) {
    const opts = c.d.batches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
    const seniors = c.d.users.filter((u) => u.role === 'senior' && u.active).map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
    const list = c.d.deposits.filter((x) => x.month === c.month).reverse();
    const canDel = (x) => c.can('approve') || (x.status === 'pending' && x.enteredBy === c.user.id);
    return `<h2>${c.t('deposit')}</h2><div class="card"><label>${c.t('batch')}<select id="db">${opts}</select></label>
    <label>${c.t('date')}<input type="date" id="dd" value="${today()}"></label>
    <label>${c.t('collector')}<input id="dc" value="${esc(c.entry.name || c.user.name)}"></label>
    <label>${c.t('amount')}<input type="number" id="da" inputmode="numeric"></label>
    <label>${c.t('receiver')}<select id="dr">${seniors}</select></label>
    <label>${c.t('desc')}<input id="dn"></label><div class="err" id="de"></div><button class="btn" id="dsave">${c.t('save')}</button><button class="btn s o" id="dcancel" style="display:none">${c.t('cancel')}</button></div>
    <div class="card">${list.map((x) => `<div class="it"><div><b>${esc(x.batchName)}</b> <span class="b ${x.status}">${c.t(x.status)}</span><small>${fmtDate(x.date)} · ${esc(x.collector)} → ${esc(x.receiverName)}${x.note ? ' · ' + esc(x.note) : ''}</small></div><div class="amt">${c.money(x.amount)}${c.canEdit(x) ? `<br><button class="btn s o" data-edit="${x.id}">${c.t('edit')}</button>` : ''}${canDel(x) ? `<br><button class="btn s r" data-del="${x.id}">${c.t('del')}</button>` : ''}</div></div>`).join('') || `<p class="mu">${c.t('noData')}</p>`}</div>`;
  },
  bind(m, c) {
    let editId = null;
    const $ = (i) => m.querySelector('#' + i);
    m.querySelectorAll('[data-edit]').forEach((el) => (el.onclick = () => { const x = c.d.deposits.find((r) => r.id === el.dataset.edit); editId = x.id;
      $('db').value = x.batchId; $('db').disabled = true; $('dd').value = x.date; $('dc').value = x.collector || ''; $('da').value = x.amount; $('dr').value = x.receiverId; $('dn').value = x.note || '';
      $('dsave').textContent = c.t('update'); $('dcancel').style.display = ''; m.scrollIntoView?.(); }));
    $('dcancel').onclick = () => c.refresh();
    $('dsave').onclick = async () => {
      const a = Number($('da').value), b = c.d.batches.find((x) => x.id === $('db').value), r = $('dr');
      if (editId) { await c.editEntry('deposits', editId, { date: $('dd').value, collector: $('dc').value.trim(), amount: a, receiverId: r.value, receiverName: r.selectedOptions[0]?.text || '', note: $('dn').value.trim() }, `${b.name} ${a}`); return; }
      if (checkAmount(a)) { $('de').textContent = c.t('errAmount'); return; }
      await c.submit(c, 'deposits', c.t('deposit'), { batchId: b.id, batchName: b.name, date: $('dd').value, collector: $('dc').value.trim(), amount: a, receiverId: r.value, receiverName: r.selectedOptions[0]?.text || '', note: $('dn').value.trim() }, `${b.name} ${a}`);
    };
    m.querySelectorAll('[data-del]').forEach((el) => (el.onclick = async () => { if (c.closed(c.month)) return c.toast(c.t('monthClosed')); if (!confirm(c.t('confirmDel'))) return;
      await c.db.remove('deposits', el.dataset.del); await c.db.log(c.user.id, 'delete', 'deposits:' + el.dataset.del); c.refresh(); }));
  },
};
