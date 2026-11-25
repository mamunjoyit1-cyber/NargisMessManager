import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useMessStore } from '../store/useMessStore';

export default function DepositAndRolesScreen() {
  const {
    activeMonth,
    setActiveMonth,
    monthRoles,
    setMonthRoles,
    members,
    addMember,
    deposits,
    addDeposit,
    settings,
    toggleMealsFeature,
  } = useMessStore();

  const availableMonths = ['2026-10', '2026-11', '2026-12', '2027-01'];

  // ১. মাস অনুযায়ী ম্যানেজার ও সহযোগী
  const currentRole = monthRoles[activeMonth] || { manager: '', assistant: '' };
  const [managerName, setManagerName] = useState(currentRole.manager);
  const [assistantName, setAssistantName] = useState(currentRole.assistant);

  useEffect(() => {
    const r = monthRoles[activeMonth] || { manager: '', assistant: '' };
    setManagerName(r.manager || '');
    setAssistantName(r.assistant || '');
  }, [activeMonth, monthRoles]);

  // ২. জমা এন্ট্রি
  const [selectedMemberName, setSelectedMemberName] = useState(members[0]?.name || '');
  const [depositBatch, setDepositBatch] = useState(members[0]?.batch || '');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(`${activeMonth}-01`);
  const [depositNote, setDepositNote] = useState('');

  // ৩. নতুন সদস্য
  const [newName, setNewName] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInfo, setNewInfo] = useState('');

  const handleSaveRoles = () => {
    setMonthRoles(activeMonth, managerName.trim(), assistantName.trim());
    Alert.alert('সংরক্ষিত', `${activeMonth} মাসের ম্যানেজার ও সহযোগী আপডেট হয়েছে।`);
  };

  const handleSaveDeposit = () => {
    const amt = Number(depositAmount);
    if (!selectedMemberName.trim() || !amt || amt <= 0) {
      Alert.alert('তথ্য অসম্পূর্ণ', 'অনুগ্রহ করে জমাকারীর নাম এবং সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    addDeposit({
      month: activeMonth,
      date: depositDate.trim() || `${activeMonth}-01`,
      memberName: selectedMemberName.trim(),
      batch: depositBatch.trim(),
      amount: amt,
      note: depositNote.trim(),
    });
    setDepositAmount('');
    setDepositNote('');
    Alert.alert('জমা যুক্ত হয়েছে', `${selectedMemberName.trim()} - ৳${amt} জমা সংরক্ষণ করা হয়েছে।`);
  };

  const handleAddMember = () => {
    if (!newName.trim()) {
      Alert.alert('নাম প্রয়োজন', 'অনুগ্রহ করে নাম লিখুন।');
      return;
    }
    addMember({
      name: newName.trim(),
      batch: newBatch.trim() || 'ব্যাচ উল্লেখ নেই',
      room: newRoom.trim(),
      phone: newPhone.trim(),
      info: newInfo.trim(),
    });
    setSelectedMemberName(newName.trim());
    setDepositBatch(newBatch.trim());
    setNewName('');
    setNewBatch('');
    setNewRoom('');
    setNewPhone('');
    setNewInfo('');
    Alert.alert('সংরক্ষিত', 'নতুন ছাত্রী, ব্যাচ ও ইনফরমেশন তালিকায় যুক্ত হয়েছে।');
  };

  const monthDeposits = deposits.filter((d) => d.month === activeMonth);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>জমা, ব্যাচ/তথ্য ও মাসিক দায়িত্ব</Text>

      {/* মাস সিলেক্টর */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
        {availableMonths.map((m) => {
          const active = m === activeMonth;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, active && styles.monthChipActive]}
              onPress={() => {
                setActiveMonth(m);
                setDepositDate(`${m}-01`);
              }}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ১. ম্যানেজার ও সহযোগী */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>১. {activeMonth} মাসের ম্যানেজার ও সহযোগী</Text>

        <Text style={styles.label}>মেস ম্যানেজার</Text>
        <TextInput
          style={styles.input}
          value={managerName}
          onChangeText={setManagerName}
          placeholder="এই মাসের ম্যানেজারের নাম"
        />

        <Text style={styles.label}>সহযোগী</Text>
        <TextInput
          style={styles.input}
          value={assistantName}
          onChangeText={setAssistantName}
          placeholder="এই মাসের সহযোগীর নাম"
        />

        <TouchableOpacity style={styles.actionBtn} onPress={handleSaveRoles}>
          <Text style={styles.btnText}>মাসের দায়িত্ব সেভ করুন</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleRow} onPress={toggleMealsFeature}>
          <Text style={styles.toggleText}>
            সকাল-বিকালের মিল হিসাব (অপশনাল): {settings.enableMeals ? 'চালু আছে' : 'বন্ধ আছে'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ২. জমা এন্ট্রি */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>২. জমা এন্ট্রি (কে কত টাকা দিলো)</Text>

        {members.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {members.map((m) => {
              const active = m.name === selectedMemberName;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setSelectedMemberName(m.name);
                    setDepositBatch(m.batch || '');
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.label}>জমাকারীর নাম</Text>
        <TextInput
          style={styles.input}
          value={selectedMemberName}
          onChangeText={setSelectedMemberName}
          placeholder="নাম লিখুন বা তালিকা থেকে সিলেক্ট করুন"
        />

        <Text style={styles.label}>ব্যাচ নেম</Text>
        <TextInput
          style={styles.input}
          value={depositBatch}
          onChangeText={setDepositBatch}
          placeholder="যেমন: ব্যাচ-০১"
        />

        <Text style={styles.label}>জমার পরিমাণ (৳)</Text>
        <TextInput
          style={styles.input}
          value={depositAmount}
          onChangeText={setDepositAmount}
          placeholder="যেমন: 3000"
          keyboardType="numeric"
        />

        <Text style={styles.label}>তারিখ (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={depositDate}
          onChangeText={setDepositDate}
          placeholder="2026-12-01"
        />

        <Text style={styles.label}>নোট / ইনফরমেশন</Text>
        <TextInput
          style={styles.input}
          value={depositNote}
          onChangeText={setDepositNote}
          placeholder="যেমন: বিকাশ / ক্যাশ / অগ্রিম"
        />

        <TouchableOpacity style={styles.actionBtn} onPress={handleSaveDeposit}>
          <Text style={styles.btnText}>জমা সংরক্ষণ করুন</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 14 }]}>
          এই মাসের জমা তালিকা ({activeMonth})
        </Text>
        {monthDeposits.length === 0 ? (
          <Text style={styles.muted}>এই মাসে কোনো জমার এন্ট্রি নেই।</Text>
        ) : (
          monthDeposits.map((d) => (
            <View key={d.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowMain}>
                  {d.memberName} ({d.batch || 'ব্যাচ নেই'})
                </Text>
                <Text style={styles.rowSub}>
                  তারিখ: {d.date} {d.note ? `• ${d.note}` : ''}
                </Text>
              </View>
              <Text style={styles.depositAmt}>+৳{d.amount}</Text>
            </View>
          ))
        )}
      </View>

      {/* ৩. সদস্য যোগ ও তালিকা */}
      <View style={[styles.card, { marginBottom: 30 }]}>
        <Text style={styles.cardTitle}>৩. ব্যাচ নেম ও ইনফরমেশন যোগ করুন</Text>

        <Text style={styles.label}>নাম</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="ছাত্রীর নাম লিখুন"
        />

        <Text style={styles.label}>ব্যাচ নেম</Text>
        <TextInput
          style={styles.input}
          value={newBatch}
          onChangeText={setNewBatch}
          placeholder="যেমন: 1st Batch / ব্যাচ-০১"
        />

        <Text style={styles.label}>রুম / ফোন / ইনফরমেশন</Text>
        <TextInput
          style={styles.input}
          value={newRoom}
          onChangeText={setNewRoom}
          placeholder="রুম নম্বর (ঐচ্ছিক)"
        />
        <TextInput
          style={styles.input}
          value={newPhone}
          onChangeText={setNewPhone}
          placeholder="ফোন নম্বর (ঐচ্ছিক)"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={newInfo}
          onChangeText={setNewInfo}
          placeholder="অন্যান্য ইনফরমেশন বা নোট"
        />

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddMember}>
          <Text style={styles.btnText}>+ তালিকা ও ইনফরমেশন সেভ করুন</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 14 }]}>সংরক্ষিত তালিকা ({members.length})</Text>
        {members.map((m) => (
          <View key={m.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowMain}>
                {m.name} • {m.batch}
              </Text>
              <Text style={styles.rowSub}>
                {m.room ? `রুম: ${m.room} ` : ''}
                {m.phone ? `| ফোন: ${m.phone} ` : ''}
                {m.info ? `| তথ্য: ${m.info}` : ''}
              </Text>
            </View>
          </View>
        ))}
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
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 5, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    backgroundColor: '#FFF',
    color: '#0F172A',
    fontSize: 14,
  },
  actionBtn: {
    backgroundColor: '#1B4D3E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  toggleRow: { marginTop: 10, padding: 10, backgroundColor: '#F1F5F9', borderRadius: 8 },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  chipRow: { flexDirection: 'row', marginVertical: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#1B4D3E' },
  chipText: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowMain: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  depositAmt: { fontSize: 14, fontWeight: '800', color: '#15803D' },
  muted: { fontSize: 13, color: '#64748B' },
});
