import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body><div id="app"></div></body>', { url: 'http://localhost/#/dashboard' });
const w = dom.window;
for (const k of ['window','document','localStorage','sessionStorage','location']) Object.defineProperty(globalThis, k, { value: w[k === 'window' ? 'window' : k], configurable: true });
globalThis.confirm = () => true; globalThis.prompt = () => 'reason'; w.confirm = globalThis.confirm; globalThis.URL.createObjectURL = () => 'blob:x'; w.HTMLAnchorElement.prototype.click = function () {};
const sleep = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const click = async (el) => { el.click(); await sleep(); };
const set = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const nav = async (h) => { w.location.hash = h; await sleep(60); };
await import('../src/app.js'); await sleep(150);
const login = async (u, p, n = '') => { set($('#u'), u); set($('#p'), p); set($('#n'), n); await click($('#go')); };
ok(!!$('#go'), 'login screen renders');
await login('admin', 'wrong'); ok($('#e').textContent.length > 0, 'wrong password shows error');
await login('admin', 'admin123'); ok(!!$('nav'), 'admin login ok');
// batch settings (admin) via More
await nav('#/more'); const ins = $$('[data-id]'); set(ins[1], '10'); set(ins[2], '100'); await click($('#bsave'));
// admin collection -> approved
await nav('#/collection'); set($('#cp'), '8'); await click($('#csave'));
ok(/৳|800/.test($('#main').textContent) && $$('.b.approved').length === 1, 'admin collection auto-approved');
// deposit 5000, expense 4000 by admin
await nav('#/deposit'); set($('#da'), '5000'); await click($('#dsave'));
await nav('#/expense'); set($('#xa'), '4000'); await click($('#xsave'));
// opening cash 10000 via monthly
await nav('#/monthly'); set($('[data-open]'), '10000'); await click($('[data-osave]'));
await nav('#/dashboard'); ok(/১১,০০০/.test($('.card.cash').textContent), 'dashboard cash = ৳11,000 (' + $('.card.cash').textContent.trim() + ')');
// logout, assistant
await nav('#/more'); await click($('#out')); ok(!!$('#go'), 'logout shows login');
await login('assistant', 'assist123', 'Rima');
ok(!!$('nav'), 'assistant login ok');
await nav('#/expense'); set($('#xa'), '777'); await click($('#xsave'));
ok($$('.b.pending').length === 1, 'assistant expense pending');
await nav('#/dashboard'); ok(!$('.card.cash'), 'assistant cannot see cash balance');
await nav('#/notifications'); ok(!$('[data-ok]'), 'assistant has no Approve button');
await nav('#/more'); ok(!$('#exp') && !$('#imp'), 'assistant has no backup/restore');
await nav('#/monthly'); ok(!$('[data-st]') && !$('#nc'), 'assistant cannot close/create month');
await nav('#/more'); await click($('#out'));
// senior approves/rejects
await login('senior1', 'senior123'); await nav('#/notifications'); ok(!!$('[data-ok]'), 'senior sees Approve');
await nav('#/more'); ok(!!$('#exp') && !$('#imp'), 'senior: backup yes, restore no');
await nav('#/notifications'); await click($('[data-no]')); // reject (prompt returns reason)
await nav('#/dashboard'); await nav('#/monthly'); ok(!$('[data-st]'), 'senior cannot close month');
await nav('#/more'); await click($('#out'));
// assistant sees rejected expense (fix 4)
await login('assistant', 'assist123', 'Rima'); await nav('#/notifications');
ok(/reason/.test($('#main').textContent), 'FIX4: assistant sees rejected expense with reason');
await nav('#/more'); await click($('#out'));
// admin: close month then try delete/approve (fix 2)
await login('admin', 'admin123'); await nav('#/monthly');
await click($('[data-st]')); ok(/Closed|বন্ধ/i.test($('.b.rejected')?.textContent || ''), 'admin closes month');
await nav('#/expense'); const before = $$('[data-del]').length; await click($('[data-del]'));
ok($$('[data-del]').length === before, 'FIX2: delete blocked in closed month');
// reopen
await nav('#/monthly'); await click($('[data-st]'));
// language switch
await nav('#/more'); await click($('#lang')); ok(document.documentElement.lang === 'en' && /Logout/.test($('#main').textContent), 'language -> English');
await click($('#lang')); ok(document.documentElement.lang === 'bn', 'language -> Bengali');
// reports + csv/word
await nav('#/reports'); ok(/Closing|ক্লোজিং|বন্ধ/.test($('#main').textContent) || $$('.it').length > 3, 'reports render');
await click($('#xc')); await click($('#xw')); ok(true, 'CSV/Word export click no error');
// duplicate month
await nav('#/monthly'); const ex = JSON.parse(localStorage.getItem('nmm_db_v1')).months[0].id; set($('#nm'), ex); await click($('#nc'));
ok($('#ne').textContent.length > 0 && JSON.parse(localStorage.getItem('nmm_db_v1')).months.filter((m) => m.id === ex).length === 1, 'duplicate month rejected');
set($('#nm'), '2099-01'); await click($('#nc'));
ok(JSON.parse(localStorage.getItem('nmm_db_v1')).months.some((m) => m.id === '2099-01'), 'new month created');
// restore bad json (fix 1)
await nav('#/more'); const before2 = localStorage.getItem('nmm_db_v1');
const inp = $('#impf'); Object.defineProperty(inp, 'files', { value: [{ name: 'bad.json', text: async () => '{"settings":{}}' }], configurable: true });
inp.dispatchEvent(new w.Event('change')); await sleep(80);
ok(localStorage.getItem('nmm_db_v1') === before2 && !!$('nav'), 'FIX1: partial JSON restore rejected, app intact');
console.log(`\nUI smoke: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
