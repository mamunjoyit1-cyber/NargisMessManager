export function checkCollection({ paid, per, total }) {
  if (!(per > 0)) return 'errPer';
  if (!Number.isFinite(paid) || paid < 0) return 'errPaid';
  if (total > 0 && paid > total) return 'errPaidMax';
  return null;
}
export const checkAmount = (a) => (a > 0 ? null : 'errAmount');
