// মাসভিত্তিক Resident তালিকা। প্রতি মাসের তালিকা আলাদা (d.rosters[YYYY-MM]); পরের মাসে বদলালে নতুন মাসের তালিকা যোগ হবে।
// senior:true = Senior Group
const R = (batchName, ...names) => ({ batchName, residents: names.map((n) => (n.endsWith('*') ? { name: n.slice(0, -1), senior: true } : { name: n })) });
export const ROSTER_2026_12 = [
  R('B3', 'বাসনা*', 'মিম*'), R('B4', 'সুস্মিতা'), R('B5', 'সাহিদা ইসলাম দোলা'), R('B6', 'জান্নাতুল ইসলাম', 'সারমিন ইসলাম মিম'),
  R('D3', 'ঐশী', 'নিপা'), R('D4', 'মেঘলা দাস', 'ফারজানা আক্তার'), R('D5', 'তমা মন্ডল', 'অনন্যা রায়'), R('D6', 'লাবনী দত্ত', 'স্বর্না মন্ডল'),
  R('M3', 'পুস্পিতা'), R('M4', 'মৌমিতা', 'জয়া'), R('M5', 'আয়শা খাতুন', 'স্বর্না রানী'), R('M6', 'নাইমা আক্তার'),
];
export const SEED_ROSTERS = { '2026-12': ROSTER_2026_12 };

// state.rosters না থাকলে বানায়; আগে থেকে থাকা মাসের তালিকা কখনো বদলায় না
export function ensureRosters(state) {
  state.rosters ||= {};
  for (const [m, list] of Object.entries(SEED_ROSTERS)) if (!state.rosters[m]) state.rosters[m] = structuredClone(list);
  return state;
}
export const rosterFor = (state, month, batchName) => ((state.rosters || {})[month] || []).find((r) => r.batchName === batchName) || null;
export const residentsText = (r) => r.residents.map((x) => x.name + (x.senior ? ' ⭐' : '')).join(', ');
// Batch ১..১২ ক্রমানুসারে তালিকার ১..১২-তে মেলানো: নাম ও সদস্যসংখ্যা বদলের প্রস্তাব (perStudent অপরিবর্তিত)
export function rosterBatchPatches(state, month) {
  const list = (state.rosters || {})[month] || [];
  return list.slice(0, state.batches.length).map((r, i) => ({ id: state.batches[i].id, name: r.batchName, totalStudents: r.residents.length }));
}
