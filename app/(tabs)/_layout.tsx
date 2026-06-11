import { Tabs } from 'expo-router';

import { PetTabBar } from '@/components/pet-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PetTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="pets" options={{ title: 'My Pets' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
