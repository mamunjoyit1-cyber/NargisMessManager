import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useMessStore } from '../store/useMessStore';
import { calculateMonthSummary } from '../utils/messCalculator';
import { exportToExcelCSV, exportToWordDoc, exportToPdfReport } from '../utils/reportExporter';

const prevMonthOf = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function ReportScreen() {
  const { branding, activeMonth, setActiveMonth, monthRoles, deposits, expenses, settings, meals } =
    useMessStore();

  const availableMonths = ['2026-10', '2026-11', '2026-12', '2027-01'];

  const currentDeposits = deposits.filter((d) => d.month === activeMonth);
  const currentExpenses = expenses.filter((e) => e.month === activeMonth);

  const prevMonthKey = prevMonthOf(activeMonth);
  const prevMonthExpense = expenses
    .filter((e) => e.month === prevMonthKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const summary = calculateMonthSummary({
    deposits: currentDeposits,
    expenses: currentExpenses,
    previousMonthExpense: prevMonthExpense,
    enableMeals: settings.enableMeals,
    meals: meals.filter((m) => m.month === activeMonth),
  });

  const roles = monthRoles[activeMonth] || { manager: 'নির্ধারিত নয়', assistant: 'নির্ধারিত নয়' };

  const commonPayload = {
    month: activeMonth,
    collegeName: branding.collegeName,
    hostelName: branding.hostelName,
    manager: roles.manager,
    assistant: roles.assistant,
    totalDeposit: summary.totalDeposit,
    totalExpense: summary.totalExpense,
    remainingBalance: summary.remainingBalance,
    comparisonText: summary.comparisonText,
    byItem: summary.byItem,
    dayByDay: summary.dayByDay,
    expenses: currentExpenses,
  };

  const handleExport = async (type) => {
    try {
      if (type === 'excel') await exportToExcelCSV(commonPayload);
      if (type === 'word') await exportToWordDoc(commonPayload);
      if (type === 'pdf') await exportToPdfReport(commonPayload);
    } catch (err) {
      Alert.alert('রিপোর্ট তৈরি হয়নি', 'রিপোর্ট ফাইল প্রস্তুত বা শেয়ার করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>রিপোর্ট, মাসিক তুলনা ও এক্সপোর্ট</Text>

      {/* মাস নির্বাচন */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
        {availableMonths.map((m) => {
          const active = m === activeMonth;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, active && styles.monthChipActive]}
              onPress={() => setActiveMonth(m)}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ম্যানেজার, সহযোগী ও তুলনা */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>মাস: {activeMonth}</Text>
        <Text style={styles.infoLine}>ম্যানেজার: {roles.manager || 'নির্ধারিত নয়'}</Text>
        <Text style={styles.infoLine}>সহযোগী: {roles.assistant || 'নির্ধারিত নয়'}</Text>
        <Text style={styles.compareBox}>
          তুলনা ({prevMonthKey} বনাম {activeMonth}): {summary.comparisonText}
        </Text>
      </View>

      {/* এক্সপোর্ট */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>রিপোর্ট জেনারেট ও শেয়ার (ফ্রি)</Text>
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.expBtn, { backgroundColor: '#15803D' }]}
            onPress={() => handleExport('excel')}
          >
            <Text style={styles.expBtnText}>Excel (.csv)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.expBtn, { backgroundColor: '#1D4ED8' }]}
            onPress={() => handleExport('word')}
          >
            <Text style={styles.expBtnText}>Word (.doc)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.expBtn, { backgroundColor: '#B91C1C' }]}
            onPress={() => handleExport('pdf')}
          >
            <Text style={styles.expBtnText}>PDF রিপোর্ট</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day-by-Day */}
      <View style={[styles.card, { marginBottom: 30 }]}>
        <Text style={styles.cardTitle}>Day-by-Day রিপোর্ট</Text>
        {summary.dayByDay.length === 0 ? (
          <Text style={styles.muted}>এই মাসে কোনো দৈনিক হিসাব পাওয়া যায়নি।</Text>
        ) : (
          summary.dayByDay.map((day) => (
            <View key={day.date} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>{day.date}</Text>
                <Text style={styles.dayExpense}>
                  খরচ: ৳{day.expense} | জমা: ৳{day.deposit}
                </Text>
              </View>
              {(day.expenseList || []).map((exp) => (
                <Text key={exp.id} style={styles.detailLine}>
                  • {exp.itemName} ({exp.quantity || 'পরিমাণ নেই'}) — ৳{exp.amount} | খরচকারী:{' '}
                  {exp.spentBy || '-'}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', padding: 14 },
  title: { fontSize: 18, fontWeight: '800', color: '#1B4D3E', marginBottom: 10 },
  monthRow: { flexDirection: 'row', marginBottom: 12 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  monthChipActive: { backgroundColor: '#1B4D3E' },
  monthText: { fontWeight: '700', color: '#1E293B' },
  monthTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  infoLine: { fontSize: 14, color: '#334155', marginBottom: 4 },
  compareBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  exportRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  expBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  expBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  dayBlock: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, marginTop: 10 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dayDate: { fontWeight: '800', color: '#1B4D3E' },
  dayExpense: { fontWeight: '700', color: '#B91C1C', fontSize: 12 },
  detailLine: { fontSize: 13, color: '#334155', marginTop: 2, paddingLeft: 4 },
  muted: { fontSize: 13, color: '#64748B' },
});
