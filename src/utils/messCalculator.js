// src/utils/messCalculator.js
export const calculateMonthSummary = ({
  deposits = [],
  expenses = [],
  previousMonthExpense = 0,
  enableMeals = false,
  meals = [],
}) => {
  const totalDeposit = deposits.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBalance = totalDeposit - totalExpense;

  // আইটেম অনুযায়ী খরচ
  const byItem = expenses.reduce((acc, item) => {
    const key = (item.itemName || 'অন্যান্য').trim();
    if (!acc[key]) {
      acc[key] = { itemName: key, totalAmount: 0, entriesCount: 0, quantities: [] };
    }
    acc[key].totalAmount += Number(item.amount || 0);
    acc[key].entriesCount += 1;
    if (item.quantity) acc[key].quantities.push(item.quantity);
    return acc;
  }, {});

  // দিন অনুযায়ী (Day-by-Day)
  const dateMap = {};
  const ensureDay = (date) => {
    if (!dateMap[date]) {
      dateMap[date] = { date, deposit: 0, expense: 0, depositList: [], expenseList: [] };
    }
    return dateMap[date];
  };

  deposits.forEach((d) => {
    const day = ensureDay(d.date);
    day.deposit += Number(d.amount || 0);
    day.depositList.push(d);
  });

  expenses.forEach((e) => {
    const day = ensureDay(e.date);
    day.expense += Number(e.amount || 0);
    day.expenseList.push(e);
  });

  const dayByDay = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));

  // গত মাসের সাথে তুলনা
  const monthDiff = totalExpense - Number(previousMonthExpense || 0);
  const comparisonText =
    monthDiff > 0
      ? `গত মাসের চেয়ে ৳${monthDiff} বেশি খরচ হয়েছে`
      : monthDiff < 0
      ? `গত মাসের চেয়ে ৳${Math.abs(monthDiff)} কম খরচ হয়েছে`
      : 'গত মাসের সমান খরচ হয়েছে';

  // অপশনাল মিল হিসাব
  let mealSummary = null;
  if (enableMeals) {
    const totalMeals = meals.reduce((sum, m) => sum + Number(m.count || 0), 0);
    const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;
    mealSummary = { totalMeals, mealRate };
  }

  return {
    totalDeposit,
    totalExpense,
    remainingBalance,
    byItem: Object.values(byItem).sort((a, b) => b.totalAmount - a.totalAmount),
    dayByDay,
    monthDiff,
    comparisonText,
    mealSummary,
  };
};
