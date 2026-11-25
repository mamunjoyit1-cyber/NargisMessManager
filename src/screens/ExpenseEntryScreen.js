import React, { useState } from 'react';
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

export default function ExpenseEntryScreen() {
  const {
    itemCatalog,
    quantityUnits,
    activeMonth,
    getSpenderOptions,
    addExpense,
    addItemToCatalog,
    editItemInCatalog,
  } = useMessStore();

  const spenderOptions = getSpenderOptions();

  const [searchItem, setSearchItem] = useState('');
  const [selectedItem, setSelectedItem] = useState(itemCatalog[0] || 'চাল');
  const [newItemName, setNewItemName] = useState('');
  const [editItemMode, setEditItemMode] = useState(false);
  const [editedItemText, setEditedItemText] = useState('');

  const [qtyValue, setQtyValue] = useState('');
  const [qtyUnit, setQtyUnit] = useState(quantityUnits[0] || 'কেজি');
  const [amount, setAmount] = useState('');
  const [spentBy, setSpentBy] = useState(spenderOptions[0] || '');
  const [date, setDate] = useState(`${activeMonth}-01`);
  const [slipUri, setSlipUri] = useState('');
  const [note, setNote] = useState('');

  const filteredItems = itemCatalog.filter((item) =>
    item.toLowerCase().includes(searchItem.trim().toLowerCase())
  );

  const handleAddNewItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    addItemToCatalog(name);
    setSelectedItem(name);
    setNewItemName('');
    setSearchItem('');
    Alert.alert('সফল', 'নতুন আইটেমের নাম তালিকায় যোগ করা হয়েছে।');
  };

  const handleSaveEditedItem = () => {
    const name = editedItemText.trim();
    if (!name) return;
    editItemInCatalog(selectedItem, name);
    setSelectedItem(name);
    setEditItemMode(false);
    setEditedItemText('');
    Alert.alert('সফল', 'আইটেমের নাম আপডেট করা হয়েছে।');
  };

  const handleSaveExpense = () => {
    const numericAmount = Number(amount);
    if (!selectedItem.trim() || !numericAmount || numericAmount <= 0) {
      Alert.alert('তথ্য অসম্পূর্ণ', 'অনুগ্রহ করে আইটেম এবং সঠিক টাকার পরিমাণ দিন।');
      return;
    }

    const formattedQty = qtyValue.trim() ? `${qtyValue.trim()} ${qtyUnit}` : '';

    addExpense({
      month: activeMonth,
      date: date.trim() || `${activeMonth}-01`,
      itemName: selectedItem.trim(),
      quantityValue: qtyValue.trim(),
      quantityUnit: qtyUnit,
      quantity: formattedQty,
      amount: numericAmount,
      spentBy: spentBy.trim() || 'উল্লেখ করা হয়নি',
      slipUri: slipUri.trim() || null,
      note: note.trim(),
    });

    setQtyValue('');
    setAmount('');
    setSlipUri('');
    setNote('');

    Alert.alert(
      'সংরক্ষিত',
      `${selectedItem} (${formattedQty || 'পরিমাণ নেই'}) - ৳${numericAmount} সংরক্ষণ করা হয়েছে।`
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>বাজার ও খরচ এন্ট্রি ({activeMonth})</Text>

      {/* ১. আইটেম */}
      <View style={styles.card}>
        <Text style={styles.label}>১. কোন জিনিস কিনলো? (সার্চ বা সিলেক্ট করুন)</Text>
        <TextInput
          style={styles.input}
          value={searchItem}
          onChangeText={setSearchItem}
          placeholder="আইটেম খুঁজুন... যেমন: চাল, মাছ, মুরগী, শাক"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {filteredItems.map((item) => {
            const active = item === selectedItem;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setSelectedItem(item);
                  setEditedItemText(item);
                  setEditItemMode(false);
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.selectedInfo}>নির্বাচিত আইটেম: {selectedItem}</Text>

        <TouchableOpacity
          style={styles.smallBtn}
          onPress={() => {
            setEditedItemText(selectedItem);
            setEditItemMode(!editItemMode);
          }}
        >
          <Text style={styles.smallBtnText}>
            {editItemMode ? 'এডিট বাতিল করুন' : `"${selectedItem}" নাম এডিট করুন`}
          </Text>
        </TouchableOpacity>

        {editItemMode && (
          <View style={[styles.rowGap, { marginTop: 8 }]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={editedItemText}
              onChangeText={setEditedItemText}
              placeholder="সংশোধিত নাম লিখুন"
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveEditedItem}>
              <Text style={styles.actionBtnText}>সেভ</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 12 }]}>তালিকায় না থাকলে নতুন আইটেম যোগ করুন</Text>
        <View style={styles.rowGap}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="নতুন আইটেমের নাম লিখুন..."
          />
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddNewItem}>
            <Text style={styles.actionBtnText}>+ যোগ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ২. কোয়ান্টিটি ও টাকা */}
      <View style={styles.card}>
        <Text style={styles.label}>২. কোয়ান্টিটি (কতটুকু কিনলো)</Text>
        <View style={styles.rowGap}>
          <TextInput
            style={[styles.input, { width: 110, marginBottom: 0 }]}
            value={qtyValue}
            onChangeText={setQtyValue}
            placeholder="যেমন: 5 বা 2.5"
            keyboardType="numeric"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quantityUnits.map((unit) => {
              const active = unit === qtyUnit;
              return (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitChip, active && styles.unitChipActive]}
                  onPress={() => setQtyUnit(unit)}
                >
                  <Text style={[styles.unitText, active && styles.unitTextActive]}>{unit}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>৩. মোট খরচ (৳)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="টাকার পরিমাণ লিখুন (যেমন: 850)"
          keyboardType="numeric"
        />
      </View>

      {/* ৩. কে খরচ করলো ও স্লিপ */}
      <View style={[styles.card, { marginBottom: 30 }]}>
        <Text style={styles.label}>৪. কে খরচ করলো?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {spenderOptions.map((person) => {
            const active = person === spentBy;
            return (
              <TouchableOpacity
                key={person}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSpentBy(person)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{person}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TextInput
          style={styles.input}
          value={spentBy}
          onChangeText={setSpentBy}
          placeholder="অথবা এখানে নাম লিখুন..."
        />

        <Text style={styles.label}>৫. তারিখ (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="2026-12-06"
        />

        <Text style={styles.label}>৬. স্লিপ / ক্যাশ মেমো নম্বর</Text>
        <TextInput
          style={styles.input}
          value={slipUri}
          onChangeText={setSlipUri}
          placeholder="স্লিপের নম্বর বা নোট (ছবি আপলোড পরে যুক্ত হবে)"
        />

        <Text style={styles.label}>নোট (ঐচ্ছিক)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="দোকানের নাম বা বিশেষ কোনো তথ্য"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveExpense}>
          <Text style={styles.submitBtnText}>খরচ সংরক্ষণ করুন</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6', padding: 14 },
  title: { fontSize: 18, fontWeight: '800', color: '#1B4D3E', marginBottom: 12 },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    backgroundColor: '#FFF',
    color: '#0F172A',
    fontSize: 14,
  },
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
  selectedInfo: { fontSize: 13, fontWeight: '700', color: '#1B4D3E', marginTop: 4, marginBottom: 8 },
  smallBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  unitChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  unitText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  unitTextActive: { color: '#FFF' },
  actionBtn: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: { color: '#FFF', fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitBtn: {
    backgroundColor: '#1B4D3E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
