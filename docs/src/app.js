import * as db from './services/databaseService.js';
import * as auth from './services/authService.js';
import { t, setLang, fmtNum, money } from './utils/i18n.js';
import { can } from './constants/roles.js';
import { esc } from './utils/html.js';
import { thisMonth } from './utils/dateUtils.js';
import { allPending } from './utils/calculations.js';
import { buildEdit, canEditEntry } from './utils/entryEdit.js';
import login from './screens/login.js';
import dashboard from './screens/dashboard.js';
import collection from './screens/collection.js';
import cashDeposit from './screens/cashDeposit.js';
import notification from './screens/notification.js';
import more from './screens/more.js';
import market from './screens/market.js';
import expense from './screens/expense.js';
import monthly from './screens/monthlyManager.js';
import reports from './screens/reports.js';

const screens = { dashboard, collection, deposit: cashDeposit, market, expense, monthly, reports, notifications: notification, more };
const NAV = [['dashboard', '📊'], ['collection', '🧾'], ['market', '🛒'], ['notifications', '🔔'], ['more', '☰']];
const root = document.getElementById('app');

function toast(msg) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = msg; document.body.append(e); setTimeout(() => e.remove(), 2200); }

// নতুন এন্ট্রি: Assistant হলে Pending, Admin/Senior হলে সরাসরি Approved
async function submit(c, col, label, obj, text, noApproval = false) {
  const m = c.d.months.find((x) => x.id === c.month);
  if (m && m.status === 'closed') { toast(t('monthClosed')); return null; }
  const ap = c.can('approve'), now = new Date().toISOString();
  const base = { month: c.month, enteredBy: c.user.id, entryName: c.entry.name || c.user.name, entryBatch: c.entry.batch || '' };
  const r = await db.add(col, noApproval ? { ...base, ...obj } : { ...base, status: ap ? 'approved' : 'pending', decidedBy: ap ? c.user.id : null, decidedAt: ap ? now : null, ...obj });
  await db.log(c.user.id, 'create', `${col}:${r.id}`, text);
  if (!ap && !noApproval) await db.add('notifications', { type: 'new', text: `${label}: ${text}`, by: r.entryName });
  toast(t('saved')); render(); return r;
}

const LABEL = { collections: 'collection', deposits: 'deposit', markets: 'market', expenses: 'expense' };
// Pending এন্ট্রি Edit: নিয়ম entryEdit.js-এ; এখানে শুধু সংরক্ষণ, Audit ও Notification
async function editEntry(c, col, id, patch, text) {
  const x = c.d[col].find((r) => r.id === id);
  const r = x ? buildEdit(col, x, patch, c.user, c.closed(x.month)) : { ok: false, reason: 'notFound' };
  if (!r.ok) { toast(t(r.reason)); return r; }
  await db.update(col, id, r.update);
  await db.log(c.user.id, r.action, `${col}:${id}`, text);
  if (!c.can('approve')) await db.add('notifications', { type: 'edit', text: `${t(LABEL[col])} (${t('edit')}): ${text}`, by: x.entryName });
  toast(t('saved')); render(); return r;
}

function render() {
  const d = db.get(), user = auth.currentUser(d);
  if (!user) { login.mount(root, { t, d, db, auth, onDone: render }); return; }
  const route = location.hash.slice(2) || 'dashboard', scr = screens[route] || dashboard, id = screens[route] ? route : 'dashboard';
  const navId = ['deposit', 'expense', 'monthly', 'reports'].includes(id) ? 'more' : id;
  const saved = localStorage.getItem('nmm_month');
  const month = d.months.some((m) => m.id === saved) ? saved : thisMonth();
  const c = { d, user, month, t, money, db, auth, setLang, toast, submit, refresh: render, can: (p) => can(user.role, p), closed: (mid) => (d.months.find((m) => m.id === mid) || {}).status === 'closed', entry: auth.entryInfo() };
  c.editEntry = (col, id, patch, text) => editEntry(c, col, id, patch, text);
  c.canEdit = (x) => x.status === 'pending' && canEditEntry(x, user, c.closed(x.month)).ok;
  const badge = c.can('approve') ? allPending(d).length : 0;
  root.innerHTML = `<header><b>${esc(d.settings.collegeNameBn)}</b><select id="mon">${d.months.map((m) => `<option ${m.id === month ? 'selected' : ''}>${m.id}</option>`).join('')}</select></header>
  <main id="main">${scr.render(c)}</main><nav>${NAV.map(([r, i]) => `<a href="#/${r}" class="${r === navId ? 'on' : ''}"><span>${i}</span>${t(r)}${r === 'notifications' && badge ? `<i>${fmtNum(badge)}</i>` : ''}</a>`).join('')}</nav>`;
  root.querySelector('#mon').onchange = (e) => { localStorage.setItem('nmm_month', e.target.value); render(); };
  scr.bind(root.querySelector('#main'), c);
}

(async () => {
  await db.init(); await auth.seed(db);
  setLang(localStorage.getItem('nmm_lang') || 'bn');
  window.addEventListener('hashchange', render); render();
})();
