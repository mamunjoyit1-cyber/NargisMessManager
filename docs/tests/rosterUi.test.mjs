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


const db = await import('../src/services/databaseService.js');
await import('../src/app.js'); await sleep(150);
const login = async (u, p, n = '') => { set($('#u'), u); set($('#p'), p); set($('#n'), n); await click($('#go')); };
const DB = () => JSON.parse(localStorage.getItem('nmm_db_v1'));
const { ROSTER_2026_12 } = await import('../src/constants/roster.js');
await login('admin', 'admin123');
const M = DB().months[0].id; db.get().rosters[M] = structuredClone(ROSTER_2026_12); // এই মাসে তালিকা বসাই
await nav('#/more'); ok(!!$('#rapply'), 'admin sees roster apply button');
await click($('#rapply'));
const b = DB().batches; ok(b[0].name === 'B3' && b[0].totalStudents === 2 && b[11].name === 'M6' && b[11].totalStudents === 1 && b.reduce((s, x) => s + x.totalStudents, 0) === 20, 'apply: names + counts set (total 20)');
ok(DB().audit.some((a) => a.action === 'roster_apply'), 'apply logged in audit');
await nav('#/collection'); ok(/বাসনা ⭐, মিম ⭐/.test($('#cres').textContent) && $('#cts').textContent !== '', 'collection shows B3 residents with senior star');
$('#cb').value = 'b2'; $('#cb').dispatchEvent(new w.Event('change')); await sleep();
ok(/সুস্মিতা/.test($('#cres').textContent) && !/বাসনা/.test($('#cres').textContent), 'switching batch changes residents shown');
await nav('#/more'); await click($('#out'));
await login('assistant', 'assist123', 'Rima'); await nav('#/more'); ok(!$('#rapply'), 'assistant has no roster apply button');
await nav('#/collection'); ok(/বাসনা/.test($('#cres').textContent), 'assistant still sees residents');
console.log(`\nRoster UI: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
