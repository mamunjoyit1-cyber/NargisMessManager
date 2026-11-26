// TODO-FIREBASE: পরে Firebase Authentication বসবে। এখনকার লগইন শুধু কাঠামো দেখার জন্য, আসল নিরাপত্তা নয়।
const hash = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nmm|' + s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function seed(db) {
  if (db.get().users.length) return;
  for (const [id, name, role, pw] of [['admin', 'অ্যাডমিন', 'admin', 'admin123'], ['senior1', 'সিনিয়র ম্যানেজার ১', 'senior', 'senior123'], ['assistant', 'সহযোগী ম্যানেজার', 'assistant', 'assist123']])
    await db.add('users', { id, name, role, active: true, passHash: await hash(pw) });
}
export async function login(db, id, pw, entry) {
  const u = db.get().users.find((x) => x.id === id.trim());
  if (!u || !u.active || u.passHash !== (await hash(pw))) { await db.log(id, 'login_failed', 'auth'); return { ok: false, err: 'wrongLogin' }; }
  if (u.role === 'assistant' && !entry.name.trim()) return { ok: false, err: 'needName' };
  localStorage.setItem('nmm_session', u.id);
  sessionStorage.setItem('nmm_entry', JSON.stringify({ name: entry.name.trim(), batch: entry.batch }));
  await db.log(u.id, 'login_ok', 'auth', entry.name);
  return { ok: true };
}
export const currentUser = (d) => d.users.find((u) => u.id === localStorage.getItem('nmm_session') && u.active);
export const entryInfo = () => { try { return JSON.parse(sessionStorage.getItem('nmm_entry')) || { name: '', batch: '' }; } catch { return { name: '', batch: '' }; } };
export const logout = () => { localStorage.removeItem('nmm_session'); sessionStorage.removeItem('nmm_entry'); };
