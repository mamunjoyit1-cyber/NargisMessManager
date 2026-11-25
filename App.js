import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen from './src/screens/DashboardScreen';
import ExpenseEntryScreen from './src/screens/ExpenseEntryScreen';
import DepositAndRolesScreen from './src/screens/DepositAndRolesScreen';
import ReportScreen from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  'ড্যাশবোর্ড': '📊',
  'খরচ ও স্লিপ': '🛒',
  'জমা ও দায়িত্ব': '💰',
  'রিপোর্ট': '📄',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1B4D3E',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700', paddingBottom: 4 },
          tabBarStyle: { height: 62, paddingTop: 6 },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>{ICONS[route.name] || '•'}</Text>
          ),
        })}
      >
        <Tab.Screen name="ড্যাশবোর্ড" component={DashboardScreen} />
        <Tab.Screen name="খরচ ও স্লিপ" component={ExpenseEntryScreen} />
        <Tab.Screen name="জমা ও দায়িত্ব" component={DepositAndRolesScreen} />
        <Tab.Screen name="রিপোর্ট" component={ReportScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
