import { rosterFor, residentsText } from '../constants/roster.js';
import { esc } from '../utils/html.js';
import { today, fmtDate } from '../utils/dateUtils.js';
import { fmtNum } from '../utils/i18n.js';
import { checkCollection, checkAmount } from '../utils/validation.js';
export default {
  render(c) {
    const opts = c.d.batches.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
    const list = c.d.collections.filter((x) => x.month === c.month).reverse();
    const unp = c.d.unpaid.filter((x) => x.month === c.month).reverse();
    const canDel = (x) => c.can('approve') || (x.status === 'pending' && x.enteredBy === c.user.id);
    return `<h2>${c.t('collection')}</h2><div class="card"><label>${c.t('batch')}<select id="cb">${opts}</select></label>
    <label>${c.t('date')}<input type="date" id="cd" value="${today()}"></label>
    <div class="row"><div>${c.t('totalStudents')}: <b id="cts">0</b></div><div>${c.t('unpaidCount')}: <b id="cun">0</b></div></div>
    <p class="err" id="hint"></p><p class="mu" id="cres"></p>
    <label>${c.t('paidCount')}<input type="number" id="cp" inputmode="numeric" min="0"></label>
    <label>${c.t('perStudent')}<input type="number" id="cps" inputmode="numeric" min="0"></label>
    <div class="total">${c.t('total')}: <b id="ctot"></b></div><div class="err" id="ce"></div><button class="btn" id="csave">${c.t('save')}</button><button class="btn s o" id="ccancel" style="display:none">${c.t('cancel')}</button></div>
    <div class="card">${list.map((x) => `<div class="it"><div><b>${esc(x.batchName)}</b> <span class="b ${x.status}">${c.t(x.status)}</span><small>${fmtDate(x.date)} · ${fmtNum(x.paidCount)}/${fmtNum(x.totalStudents)} × ${c.money(x.perStudent)} · ${esc(x.entryName)}</small></div><div class="amt">${c.money(x.amount)}${c.canEdit(x) ? `<br><button class="btn s o" data-edit="${x.id}">${c.t('edit')}</button>` : ''}${canDel(x) ? `<br><button class="btn s r" data-del="collections:${x.id}">${c.t('del')}</button>` : ''}</div></div>`).join('') || `<p class="mu">${c.t('noData')}</p>`}</div>
    <h3>${c.t('unpaidList')}</h3><div class="card"><label>${c.t('studentName')}<input id="un"></label><label>${c.t('due')}<input type="number" id="ua" inputmode="numeric"></label><div class="err" id="ue"></div><button class="btn o" id="usave">${c.t('addUnpaid')}</button></div>
    <div class="card">${unp.map((x) => `<div class="it"><div><b>${esc(x.studentName)}</b> <span class="b ${x.status === 'paid' ? 'approved' : 'pending'}">${x.status === 'paid' ? c.t('paid') : c.t('unpaidCount')}</span><small>${esc(x.batchName)} · ${esc(x.entryName)}${x.paidDate ? ' · ' + fmtDate(x.paidDate) : ''}</small></div><div class="amt">${c.money(x.amount)}${x.status === 'unpaid' ? `<br><button class="btn s" data-paid="${x.id}">${c.t('markPaid')}</button>` : ''}</div></div>`).join('') || `<p class="mu">${c.t('noData')}</p>`}</div>`;
  },
  bind(m, c) {
    let editId = null;
    const $ = (i) => m.querySelector('#' + i), bOf = () => c.d.batches.find((b) => b.id === $('cb').value);
    const calc = () => { const b = bOf(), paid = Number($('cp').value) || 0, per = Number($('cps').value) || 0;
      $('cts').textContent = fmtNum(b.totalStudents); $('cun').textContent = fmtNum(Math.max(0, b.totalStudents - paid)); $('ctot').textContent = c.money(paid * per);
      $('hint').textContent = b.totalStudents ? '' : c.t('setStudentsHint');
      const ro = rosterFor(c.d, c.month, b.name); $('cres').textContent = ro ? `${c.t('residents')}: ${residentsText(ro)}` : ''; };
    $('cb').onchange = () => { $('cps').value = bOf().perStudent || ''; calc(); };
    $('cp').oninput = $('cps').oninput = calc; $('cps').value = bOf().perStudent || ''; calc();
    m.querySelectorAll('[data-edit]').forEach((el) => (el.onclick = () => { const x = c.d.collections.find((r) => r.id === el.dataset.edit); editId = x.id;
      $('cb').value = x.batchId; $('cb').disabled = true; $('cd').value = x.date; $('cp').value = x.paidCount; $('cps').value = x.perStudent; calc();
      $('csave').textContent = c.t('update'); $('ccancel').style.display = ''; m.scrollIntoView?.(); }));
    $('ccancel').onclick = () => c.refresh();
    $('csave').onclick = async () => {
      const b = bOf(), paid = Number($('cp').value), per = Number($('cps').value), err = checkCollection({ paid, per, total: b.totalStudents });
      if (editId) { await c.editEntry('collections', editId, { date: $('cd').value, paidCount: paid, perStudent: per }, `${b.name} ${paid}×${per}`); return; }
      if (err) { $('ce').textContent = c.t(err); return; }
      await c.submit(c, 'collections', c.t('collection'), { batchId: b.id, batchName: b.name, date: $('cd').value, totalStudents: b.totalStudents, paidCount: paid, perStudent: per, amount: paid * per }, `${b.name} ${paid}×${per}`);
    };
    $('usave').onclick = async () => {
      const b = bOf(), a = Number($('ua').value), name = $('un').value.trim();
      if (!name || checkAmount(a)) { $('ue').textContent = c.t('errAmount'); return; }
      await c.submit(c, 'unpaid', c.t('unpaidList'), { batchId: b.id, batchName: b.name, studentName: name, amount: a, status: 'unpaid', history: [] }, `${name} ${a}`, true);
    };
    m.querySelectorAll('[data-paid]').forEach((el) => (el.onclick = async () => { const r = c.d.unpaid.find((x) => x.id === el.dataset.paid);
      await c.db.update('unpaid', r.id, { status: 'paid', paidDate: today(), history: [...(r.history || []), { at: new Date().toISOString(), by: c.user.id, to: 'paid' }] });
      await c.db.log(c.user.id, 'unpaid_paid', 'unpaid:' + r.id); c.refresh(); }));
    m.querySelectorAll('[data-del]').forEach((el) => (el.onclick = async () => { if (c.closed(c.month)) return c.toast(c.t('monthClosed')); if (!confirm(c.t('confirmDel'))) return; const [col, id] = el.dataset.del.split(':');
      await c.db.remove(col, id); await c.db.log(c.user.id, 'delete', el.dataset.del); c.refresh(); }));
  },
};
