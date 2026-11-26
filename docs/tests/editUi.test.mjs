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
const logout = async () => { await nav('#/more'); await click($('#out')); };
const DB = () => JSON.parse(localStorage.getItem('nmm_db_v1'));
const btn = (s) => $$(s).length;
// setup: admin sets batch-1 (10 students, 100/each)
await login('admin', 'admin123'); await nav('#/more'); let ins = $$('[data-id]'); set(ins[1], '10'); set(ins[2], '100'); await click($('#bsave')); await logout();
await login('assistant', 'assist123', 'Rima');
// ---- Collection
await nav('#/collection'); set($('#cp'), '8'); await click($('#csave'));
ok(btn('[data-edit]') === 1 && DB().collections[0].status === 'pending', 'collection: pending entry shows Edit button');
await click($('[data-edit]'));
ok($('#cp').value === '8' && $('#csave').textContent.trim() === 'আপডেট' && $('#cb').disabled && $('#ccancel').style.display === '', 'collection: edit mode fills form');
set($('#cp'), '9'); await click($('#csave'));
let c0 = DB().collections; ok(c0.length === 1 && c0[0].paidCount === 9 && c0[0].amount === 900 && c0[0].status === 'pending' && c0[0].editHistory.length === 1, 'collection: edit saved in place, amount recomputed, history=1');
ok(DB().audit.some((a) => a.action === 'edit' && a.ref === 'collections:' + c0[0].id) && DB().notifications.some((n) => n.type === 'edit'), 'collection: audit + approver notification');
await click($('[data-edit]')); set($('#cp'), '99'); await click($('#csave'));
ok(DB().collections[0].paidCount === 9 && $('.toast'), 'collection: invalid edit (paid>students) rejected with toast');
await click($('#ccancel')); ok(!$('#cb').disabled && $('#csave').textContent.trim() !== 'আপডেট', 'collection: cancel resets form');
// ---- Deposit
await nav('#/deposit'); set($('#da'), '5000'); await click($('#dsave'));
await click($('[data-edit]')); ok($('#da').value === '5000' && $('#db').disabled, 'deposit: edit mode fills form');
set($('#da'), '4500'); set($('#dn'), 'note'); await click($('#dsave'));
let d0 = DB().deposits; ok(d0.length === 1 && d0[0].amount === 4500 && d0[0].note === 'note' && d0[0].editHistory.length === 1, 'deposit: edited');
// ---- Expense (transport)
await nav('#/expense'); set($('#xc'), 'transport'); $('#xc').onchange(); set($('#xa'), '300'); set($('#tp'), 'bazar'); await click($('#xsave'));
await click($('[data-edit]')); ok($('#xc').value === 'transport' && $('#tp').value === 'bazar' && $('#tf').style.display === 'block', 'expense: edit mode fills transport fields');
set($('#xa'), '350'); set($('#tto'), 'Town'); await click($('#xsave'));
let x0 = DB().expenses; ok(x0.length === 1 && x0[0].amount === 350 && x0[0].transport.to === 'Town' && x0[0].editHistory.length === 1, 'expense: edited incl. transport');
// ---- Market
await nav('#/market'); set($('.line.i .in'), 'চাল'); set($('.line.i .iq'), '2'); set($('.line.i .ip'), '100'); set($('.line.p .pn'), 'Karim'); set($('.line.p .pc'), '1000'); await click($('#msave'));
ok(DB().markets.length === 1 && DB().markets[0].amount === 200, 'market: pending created');
await click($('[data-edit]')); ok($('.line.i .iq').value === '2' && $('.line.p .pn').value === 'Karim', 'market: edit mode refills rows');
set($('.line.i .iq'), '3'); await click($('#msave'));
let m0 = DB().markets; ok(m0.length === 1 && m0[0].amount === 300 && m0[0].remaining === 700 && m0[0].editHistory.length === 1, 'market: edited, totals recomputed');
await logout();
// ---- approver: sees Edit on pending, approved loses Edit
await login('senior1', 'senior123'); await nav('#/expense'); ok(btn('[data-edit]') === 1, 'senior sees Edit on pending expense');
await nav('#/notifications'); await click($('[data-ok]')); await nav('#/expense');
ok(btn('[data-edit]') === 0 && DB().expenses[0].status === 'approved', 'approved entry has no Edit button');
await logout();
// ---- closed month hides Edit
await login('admin', 'admin123'); await nav('#/deposit'); ok(btn('[data-edit]') === 1, 'admin sees Edit on pending deposit');
await nav('#/monthly'); await click($('[data-st]')); await nav('#/deposit');
ok(btn('[data-edit]') === 0, 'closed month: Edit hidden');
console.log(`\nEdit UI: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
