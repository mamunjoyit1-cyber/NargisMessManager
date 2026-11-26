export const ROLES = ['admin', 'senior', 'assistant'];
const PERMS = { approve: ['admin', 'senior'], backup: ['admin', 'senior'], restore: ['admin'], settings: ['admin'], closeMonth: ['admin'] };
export const can = (role, perm) => (PERMS[perm] || []).includes(role);
