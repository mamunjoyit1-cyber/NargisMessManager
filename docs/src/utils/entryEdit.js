// Phase 4A / Task 1: Entry edit rules (pure functions — no DOM, no storage).
// Pending/Rejected entry edit + resubmit. Approved entries are locked (correction workflow comes in Task 4).
import { can } from '../constants/roles.js';
import { checkCollection, checkAmount } from './validation.js';

export const EDITABLE = {
  collections: ['date', 'paidCount', 'perStudent'],
  deposits: ['date', 'collector', 'amount', 'receiverId', 'receiverName', 'note'],
  markets: ['date', 'participants', 'items'],
  expenses: ['date', 'category', 'amount', 'description', 'transport'],
};
const num = (v) => Number(v) || 0;
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function canEditEntry(entry, user, monthClosed) {
  if (!entry || !user) return { ok: false, reason: 'notFound' };
  if (monthClosed) return { ok: false, reason: 'monthClosed' };
  if (entry.status === 'approved') return { ok: false, reason: 'needsCorrection' };
  if (entry.status !== 'pending' && entry.status !== 'rejected') return { ok: false, reason: 'notEditable' };
  if (can(user.role, 'approve') || entry.enteredBy === user.id) return { ok: true, reason: null };
  return { ok: false, reason: 'notOwner' };
}

// amount/total ফিল্ড সবসময় নতুন করে হিসাব হয়, ইউজার সরাসরি বদলাতে পারে না
function derive(col, e) {
  if (col === 'collections') return { amount: num(e.paidCount) * num(e.perStudent) };
  if (col === 'markets') {
    const items = (e.items || []).map((i) => ({ ...i, total: num(i.qty) * num(i.price) }));
    const tot = items.reduce((s, i) => s + i.total, 0), cash = (e.participants || []).reduce((s, p) => s + num(p.cash), 0);
    return { items, totalCost: tot, cashTaken: cash, remaining: cash - tot, amount: tot };
  }
  return {};
}

function validate(col, e) {
  if (col === 'collections') return checkCollection({ paid: num(e.paidCount), per: num(e.perStudent), total: num(e.totalStudents) });
  if (col === 'markets') return (e.items || []).length && e.amount > 0 ? null : 'errItems';
  return checkAmount(num(e.amount));
}

// ফলাফল: { ok, update, action } অথবা { ok:false, reason }. মূল entry কখনো mutate হয় না।
export function buildEdit(col, entry, patch, user, monthClosed, now = new Date().toISOString()) {
  const allowed = EDITABLE[col];
  if (!allowed) return { ok: false, reason: 'badCollection' };
  const perm = canEditEntry(entry, user, monthClosed);
  if (!perm.ok) return perm;
  if (Object.keys(patch).some((k) => !allowed.includes(k))) return { ok: false, reason: 'badField' };
  const merged = { ...entry, ...patch }, fin = { ...patch, ...derive(col, merged) };
  const err = validate(col, { ...merged, ...fin });
  if (err) return { ok: false, reason: err };
  const changes = {};
  for (const k of Object.keys(fin)) if (!same(fin[k], entry[k])) changes[k] = { from: entry[k] ?? null, to: fin[k] };
  if (!Object.keys(changes).length) return { ok: false, reason: 'noChange' };
  const resubmit = entry.status === 'rejected';
  const hist = { at: now, by: user.id, byName: user.name, type: resubmit ? 'resubmit' : 'edit', changes, ...(resubmit ? { prevRejectReason: entry.rejectReason || '' } : {}) };
  const update = { ...fin, editHistory: [...(entry.editHistory || []), hist], ...(resubmit ? { status: 'pending', decidedBy: null, decidedAt: null, rejectReason: '' } : {}) };
  return { ok: true, update, action: resubmit ? 'resubmit' : 'edit' };
}
