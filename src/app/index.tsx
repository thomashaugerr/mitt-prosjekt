import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useFoodLog } from '@/hooks/use-food-log';
import { useProfile } from '@/hooks/use-profile';
import { useWhoop } from '@/hooks/use-whoop';
import { getDailyRecommendation } from '@/services/anthropic';

const C = Colors.dark;

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'God morgen';
  if (h < 17) return 'God dag';
  return 'God kveld';
}

function todayNorwegian() {
  return new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ProgressBar({ value, max, color = C.accent }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, macros } = useProfile();
  const { totals } = useFoodLog();
  const { recovery, kcalBurned } = useWhoop();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const netto = macros.kcal - totals.kcal + kcalBurned;

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) return;
    setRecLoading(true);
    getDailyRecommendation({
      name: profile.name,
      goal: profile.goal,
      kcalGoal: macros.kcal,
      kcalEaten: totals.kcal,
      kcalBurned,
      recoveryScore: recovery?.score ?? null,
    })
      .then(setRecommendation)
      .catch(() => setRecommendation('Sett opp Anthropic API-nøkkel for å få anbefalinger.'))
      .finally(() => setRecLoading(false));
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>

      {/* Header */}
      <Text style={styles.greeting}>{greeting()}{profile.name ? `, ${profile.name}` : ''}</Text>
      <Text style={styles.date}>{todayNorwegian()}</Text>

      {/* Calorie card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>KALORIER</Text>
        <View style={styles.calRow}>
          <View style={styles.calCol}>
            <Text style={styles.calBig}>{totals.kcal}</Text>
            <Text style={styles.calSub}>spist</Text>
          </View>
          <View style={styles.calDivider} />
          <View style={styles.calCol}>
            <Text style={styles.calBig}>{macros.kcal}</Text>
            <Text style={styles.calSub}>mål</Text>
          </View>
          {kcalBurned > 0 && (
            <>
              <View style={styles.calDivider} />
              <View style={styles.calCol}>
                <Text style={styles.calBig}>{kcalBurned}</Text>
                <Text style={styles.calSub}>forbrent</Text>
              </View>
            </>
          )}
        </View>
        <ProgressBar value={totals.kcal} max={macros.kcal} />
        <Text style={styles.nettoText}>
          {netto > 0 ? `${netto} kcal igjen` : `${Math.abs(netto)} kcal over mål`}
        </Text>
      </View>

      {/* Macro card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>MAKROER</Text>
        <View style={styles.macroRow}>
          {[
            { label: 'Protein', value: totals.proteinG, goal: macros.proteinG, color: '#3B82F6' },
            { label: 'Karbo', value: totals.carbsG, goal: macros.carbsG, color: C.warning },
            { label: 'Fett', value: totals.fatG, goal: macros.fatG, color: '#EC4899' },
          ].map((m) => (
            <View key={m.label} style={styles.macroCol}>
              <Text style={styles.macroVal}>{m.value}g</Text>
              <ProgressBar value={m.value} max={m.goal} color={m.color} />
              <Text style={styles.macroLabel}>{m.label}</Text>
              <Text style={styles.macroGoal}>/ {m.goal}g</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI recommendation */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>DAGENS ANBEFALING</Text>
        {recLoading ? (
          <Text style={styles.recText}>Henter anbefaling…</Text>
        ) : (
          <Text style={styles.recText}>{recommendation ?? 'Logg mat for å få en personlig anbefaling.'}</Text>
        )}
      </View>

      {/* CTA */}
      <Pressable style={styles.ctaButton} onPress={() => router.push('/log')}>
        <Text style={styles.ctaText}>+ Logg mat</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  greeting: { color: C.text, fontSize: 28, fontWeight: '700' },
  date: { color: C.textSecondary, fontSize: 14, marginTop: -Spacing.two, textTransform: 'capitalize' },
  card: {
    backgroundColor: C.backgroundElement,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  calCol: { flex: 1, alignItems: 'center' },
  calBig: { color: C.text, fontSize: 32, fontWeight: '700' },
  calSub: { color: C.textSecondary, fontSize: 13 },
  calDivider: { width: 1, height: 40, backgroundColor: C.border },
  progressTrack: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  nettoText: { color: C.textSecondary, fontSize: 13, textAlign: 'right' },
  macroRow: { flexDirection: 'row', gap: Spacing.two },
  macroCol: { flex: 1, gap: 4 },
  macroVal: { color: C.text, fontSize: 20, fontWeight: '600' },
  macroLabel: { color: C.text, fontSize: 13, fontWeight: '500' },
  macroGoal: { color: C.textSecondary, fontSize: 12 },
  recText: { color: C.text, fontSize: 15, lineHeight: 22 },
  ctaButton: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
