import { esc } from '../utils/html.js';
export default {
  mount(root, c) {
    const opts = c.d.batches.map((b) => `<option>${esc(b.name)}</option>`).join('');
    root.innerHTML = `<div class="login"><h1>${esc(c.d.settings.collegeNameBn)}</h1><p class="mu" style="text-align:center">${esc(c.d.settings.hostelName)}</p>
    <div class="card"><label>${c.t('userId')}<input id="u" autocapitalize="none" autocomplete="username"></label>
    <label>${c.t('password')}<input id="p" type="password" autocomplete="current-password"></label>
    <label>${c.t('entryName')}<input id="n"></label><label>${c.t('entryBatch')}<select id="b"><option value=""></option>${opts}</select></label>
    <div class="err" id="e"></div><button class="btn" id="go">${c.t('login')}</button><p class="mu">${c.t('demoNote')}</p></div></div>`;
    const $ = (i) => root.querySelector('#' + i);
    $('go').onclick = async () => {
      const r = await c.auth.login(c.db, $('u').value, $('p').value, { name: $('n').value, batch: $('b').value });
      if (r.ok) c.onDone(); else $('e').textContent = c.t(r.err);
    };
  },
};
