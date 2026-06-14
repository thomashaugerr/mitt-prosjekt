import { TabList, TabSlot, TabTrigger, TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

const C = Colors.dark;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.tabList}>
          <View style={styles.inner}>
            <TabTrigger name="home" href="/" asChild>
              <TabButton label="I dag" />
            </TabTrigger>
            <TabTrigger name="log" href="/log" asChild>
              <TabButton label="Logg mat" />
            </TabTrigger>
            <TabTrigger name="whoop" href="/whoop" asChild>
              <TabButton label="Whoop" />
            </TabTrigger>
            <TabTrigger name="profil" href="/profil" asChild>
              <TabButton label="Profil" />
            </TabTrigger>
          </View>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ label, isFocused, ...props }: TabTriggerSlotProps & { label: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabBtn, isFocused && styles.tabBtnActive, pressed && styles.pressed]}>
      <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabList: {
    position: 'absolute',
    top: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  inner: {
    flexDirection: 'row',
    maxWidth: MaxContentWidth,
    gap: Spacing.one,
    flex: 1,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.two + 4,
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: C.backgroundElement },
  tabText: { color: C.textSecondary, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: C.text },
  pressed: { opacity: 0.7 },
});
