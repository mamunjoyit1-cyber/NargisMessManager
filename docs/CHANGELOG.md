# Changelog
## 4.0.0-dev.3 — ডিসেম্বর Resident তালিকা (Task 3-এর আগে যোগ)
- নতুন `src/constants/roster.js`: ডিসেম্বর ২০২৬ তালিকা (১২ Batch, ২০ জন, B3-এ ২ জন Senior Group ⭐), মাসভিত্তিক `d.rosters[YYYY-MM]`।
- `databaseService.js`: পুরোনো/লাইভ ডাটায় শুধু `rosters` যোগ হয়; Batch, এন্ট্রি, Opening কিছুই বদলায় না। Restore-এও কাজ করে।
- Collection স্ক্রিনে নির্বাচিত মাস ও Batch-এর Resident তালিকা দেখায়।
- More → Batch Settings: Admin-এর বাটন — নির্বাচিত মাসের তালিকা অনুযায়ী Batch নাম ও মোট সংখ্যা সেট (আগের এন্ট্রি অপরিবর্তিত, Audit-এ `roster_apply`)।
- `sw.js` cache `nmm-v5`। নতুন Test: `roster.test.mjs` (৭), `rosterUi.test.mjs` (৭)।
## 4.0.0-dev.2 — Phase 4A / Task 2 (Pending entry edit UI)
- Collection, Deposit, Market, Expense: Pending এন্ট্রিতে `সম্পাদনা` বাটন। একই ফর্ম Edit মোডে খোলে (`আপডেট` / `বাতিল`), Batch বদলানো যায় না।
- `app.js`: `c.editEntry` / `c.canEdit` (নিয়ম `entryEdit.js`-এ), Audit log `edit`, Assistant সম্পাদনা করলে Approver Notification।
- i18n: edit, update, cancel ও ত্রুটির বার্তা (বাংলা + English)।
- নতুন Test: `tests/editUi.test.mjs` (১৭টি)। Approved এন্ট্রি ও Closed মাসে বাটন দেখা যায় না।
## 4.0.0-dev.1 — Phase 4A / Task 1 (entry edit rules)
- নতুন: `src/utils/entryEdit.js` (canEditEntry, buildEdit) — Pending/Rejected edit নিয়ম, Resubmit, editHistory। এখনো কোনো স্ক্রিনে যুক্ত হয়নি।
- নতুন: `tests/` (core, entryEdit, ui) ও `package.json` (`npm test`, শুধু টেস্টের জন্য; অ্যাপে Build লাগে না)।
## 3.1 — Audit fixes
- Restore JSON যাচাই, Closed মাসে Approve/Reject/Delete বন্ধ, নতুন মাসে আগের Closing → Opening, Assistant-এর Rejected Market/Expense দেখা, SW cache nmm-v4।
