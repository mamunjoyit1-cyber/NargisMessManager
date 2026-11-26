import { esc } from '../utils/html.js';
import { today, fmtDate } from '../utils/dateUtils.js';
import { fmtNum } from '../utils/i18n.js';
import { DEFAULT_ITEMS } from '../constants/items.js';
import { QUANTITY_UNITS } from '../constants/units.js';
export default {
  render(c) {
    const list = (c.d.markets || []).filter((x) => x.month === c.month).reverse();
    const canDel = (x) => c.can('approve') || (x.status === 'pending' && x.enteredBy === c.user.id);
    return `<h2>${c.t('market')}</h2><div class="card"><label>${c.t('date')}<input type="date" id="md" value="${today()}"></label>
    <h3>${c.t('participants')}</h3><div id="people"></div><button class="btn s o" id="addp">+ ${c.t('addPerson')}</button>
    <h3>${c.t('items')}</h3><div id="items"></div><button class="btn s o" id="addi">+ ${c.t('addItem')}</button>
    <datalist id="dl">${DEFAULT_ITEMS.map((i) => `<option value="${esc(i)}">`).join('')}</datalist>
    <div class="total">${c.t('totalCost')}: <b id="mt"></b><br>${c.t('cashTaken')}: <b id="mc"></b><br>${c.t('remainingCash')}: <b id="mr"></b></div>
    <div class="err" id="me"></div><button class="btn" id="msave">${c.t('save')}</button><button class="btn s o" id="mcancel" style="display:none">${c.t('cancel')}</button></div>
    <div class="card">${list.map((x) => `<div class="it"><div><b>${fmtDate(x.date)}</b> <span class="b ${x.status}">${c.t(x.status)}</span>
      <small>${esc((x.participants || []).map((p) => p.name).join(', '))} · ${c.t('remainingCash')}: ${c.money(x.remaining)}</small>
      <small>${esc((x.items || []).map((i) => `${i.name} ${fmtNum(i.qty)} ${i.unit}`).join(', '))}</small></div>
      <div class="amt">${c.money(x.amount)}${c.canEdit(x) ? `<br><button class="btn s o" data-edit="${x.id}">${c.t('edit')}</button>` : ''}${canDel(x) ? `<br><button class="btn s r" data-del="${x.id}">${c.t('del')}</button>` : ''}</div></div>`).join('') || `<p class="mu">${c.t('noData')}</p>`}</div>`;
  },
  bind(m, c) {
    let editId = null;
    const $ = (i) => m.querySelector('#' + i), val = (r, s) => r.querySelector(s).value;
    const bo = c.d.batches.map((b) => `<option>${esc(b.name)}</option>`).join(''), uo = QUANTITY_UNITS.map((u) => `<option>${esc(u)}</option>`).join('');
    const addP = () => $('people').insertAdjacentHTML('beforeend', `<div class="line p"><input class="pn" placeholder="${c.t('participant')}"><select class="pb"><option value=""></option>${bo}</select><input class="pro" placeholder="${c.t('role')}"><input class="pc" type="number" inputmode="numeric" placeholder="${c.t('cashTaken')}"><button class="x" data-rm>×</button></div>`);
    const addI = () => $('items').insertAdjacentHTML('beforeend', `<div class="line i"><input class="in w" list="dl" placeholder="${c.t('itemName')}"><input class="iq" type="number" step="any" inputmode="decimal" placeholder="${c.t('qty')}"><select class="iu">${uo}</select><input class="ip" type="number" step="any" inputmode="decimal" placeholder="${c.t('unitPrice')}"><b class="it2 mu"></b><button class="x" data-rm>×</button></div>`);
    const calc = () => {
      let tot = 0, cash = 0;
      m.querySelectorAll('.line.i').forEach((r) => { const x = (Number(val(r, '.iq')) || 0) * (Number(val(r, '.ip')) || 0); r.querySelector('.it2').textContent = x ? c.money(x) : ''; tot += x; });
      m.querySelectorAll('.line.p').forEach((r) => (cash += Number(val(r, '.pc')) || 0));
      $('mt').textContent = c.money(tot); $('mc').textContent = c.money(cash); $('mr').textContent = c.money(cash - tot);
      return { tot, cash };
    };
    m.addEventListener('input', calc);
    m.addEventListener('click', (e) => { if (e.target.dataset.rm !== undefined) { e.target.closest('.line').remove(); calc(); } });
    $('addp').onclick = addP; $('addi').onclick = addI; addP(); addI(); calc();
    const last = (s) => [...m.querySelectorAll(s)].pop();
    m.querySelectorAll('[data-edit]').forEach((el) => (el.onclick = () => { const x = c.d.markets.find((r) => r.id === el.dataset.edit); editId = x.id;
      $('md').value = x.date; $('people').innerHTML = ''; $('items').innerHTML = '';
      (x.participants.length ? x.participants : [{}]).forEach((p) => { addP(); const r = last('.line.p'); r.querySelector('.pn').value = p.name || ''; r.querySelector('.pb').value = p.batch || ''; r.querySelector('.pro').value = p.role || ''; r.querySelector('.pc').value = p.cash || ''; });
      x.items.forEach((i) => { addI(); const r = last('.line.i'); r.querySelector('.in').value = i.name; r.querySelector('.iq').value = i.qty; r.querySelector('.iu').value = i.unit; r.querySelector('.ip').value = i.price; });
      calc(); $('msave').textContent = c.t('update'); $('mcancel').style.display = ''; m.scrollIntoView?.(); }));
    $('mcancel').onclick = () => c.refresh();
    $('msave').onclick = async () => {
      const people = [...m.querySelectorAll('.line.p')].map((r) => ({ name: val(r, '.pn').trim(), batch: val(r, '.pb'), role: val(r, '.pro').trim(), cash: Number(val(r, '.pc')) || 0 })).filter((p) => p.name);
      const items = [...m.querySelectorAll('.line.i')].map((r) => { const q = Number(val(r, '.iq')) || 0, p = Number(val(r, '.ip')) || 0; return { name: val(r, '.in').trim(), qty: q, unit: val(r, '.iu'), price: p, total: q * p }; }).filter((i) => i.name && i.qty > 0);
      const { tot, cash } = calc();
      if (!items.length || !(tot > 0)) { $('me').textContent = c.t('errItems'); return; }
      const tx = `${fmtDate($('md').value)} ${c.money(tot)}`;
      if (editId) { await c.editEntry('markets', editId, { date: $('md').value, participants: people, items }, tx); return; }
      await c.submit(c, 'markets', c.t('market'), { date: $('md').value, participants: people, items, totalCost: tot, cashTaken: cash, remaining: cash - tot, amount: tot }, tx);
    };
    m.querySelectorAll('[data-del]').forEach((el) => (el.onclick = async () => { if (c.closed(c.month)) return c.toast(c.t('monthClosed')); if (!confirm(c.t('confirmDel'))) return;
      await c.db.remove('markets', el.dataset.del); await c.db.log(c.user.id, 'delete', 'markets:' + el.dataset.del); c.refresh(); }));
  },
};
