import { rosterBatchPatches } from '../constants/roster.js';
import { esc } from '../utils/html.js';
import { getLang } from '../utils/i18n.js';
export default {
  render(c) {
    const bt = c.can('settings') ? `<h3>${c.t('batchSettings')}</h3><div class="card tbl">${c.d.batches.map((b) => `<div class="row"><input data-f="name" data-id="${b.id}" value="${esc(b.name)}"><input data-f="totalStudents" data-id="${b.id}" type="number" inputmode="numeric" value="${b.totalStudents}" style="width:70px"><input data-f="perStudent" data-id="${b.id}" type="number" inputmode="numeric" value="${b.perStudent}" style="width:80px"></div>`).join('')}<button class="btn" id="bsave">${c.t('save')}</button><button class="btn o" id="rapply">${c.t('applyRoster')}</button></div>` : '';
    return `<h2>${c.t('more')}</h2><div class="card"><b>${esc(c.user.name)}</b> · ${c.t('role_' + c.user.role)}</div>
    <div class="menu card" style="padding:0;overflow:hidden"><a href="#/deposit">💰 ${c.t('deposit')}</a><a href="#/expense">🧾 ${c.t('expense')}</a><a href="#/monthly">📅 ${c.t('monthly')}</a><a href="#/reports">📄 ${c.t('reports')}</a><button id="lang">${c.t('language')}</button>
    ${c.can('backup') ? `<button id="exp">${c.t('exportJson')}</button>` : ''}
    ${c.can('restore') ? `<button id="imp">${c.t('importJson')}</button><input type="file" id="impf" accept=".json" hidden>` : ''}
    <button id="out">${c.t('logout')}</button></div>${bt}<p class="mu">${c.t('soon')}</p>`;
  },
  bind(m, c) {
    const $ = (i) => m.querySelector('#' + i);
    $('lang').onclick = () => { const l = getLang() === 'bn' ? 'en' : 'bn'; localStorage.setItem('nmm_lang', l); c.setLang(l); c.refresh(); };
    $('out').onclick = () => { c.auth.logout(); c.refresh(); };
    if ($('exp')) $('exp').onclick = () => {
      const data = JSON.stringify({ ...c.d, users: c.d.users.map(({ passHash, ...u }) => u), backupAt: new Date().toISOString() }, null, 1);
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = `nargis-mess-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); c.db.log(c.user.id, 'backup', 'json');
    };
    if ($('imp')) { $('imp').onclick = () => $('impf').click(); $('impf').onchange = async (e) => {
      const f = e.target.files[0]; if (!f || !confirm(c.t('confirmImport'))) return;
      try { const data = JSON.parse(await f.text()); if (!Array.isArray(data.months) || !Array.isArray(data.batches)) throw 0; localStorage.setItem('nmm_safety', JSON.stringify(c.d)); data.users = c.d.users; await c.db.replaceAll(data); await c.db.log(c.user.id, 'restore', f.name); c.refresh(); } catch { c.toast('JSON error'); } }; }
    if ($('rapply')) $('rapply').onclick = async () => {
      const ps = rosterBatchPatches(c.d, c.month); if (!ps.length) return c.toast(c.t('noData'));
      if (!confirm(c.t('confirmRoster'))) return;
      for (const x of ps) await c.db.update('batches', x.id, { name: x.name, totalStudents: x.totalStudents });
      await c.db.log(c.user.id, 'roster_apply', c.month); c.toast(c.t('saved')); c.refresh();
    };
    if ($('bsave')) $('bsave').onclick = async () => {
      for (const el of m.querySelectorAll('[data-id]')) await c.db.update('batches', el.dataset.id, { [el.dataset.f]: el.dataset.f === 'name' ? el.value.trim() : Number(el.value) || 0 });
      await c.db.log(c.user.id, 'batch_settings', 'batches'); c.toast(c.t('saved')); c.refresh();
    };
  },
};
