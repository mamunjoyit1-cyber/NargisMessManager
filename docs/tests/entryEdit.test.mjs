import test from 'node:test'; import assert from 'node:assert/strict';
import { canEditEntry, buildEdit } from '../src/utils/entryEdit.js';
const admin = { id: 'admin', name: 'A', role: 'admin' }, senior = { id: 'senior1', name: 'S', role: 'senior' };
const rima = { id: 'assistant', name: 'Asst', role: 'assistant' }, other = { id: 'asst2', name: 'Other', role: 'assistant' };
const col = (o = {}) => ({ id: 'c1', month: '2026-11', status: 'pending', enteredBy: 'assistant', totalStudents: 10, paidCount: 8, perStudent: 100, amount: 800, date: '2026-11-05', ...o });
const dep = (o = {}) => ({ id: 'd1', status: 'pending', enteredBy: 'assistant', amount: 5000, collector: 'Rima', note: '', ...o });
const mkt = (o = {}) => ({ id: 'm1', status: 'pending', enteredBy: 'assistant', participants: [{ name: 'x', cash: 2000 }], items: [{ name: 'চাল', qty: 2, price: 100, total: 200 }], amount: 200, totalCost: 200, cashTaken: 2000, remaining: 1800, ...o });

test('permission matrix', () => {
  assert.equal(canEditEntry(col(), rima, false).ok, true, 'assistant edits own pending');
  assert.equal(canEditEntry(col(), other, false).reason, 'notOwner');
  assert.equal(canEditEntry(col(), senior, false).ok, true);
  assert.equal(canEditEntry(col(), admin, false).ok, true);
  assert.equal(canEditEntry(col({ status: 'rejected' }), rima, false).ok, true);
  assert.equal(canEditEntry(col({ status: 'rejected' }), other, false).reason, 'notOwner');
});
test('approved is locked, even for admin', () => {
  for (const u of [rima, senior, admin]) assert.equal(canEditEntry(col({ status: 'approved' }), u, false).reason, 'needsCorrection');
});
test('closed month blocks every edit', () => {
  for (const u of [rima, senior, admin]) assert.equal(canEditEntry(col(), u, true).reason, 'monthClosed');
  assert.equal(buildEdit('collections', col(), { paidCount: 9 }, admin, true).reason, 'monthClosed');
});
test('collection edit recomputes amount and logs history; original untouched', () => {
  const e = col(), snap = JSON.stringify(e), r = buildEdit('collections', e, { paidCount: 9 }, rima, false, 'T1');
  assert.equal(r.ok, true); assert.equal(r.action, 'edit');
  assert.equal(r.update.amount, 900); assert.equal(r.update.status, undefined);
  assert.deepEqual(r.update.editHistory[0].changes.amount, { from: 800, to: 900 });
  assert.equal(r.update.editHistory[0].by, 'assistant'); assert.equal(JSON.stringify(e), snap);
});
test('collection validation', () => {
  assert.equal(buildEdit('collections', col(), { paidCount: 11 }, rima, false).reason, 'errPaidMax');
  assert.equal(buildEdit('collections', col(), { perStudent: 0 }, rima, false).reason, 'errPer');
  assert.equal(buildEdit('collections', col(), { paidCount: -1 }, rima, false).reason, 'errPaid');
});
test('deposit / expense amount validation', () => {
  assert.equal(buildEdit('deposits', dep(), { amount: 0 }, rima, false).reason, 'errAmount');
  assert.equal(buildEdit('expenses', { status: 'pending', enteredBy: 'assistant', amount: 10 }, { amount: -5 }, rima, false).reason, 'errAmount');
  assert.equal(buildEdit('deposits', dep(), { amount: 6000, note: 'ok' }, rima, false).update.amount, 6000);
});
test('market edit recomputes totals', () => {
  const r = buildEdit('markets', mkt(), { items: [{ name: 'চাল', qty: 3, price: 150 }] }, rima, false);
  assert.equal(r.ok, true); assert.equal(r.update.amount, 450); assert.equal(r.update.remaining, 1550); assert.equal(r.update.items[0].total, 450);
  assert.equal(buildEdit('markets', mkt(), { items: [] }, rima, false).reason, 'errItems');
});
test('rejected edit => resubmit as pending, reason kept in history', () => {
  const e = dep({ status: 'rejected', rejectReason: 'ভুল অংক', decidedBy: 'senior1' });
  const r = buildEdit('deposits', e, { amount: 4500 }, rima, false);
  assert.equal(r.action, 'resubmit'); assert.equal(r.update.status, 'pending'); assert.equal(r.update.decidedBy, null); assert.equal(r.update.rejectReason, '');
  assert.equal(r.update.editHistory[0].type, 'resubmit'); assert.equal(r.update.editHistory[0].prevRejectReason, 'ভুল অংক');
});
test('history accumulates', () => {
  const a = buildEdit('deposits', dep(), { amount: 1 }, rima, false, 'T1').update;
  const b = buildEdit('deposits', { ...dep(), ...a }, { amount: 2 }, rima, false, 'T2').update;
  assert.equal(b.editHistory.length, 2); assert.equal(b.editHistory[1].at, 'T2');
});
test('bad field / no change / bad collection', () => {
  assert.equal(buildEdit('deposits', dep(), { status: 'approved' }, rima, false).reason, 'badField');
  assert.equal(buildEdit('collections', col(), { amount: 99999 }, rima, false).reason, 'badField');
  assert.equal(buildEdit('deposits', dep(), { amount: 5000 }, rima, false).reason, 'noChange');
  assert.equal(buildEdit('nope', dep(), {}, rima, false).reason, 'badCollection');
});
