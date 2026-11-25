import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useMessStore } from '../store/useMessStore';
import { calculateMonthSummary } from '../utils/messCalculator';

const prevMonthOf = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function DashboardScreen() {
  const { branding, activeMonth, monthRoles, deposits, expenses, settings, meals } =
    useMessStore();

  const monthDeposits = deposits.filter((d) => d.month === activeMonth);
  const monthExpenses = expenses.filter((e) => e.month === activeMonth);

  const prevKey = prevMonthOf(activeMonth);
  const prevMonthExpense = expenses
    .filter((e) => e.month === prevKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const summary = calculateMonthSummary({
    deposits: monthDeposits,
    expenses: monthExpenses,
    previousMonthExpense: prevMonthExpense,
    enableMeals: settings.enableMeals,
    meals: meals.filter((m) => m.month === activeMonth),
  });

  // কে কত টাকা খরচ করলো
  const bySpender = Object.values(
    monthExpenses.reduce((acc, exp) => {
      const name = (exp.spentBy || 'উল্লেখ করা হয়নি').trim();
      if (!acc[name]) acc[name] = { name, total: 0 };
      acc[name].total += Number(exp.amount || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const roles = monthRoles[activeMonth] || { manager: 'নির্ধারিত নয়', assistant: 'নির্ধারিত নয়' };

  return (
    <ScrollView style={styles.container}>
      {/* কলেজ ও লোগো */}
      <View style={styles.headerCard}>
        {branding.logoUri ? (
          <Image source={{ uri: branding.logoUri }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>NMNC</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.collegeTitle}>{branding.collegeName}</Text>
          <Text style={styles.subTitle}>
            {branding.hostelName} • মাস: {activeMonth}
          </Text>
        </View>
      </View>

      {/* ম্যানেজার ও সহযোগী */}
      <View style={styles.roleCard}>
        <Text style={styles.sectionTitle}>এই মাসের দায়িত্বপ্রাপ্ত ({activeMonth})</Text>
        <Text style={styles.roleText}>ম্যানেজার: {roles.manager || 'নির্ধারিত নয়'}</Text>
        <Text style={styles.roleText}>সহযোগী: {roles.assistant || 'নির্ধারিত নয়'}</Text>
      </View>

      {/* জমা-খরচ */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#DCFCE7' }]}>
          <Text style={styles.statLabel}>মোট জমা</Text>
          <Text style={styles.statValue}>৳{summary.totalDeposit}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statLabel}>মোট খরচ</Text>
          <Text style={styles.statValue}>৳{summary.totalExpense}</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>বর্তমানে হাতে আছে (অবশিষ্ট টাকা)</Text>
        <Text style={styles.balanceValue}>৳{summary.remainingBalance}</Text>
        <Text style={styles.compareText}>{summary.comparisonText}</Text>
      </View>

      {/* কে কত খরচ করলো */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>কে কত টাকা খরচ করলো</Text>
        {bySpender.length === 0 ? (
          <Text style={styles.emptyText}>কোনো খরচের হিসাব পাওয়া যায়নি।</Text>
        ) : (
          bySpender.map((p) => (
            <View key={p.name} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.spenderAmount}>৳{p.total}</Text>
            </View>
          ))
        )}
      </View>

      {/* আইটেমভিত্তিক */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>কোন আইটেমে কত খরচ হলো</Text>
        {summary.byItem.length === 0 ? (
          <Text style={styles.emptyText}>এখনও কোনো খরচের ডাটা যোগ করা হয়নি।</Text>
        ) : (
          summary.byItem.map((row) => (
            <View key={row.itemName} style={styles.rowItem}>
              <Text style={styles.rowTitle}>
                {row.itemName} {row.quantities.length ? `(${row.quantities.join(', ')})` : ''}
              </Text>
              <Text style={styles.rowAmount}>৳{row.totalAmount}</Text>
            </View>
          ))
        )}
      </View>

      {/* সাম্প্রতিক এন্ট্রি */}
      <View style={[styles.sectionCard, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>সাম্প্রতিক খরচের এন্ট্রি</Text>
        {monthExpenses.length === 0 ? (
          <Text style={styles.emptyText}>এই মাসে কোনো এন্ট্রি নেই।</Text>
        ) : (
          monthExpenses.slice(0, 5).map((exp) => (
            <View key={exp.id} style={styles.recentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {exp.itemName} {exp.quantity ? `• ${exp.quantity}` : ''}
                </Text>
                <Text style={styles.recentSub}>
                  {exp.date} | খরচকারী: {exp.spentBy || '-'} {exp.slipUri ? '| স্লিপ যুক্ত' : ''}
                </Text>
              </View>
              <Text style={styles.rowAmount}>৳{exp.amount}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', padding: 14 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  logo: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B4D3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  collegeTitle: { fontSize: 16, fontWeight: '800', color: '#1B4D3E' },
  subTitle: { fontSize: 12, color: '#475569', marginTop: 2 },
  roleCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  roleText: { fontSize: 14, color: '#334155', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, padding: 14, borderRadius: 12 },
  statLabel: { fontSize: 13, color: '#334155', fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  balanceCard: { backgroundColor: '#1B4D3E', padding: 16, borderRadius: 12, marginBottom: 12 },
  balanceLabel: { fontSize: 13, color: '#D1FAE5' },
  balanceValue: { fontSize: 28, fontWeight: '800', color: '#FFF', marginVertical: 4 },
  compareText: { fontSize: 13, color: '#FDE68A', fontWeight: '600' },
  sectionCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#64748B' },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, paddingRight: 8 },
  recentSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  spenderAmount: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  rowAmount: { fontSize: 14, fontWeight: '800', color: '#B91C1C' },
});
