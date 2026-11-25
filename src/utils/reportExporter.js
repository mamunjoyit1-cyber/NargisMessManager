import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import RNPrint from 'react-native-print';

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// ব্যবহারকারী শেয়ার মেনু বন্ধ করলে এরর দেখানোর দরকার নেই
const safeShare = async (options) => {
  try {
    await Share.open(options);
  } catch (e) {
    const msg = String(e?.message || '');
    if (!msg.includes('User did not share')) throw e;
  }
};

// ১. Excel (.csv)
export const exportToExcelCSV = async ({
  month,
  collegeName,
  manager,
  assistant,
  totalDeposit,
  totalExpense,
  remainingBalance,
  expenses = [],
}) => {
  const lines = [
    [csvCell(collegeName), csvCell(`মাস: ${month}`)],
    [
      csvCell(`ম্যানেজার: ${manager || 'নির্ধারিত নয়'}`),
      csvCell(`সহযোগী: ${assistant || 'নির্ধারিত নয়'}`),
    ],
    [
      csvCell(`মোট জমা: ${totalDeposit}`),
      csvCell(`মোট খরচ: ${totalExpense}`),
      csvCell(`অবশিষ্ট: ${remainingBalance}`),
    ],
    [],
    ['তারিখ', 'আইটেম', 'কোয়ান্টিটি', 'টাকা (৳)', 'কে খরচ করলো', 'স্লিপ', 'নোট'].map(csvCell),
  ];

  expenses.forEach((e) => {
    lines.push(
      [
        e.date,
        e.itemName,
        e.quantity || '-',
        e.amount,
        e.spentBy || '-',
        e.slipUri ? 'সংযুক্ত' : 'নেই',
        e.note || '',
      ].map(csvCell)
    );
  });

  const content = '\uFEFF' + lines.map((r) => r.join(',')).join('\n');
  const path = `${RNFS.CachesDirectoryPath}/Mess_Report_${month}.csv`;
  await RNFS.writeFile(path, content, 'utf8');
  await safeShare({
    url: `file://${path}`,
    type: 'text/csv',
    title: `মেস হিসাব Excel রিপোর্ট (${month})`,
  });
};

// ২. Word ও PDF-এর জন্য HTML
const buildReportHtml = ({
  month,
  collegeName,
  hostelName,
  manager,
  assistant,
  totalDeposit,
  totalExpense,
  remainingBalance,
  comparisonText,
  byItem = [],
  dayByDay = [],
}) => {
  const itemRows = byItem
    .map(
      (it) =>
        `<tr><td>${esc(it.itemName)}</td><td>${esc(
          (it.quantities || []).join(', ') || '-'
        )}</td><td>৳${it.totalAmount}</td></tr>`
    )
    .join('');

  const dayRows = dayByDay
    .map((d) => {
      const detail = (d.expenseList || [])
        .map(
          (e) =>
            `${esc(e.itemName)} (${esc(e.quantity || '-')}): ৳${e.amount} [${esc(
              e.spentBy || '-'
            )}]`
        )
        .join('<br/>');
      return `<tr><td>${esc(d.date)}</td><td>৳${d.deposit}</td><td>৳${d.expense}</td><td>${
        detail || '-'
      }</td></tr>`;
    })
    .join('');

  return `<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; padding: 16px; color: #1e293b; }
  h1 { color: #1b4d3e; margin-bottom: 4px; font-size: 20px; }
  h2 { color: #0f766e; margin-top: 20px; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .meta { font-size: 13px; margin-bottom: 8px; color: #334155; }
  .box { background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #e2e8f0; }
</style>
</head>
<body>
  <h1>${esc(collegeName)}</h1>
  <div class="meta"><strong>${esc(hostelName)}</strong> | মাস: <strong>${esc(month)}</strong></div>
  <div class="meta">ম্যানেজার: <strong>${esc(manager || 'নির্ধারিত নয়')}</strong> | সহযোগী: <strong>${esc(
    assistant || 'নির্ধারিত নয়'
  )}</strong></div>
  <div class="box">
    <div><strong>মোট জমা:</strong> ৳${totalDeposit} | <strong>মোট খরচ:</strong> ৳${totalExpense} | <strong>অবশিষ্ট:</strong> ৳${remainingBalance}</div>
    <div style="margin-top:4px;"><strong>মাসিক তুলনা:</strong> ${esc(comparisonText)}</div>
  </div>

  <h2>আইটেমভিত্তিক খরচ</h2>
  <table>
    <thead><tr><th>আইটেম</th><th>কোয়ান্টিটি</th><th>মোট খরচ</th></tr></thead>
    <tbody>${itemRows || '<tr><td colspan="3">কোনো তথ্য নেই</td></tr>'}</tbody>
  </table>

  <h2>Day-by-Day বিস্তারিত রিপোর্ট</h2>
  <table>
    <thead><tr><th>তারিখ</th><th>জমা</th><th>খরচ</th><th>খরচের বিবরণ ও খরচকারী</th></tr></thead>
    <tbody>${dayRows || '<tr><td colspan="4">কোনো তথ্য নেই</td></tr>'}</tbody>
  </table>
</body>
</html>`;
};

// ৩. Word (.doc)
export const exportToWordDoc = async (payload) => {
  const html = buildReportHtml(payload);
  const path = `${RNFS.CachesDirectoryPath}/Mess_Report_${payload.month}.doc`;
  await RNFS.writeFile(path, html, 'utf8');
  await safeShare({
    url: `file://${path}`,
    type: 'application/msword',
    title: `মেস হিসাব Word রিপোর্ট (${payload.month})`,
  });
};

// ৪. PDF (প্রিন্ট/সেভ)
export const exportToPdfReport = async (payload) => {
  const html = buildReportHtml(payload);
  await RNPrint.print({ html });
};
