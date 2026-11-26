// TODO-FIREBASE: পরে শুধু এই ফাইল বদলে Firestore বসবে। স্ক্রিনগুলো বদলাতে হবে না।
import { thisMonth } from '../utils/dateUtils.js';
import { monthSummary, prevMonthId } from '../utils/calculations.js';
const KEY = 'nmm_db_v1';
let state = null;
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fresh = () => ({
  version: 1,
  settings: { collegeName: 'Nargis Memorial Nursing College', collegeNameBn: 'নার্গিস মেমোরিয়াল নার্সিং কলেজ', hostelName: 'ছাত্রী হোস্টেল মেস হিসাব', enableMeals: false },
  batches: Array.from({ length: 12 }, (_, i) => ({ id: 'b' + (i + 1), no: i + 1, name: 'ব্যাচ-' + bnNum(String(i + 1).padStart(2, '0')), totalStudents: 0, perStudent: 0 })),
  months: [], users: [], collections: [], deposits: [], unpaid: [], notifications: [], audit: [],
});
const persist = () => localStorage.setItem(KEY, JSON.stringify(state));
export async function init() {
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state) state = fresh();
  if (!state.months.some((m) => m.id === thisMonth())) { const pm = prevMonthId(state, thisMonth()); state.months.push({ id: thisMonth(), openingCash: pm ? monthSummary(state, pm).cash : 0, status: 'open' }); }
  persist();
}
export const get = () => state;
export async function add(col, o) { const r = { id: uid(), createdAt: new Date().toISOString(), ...o }; (state[col] ||= []).push(r); persist(); return r; }
export async function update(col, id, patch) { const r = state[col].find((x) => x.id === id); if (r) Object.assign(r, patch); persist(); return r; }
export async function remove(col, id) { state[col] = state[col].filter((x) => x.id !== id); persist(); }
export async function log(userId, action, ref, note = '') { await add('audit', { userId, action, ref, note }); }
export async function replaceAll(data) { state = data; persist(); }
