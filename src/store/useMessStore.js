// src/store/useMessStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_ITEMS = [
  // চাল, ডাল ও মুদি
  'চাল', 'মসুর ডাল', 'মুগ ডাল', 'বুটের ডাল', 'সয়াবিন তেল', 'সরিষার তেল',
  'আটা', 'ময়দা', 'সুজি', 'নুডলস', 'মুড়ি', 'চিড়া',
  'লবণ', 'চিনি', 'চা-পাতা', 'গুঁড়া দুধ',
  // মাছ, মাংস ও প্রোটিন
  'মুরগী (ব্রয়লার)', 'মুরগী (সোনালী)', 'রুই মাছ', 'কাতলা মাছ', 'পাঙ্গাস মাছ',
  'তেলাপিয়া মাছ', 'চিংড়ি মাছ', 'ছোট মাছ', 'শুঁটকি', 'ডিম', 'গরুর মাংস',
  // শাক-সবজি ও কাঁচা বাজার
  'আলু', 'পেঁয়াজ', 'রসুন', 'আদা', 'কাঁচা মরিচ',
  'লাল শাক', 'পালং শাক', 'পুঁই শাক', 'কলমি শাক', 'লাউ শাক',
  'বেগুন', 'পটল', 'ঢেঁড়স', 'করলা', 'লাউ', 'মিষ্টি কুমড়া', 'পেঁপে',
  'টমেটো', 'শসা', 'গাজর', 'ফুলকপি', 'বাঁধাকপি', 'শিম', 'কাঁচকলা', 'লেবু', 'ধনে পাতা',
  // মসলা
  'হলুদ গুঁড়া', 'মরিচ গুঁড়া', 'ধনিয়া গুঁড়া', 'জিরা গুঁড়া', 'গরম মসলা', 'তেজপাতা-এলাচ-দারুচিনি',
  // রান্নাঘর ও অন্যান্য
  'গ্যাস সিলিন্ডার', 'পানির জার', 'ভিম বার / ডিশ ওয়াশ', 'পরিচ্ছন্নতা সামগ্রী', 'কাগজ-কলম', 'রিকশা/যাতায়াত ভাড়া',
];

export const QUANTITY_UNITS = [
  'কেজি', 'গ্রাম', 'লিটার', 'মিলি', 'পিস / টি', 'ডজন', 'হালি', 'প্যাকেট', 'আঁটি / মুঠা', 'বস্তা',
];

const DEMO_MEMBERS = [
  { id: 'm1', name: 'ডেমু ছাত্রী ০১ (ম্যানেজার)', batch: 'ব্যাচ-০১ (ডেমু)', room: '১০১', phone: '01700000001' },
  { id: 'm2', name: 'ডেমু ছাত্রী ০২ (সহযোগী)', batch: 'ব্যাচ-০১ (ডেমু)', room: '১০১', phone: '01700000002' },
  { id: 'm3', name: 'ডেমু ছাত্রী ০৩', batch: 'ব্যাচ-০২ (ডেমু)', room: '১০২', phone: '01700000003' },
  { id: 'm4', name: 'ডেমু ছাত্রী ০৪', batch: 'ব্যাচ-০২ (ডেমু)', room: '১০২', phone: '01700000004' },
];

const DEMO_DEPOSITS = [
  { id: 'd1', month: '2026-12', date: '2026-12-01', memberName: 'ডেমু ছাত্রী ০১ (ম্যানেজার)', batch: 'ব্যাচ-০১ (ডেমু)', amount: 3000, note: 'বিকাশ' },
  { id: 'd2', month: '2026-12', date: '2026-12-01', memberName: 'ডেমু ছাত্রী ০২ (সহযোগী)', batch: 'ব্যাচ-০১ (ডেমু)', amount: 3000, note: 'ক্যাশ' },
  { id: 'd3', month: '2026-12', date: '2026-12-02', memberName: 'ডেমু ছাত্রী ০৩', batch: 'ব্যাচ-০২ (ডেমু)', amount: 2500, note: '' },
];

const DEMO_EXPENSES = [
  {
    id: 'e1', month: '2026-12', date: '2026-12-02', itemName: 'চাল',
    quantityValue: '২৫', quantityUnit: 'কেজি', quantity: '২৫ কেজি',
    amount: 1650, spentBy: 'ডেমু ছাত্রী ০১ (ম্যানেজার)', slipUri: null, note: 'মিনিকেট চাল',
  },
  {
    id: 'e2', month: '2026-12', date: '2026-12-03', itemName: 'সয়াবিন তেল',
    quantityValue: '৫', quantityUnit: 'লিটার', quantity: '৫ লিটার',
    amount: 920, spentBy: 'ডেমু ছাত্রী ০২ (সহযোগী)', slipUri: null, note: '',
  },
  {
    id: 'e3', month: '2026-12', date: '2026-12-04', itemName: 'মুরগী (ব্রয়লার)',
    quantityValue: '৩.৫', quantityUnit: 'কেজি', quantity: '৩.৫ কেজি',
    amount: 665, spentBy: 'ডেমু ছাত্রী ০১ (ম্যানেজার)', slipUri: null, note: 'দুপুরের বাজার',
  },
  {
    id: 'e4', month: '2026-12', date: '2026-12-04', itemName: 'রুই মাছ',
    quantityValue: '২', quantityUnit: 'কেজি', quantity: '২ কেজি',
    amount: 640, spentBy: 'ডেমু ছাত্রী ০২ (সহযোগী)', slipUri: null, note: '',
  },
  {
    id: 'e5', month: '2026-12', date: '2026-12-05', itemName: 'লাল শাক',
    quantityValue: '৬', quantityUnit: 'আঁটি / মুঠা', quantity: '৬ আঁটি / মুঠা',
    amount: 90, spentBy: 'ডেমু ছাত্রী ০৩', slipUri: null, note: 'সকালের কাঁচা বাজার',
  },
];

export const useMessStore = create(
  persist(
    (set, get) => ({
      branding: {
        collegeName: 'Nargis Memorial Nursing College',
        collegeNameBn: 'নার্গিস মেমোরিয়াল নার্সিং কলেজ',
        hostelName: 'ছাত্রী হোস্টেল মেস হিসাব',
        websiteUrl: 'https://nmnursingcollege.edu.bd/en/',
        logoUri: null,
      },
      settings: {
        enableMeals: false,
        currency: '৳',
      },
      activeMonth: '2026-12',
      monthRoles: {
        '2026-11': {
          manager: 'ডেমু ম্যানেজার (নভেম্বর)',
          assistant: 'ডেমু সহযোগী (নভেম্বর)',
        },
        '2026-12': {
          manager: 'ডেমু ছাত্রী ০১ (ম্যানেজার)',
          assistant: 'ডেমু ছাত্রী ০২ (সহযোগী)',
        },
      },
      itemCatalog: DEFAULT_ITEMS,
      quantityUnits: QUANTITY_UNITS,
      members: DEMO_MEMBERS,
      deposits: DEMO_DEPOSITS,
      expenses: DEMO_EXPENSES,
      meals: [],

      // কে খরচ করলো তার কুইক লিস্ট
      getSpenderOptions: () => {
        const state = get();
        const roleObj = state.monthRoles[state.activeMonth] || {};
        const names = new Set([
          roleObj.manager,
          roleObj.assistant,
          ...state.members.map((m) => m.name),
          'হোস্টেল বুয়া / স্টাফ',
        ]);
        return Array.from(names).filter(Boolean);
      },

      updateBranding: (newBranding) =>
        set((state) => ({ branding: { ...state.branding, ...newBranding } })),

      toggleMealsFeature: () =>
        set((state) => ({
          settings: { ...state.settings, enableMeals: !state.settings.enableMeals },
        })),

      setActiveMonth: (month) =>
        set((state) => ({
          activeMonth: month,
          monthRoles: {
            ...state.monthRoles,
            [month]: state.monthRoles[month] || { manager: '', assistant: '' },
          },
        })),

      setMonthRoles: (month, manager, assistant) =>
        set((state) => ({
          monthRoles: {
            ...state.monthRoles,
            [month]: { manager, assistant },
          },
        })),

      addItemToCatalog: (itemName) =>
        set((state) => {
          const clean = (itemName || '').trim();
          if (!clean || state.itemCatalog.includes(clean)) return state;
          return { itemCatalog: [clean, ...state.itemCatalog] };
        }),

      editItemInCatalog: (oldName, newName) =>
        set((state) => {
          const cleanNew = (newName || '').trim();
          if (!cleanNew) return state;
          return {
            itemCatalog: state.itemCatalog.map((item) =>
              item === oldName ? cleanNew : item
            ),
            expenses: state.expenses.map((exp) =>
              exp.itemName === oldName ? { ...exp, itemName: cleanNew } : exp
            ),
          };
        }),

      addMember: (member) =>
        set((state) => ({
          members: [...state.members, { id: Date.now().toString(), ...member }],
        })),

      addDeposit: (deposit) =>
        set((state) => ({
          deposits: [
            {
              id: Date.now().toString(),
              month: deposit.month || get().activeMonth,
              ...deposit,
            },
            ...state.deposits,
          ],
        })),

      addExpense: (expense) =>
        set((state) => {
          const item = (expense.itemName || '').trim();
          const updatedCatalog =
            item && !state.itemCatalog.includes(item)
              ? [item, ...state.itemCatalog]
              : state.itemCatalog;
          return {
            itemCatalog: updatedCatalog,
            expenses: [
              {
                id: Date.now().toString(),
                month: expense.month || get().activeMonth,
                slipUri: expense.slipUri || null,
                ...expense,
              },
              ...state.expenses,
            ],
          };
        }),

      clearDemoData: () =>
        set(() => ({
          members: [],
          deposits: [],
          expenses: [],
          meals: [],
        })),

      restoreFullData: (backupPayload) => set(() => ({ ...backupPayload })),
    }),
    {
      name: 'nargis-hostel-mess-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
