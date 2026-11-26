import test from 'node:test'; import assert from 'node:assert/strict';
const mk = () => { let s = {}; return { getItem: (k) => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: (k) => { delete s[k]; }, clear: () => { s = {}; } }; };
globalThis.localStorage = mk(); globalThis.sessionStorage = mk(); globalThis.document = { documentElement: {} };
const db = await import('../src/services/databaseService.js');
const { ROSTER_2026_12, ensureRosters, rosterFor, residentsText, rosterBatchPatches } = await import('../src/constants/roster.js');

test('December data: 12 batches, 20 residents, B3 two seniors', () => {
  assert.equal(ROSTER_2026_12.length, 12);
  assert.deepEqual(ROSTER_2026_12.map((r) => r.batchName), ['B3', 'B4', 'B5', 'B6', 'D3', 'D4', 'D5', 'D6', 'M3', 'M4', 'M5', 'M6']);
  assert.equal(ROSTER_2026_12.reduce((s, r) => s + r.residents.length, 0), 20);
  const b3 = ROSTER_2026_12[0]; assert.deepEqual(b3.residents, [{ name: 'বাসনা', senior: true }, { name: 'মিম', senior: true }]);
  assert.equal(ROSTER_2026_12.flatMap((r) => r.residents).filter((x) => x.senior).length, 2);
  assert.equal(ROSTER_2026_12.find((r) => r.batchName === 'D4').residents[1].name, 'ফারজানা আক্তার');
});
test('fresh init seeds roster; batches/entries untouched', async () => {
  await db.init(); const s = db.get();
  assert.equal(s.rosters['2026-12'].length, 12); assert.equal(s.batches[0].name, 'ব্যাচ-০১'); assert.equal(s.batches[0].totalStudents, 0);
});
test('existing live data: roster added, nothing else changed; repeat init is idempotent', async () => {
  const old = { version: 1, settings: {}, batches: [{ id: 'b1', name: 'X', totalStudents: 7, perStudent: 50 }], months: [{ id: '2020-01', openingCash: 5, status: 'open' }], users: [], collections: [{ id: 'c' }], deposits: [], unpaid: [], notifications: [], audit: [] };
  localStorage.setItem('nmm_db_v1', JSON.stringify(old)); await db.init(); await db.init(); const s = db.get();
  assert.equal(s.rosters['2026-12'].length, 12); assert.equal(s.batches[0].name, 'X'); assert.equal(s.batches[0].totalStudents, 7); assert.equal(s.collections.length, 1);
});
test('existing roster for a month is never overwritten', () => {
  const st = { rosters: { '2026-12': [{ batchName: 'Z', residents: [] }] } }; ensureRosters(st); assert.equal(st.rosters['2026-12'][0].batchName, 'Z');
});
test('restore of an old backup without rosters still gets rosters', async () => {
  await db.replaceAll({ settings: {}, batches: [], months: [], users: [] }); assert.equal(db.get().rosters['2026-12'].length, 12);
});
test('rosterFor / residentsText / next month roster stays separate', () => {
  const st = ensureRosters({ batches: [] }); st.rosters['2027-01'] = [{ batchName: 'B3', residents: [{ name: 'নতুন' }] }];
  assert.equal(residentsText(rosterFor(st, '2026-12', 'B3')), 'বাসনা ⭐, মিম ⭐'); assert.equal(residentsText(rosterFor(st, '2027-01', 'B3')), 'নতুন');
  assert.equal(rosterFor(st, '2026-12', 'ZZ'), null); assert.equal(rosterFor(st, '2030-01', 'B3'), null); assert.equal(rosterFor({}, '2026-12', 'B3'), null);
});
test('rosterBatchPatches maps in order: names + counts, perStudent not included', () => {
  const st = ensureRosters({ batches: Array.from({ length: 12 }, (_, i) => ({ id: 'b' + (i + 1) })) }); const p = rosterBatchPatches(st, '2026-12');
  assert.equal(p.length, 12); assert.deepEqual(p[0], { id: 'b1', name: 'B3', totalStudents: 2 }); assert.deepEqual(p[11], { id: 'b12', name: 'M6', totalStudents: 1 });
  assert.equal(p.reduce((s, x) => s + x.totalStudents, 0), 20); assert.equal('perStudent' in p[0], false); assert.deepEqual(rosterBatchPatches(st, '2031-01'), []);
});
