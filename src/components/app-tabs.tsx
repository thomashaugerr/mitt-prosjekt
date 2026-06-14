import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';

const C = Colors.dark;

type TabIconProps = { name: string; fallback: string; color: string; size?: number };

function TabIcon({ name, fallback, color, size = 22 }: TabIconProps) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={name as any} size={size} tintColor={color} />;
  }
  return <Text style={{ fontSize: size - 4, color }}>{fallback}</Text>;
}

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.background,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'I dag',
          tabBarIcon: ({ color }) => <TabIcon name="house.fill" fallback="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Logg mat',
          tabBarIcon: ({ color }) => <TabIcon name="fork.knife" fallback="🍽" color={color} />,
        }}
      />
      <Tabs.Screen
        name="whoop"
        options={{
          title: 'Whoop',
          tabBarIcon: ({ color }) => <TabIcon name="heart.fill" fallback="❤️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <TabIcon name="person.crop.circle.fill" fallback="👤" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
