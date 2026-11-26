import { esc } from '../utils/html.js';
import { today, fmtDate } from '../utils/dateUtils.js';
import { checkAmount } from '../utils/validation.js';
const CATS = ['gas', 'water', 'fishCut', 'transport', 'other'];
export default {
  render(c) {
    const list = (c.d.expenses || []).filter((x) => x.month === c.month).reverse();
    const canDel = (x) => c.can('approve') || (x.status === 'pending' && x.enteredBy === c.user.id);
    const inp = (id, k) => `<label>${c.t(k)}<input id="${id}"></label>`;
    return `<h2>${c.t('expense')}</h2><div class="card"><label>${c.t('date')}<input type="date" id="xd" value="${today()}"></label>
    <label>${c.t('category')}<select id="xc">${CATS.map((k) => `<option value="${k}">${c.t('cat_' + k)}</option>`).join('')}</select></label>
    <label>${c.t('amount')}<input type="number" id="xa" inputmode="numeric"></label><label>${c.t('desc')}<input id="xn"></label>
    <div id="tf" style="display:none">${inp('tp', 'purpose')}${inp('tfrom', 'from')}${inp('tto', 'to')}${inp('twho', 'whoTraveled')}${inp('tty', 'transportType')}</div>
    <div class="err" id="xe"></div><button class="btn" id="xsave">${c.t('save')}</button><button class="btn s o" id="xcancel" style="display:none">${c.t('cancel')}</button></div>
    <div class="card">${list.map((x) => `<div class="it"><div><b>${c.t('cat_' + x.category)}</b> <span class="b ${x.status}">${c.t(x.status)}</span>
      <small>${fmtDate(x.date)} · ${esc(x.entryName)}${x.description ? ' · ' + esc(x.description) : ''}</small>
      ${x.transport ? `<small>${esc(x.transport.purpose)} · ${esc(x.transport.from)} → ${esc(x.transport.to)} · ${esc(x.transport.who)} · ${esc(x.transport.type)}</small>` : ''}</div>
      <div class="amt">${c.money(x.amount)}${c.canEdit(x) ? `<br><button class="btn s o" data-edit="${x.id}">${c.t('edit')}</button>` : ''}${canDel(x) ? `<br><button class="btn s r" data-del="${x.id}">${c.t('del')}</button>` : ''}</div></div>`).join('') || `<p class="mu">${c.t('noData')}</p>`}</div>`;
  },
  bind(m, c) {
    let editId = null;
    const $ = (i) => m.querySelector('#' + i);
    $('xc').onchange = () => ($('tf').style.display = $('xc').value === 'transport' ? 'block' : 'none');
    m.querySelectorAll('[data-edit]').forEach((el) => (el.onclick = () => { const x = c.d.expenses.find((r) => r.id === el.dataset.edit), tr = x.transport || {}; editId = x.id;
      $('xd').value = x.date; $('xc').value = x.category; $('xc').onchange(); $('xa').value = x.amount; $('xn').value = x.description || '';
      $('tp').value = tr.purpose || ''; $('tfrom').value = tr.from || ''; $('tto').value = tr.to || ''; $('twho').value = tr.who || ''; $('tty').value = tr.type || '';
      $('xsave').textContent = c.t('update'); $('xcancel').style.display = ''; m.scrollIntoView?.(); }));
    $('xcancel').onclick = () => c.refresh();
    $('xsave').onclick = async () => {
      const a = Number($('xa').value), cat = $('xc').value;
      if (checkAmount(a)) { $('xe').textContent = c.t('errAmount'); return; }
      const transport = cat === 'transport' ? { purpose: $('tp').value.trim(), from: $('tfrom').value.trim(), to: $('tto').value.trim(), who: $('twho').value.trim(), type: $('tty').value.trim() } : null;
      const pl = { date: $('xd').value, category: cat, amount: a, description: $('xn').value.trim(), transport }, tx = `${c.t('cat_' + cat)} ${c.money(a)}`;
      if (editId) { await c.editEntry('expenses', editId, pl, tx); return; }
      await c.submit(c, 'expenses', c.t('expense'), pl, tx);
    };
    m.querySelectorAll('[data-del]').forEach((el) => (el.onclick = async () => { if (c.closed(c.month)) return c.toast(c.t('monthClosed')); if (!confirm(c.t('confirmDel'))) return;
      await c.db.remove('expenses', el.dataset.del); await c.db.log(c.user.id, 'delete', 'expenses:' + el.dataset.del); c.refresh(); }));
  },
};
