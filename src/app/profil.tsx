import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { ActivityLevel, Gender, Goal, Profile, calcMacroGoals, useProfile } from '@/hooks/use-profile';

const C = Colors.dark;

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.segmentBtn, value === opt && styles.segmentBtnActive]}
          onPress={() => onChange(opt)}>
          <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>
            {labels[opt]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Stepper({ value, onChange, min = 1, max = 999, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}>
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + step))}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useProfile();
  const [draft, setDraft] = useState<Profile>(profile);

  const macros = calcMacroGoals(draft);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    await saveProfile(draft);
    Alert.alert('Lagret', 'Profilen din er oppdatert.');
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.title}>Profil</Text>

      {/* Name */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NAVN</Text>
        <TextInput
          style={styles.input}
          value={draft.name}
          onChangeText={(v) => set('name', v)}
          placeholder="Ditt navn"
          placeholderTextColor={C.textSecondary}
        />
      </View>

      {/* Gender */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KJØNN</Text>
        <SegmentControl<Gender>
          options={['male', 'female']}
          value={draft.gender}
          onChange={(v) => set('gender', v)}
          labels={{ male: 'Mann', female: 'Kvinne' }}
        />
      </View>

      {/* Body stats */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KROPPSMÅL</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBlock}>
            <Text style={styles.statBlockLabel}>Alder</Text>
            <Stepper value={draft.age} onChange={(v) => set('age', v)} min={10} max={100} />
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statBlockLabel}>Høyde (cm)</Text>
            <Stepper value={draft.heightCm} onChange={(v) => set('heightCm', v)} min={100} max={250} />
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statBlockLabel}>Vekt (kg)</Text>
            <Stepper value={draft.weightKg} onChange={(v) => set('weightKg', v)} min={30} max={300} step={1} />
          </View>
        </View>
      </View>

      {/* Goal */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MÅL</Text>
        <SegmentControl<Goal>
          options={['lose', 'maintain', 'gain']}
          value={draft.goal}
          onChange={(v) => set('goal', v)}
          labels={{ lose: 'Gå ned', maintain: 'Vedlikehold', gain: 'Bygg muskler' }}
        />
      </View>

      {/* Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AKTIVITETSNIVÅ</Text>
        <View style={styles.activityList}>
          {(
            [
              ['sedentary', 'Stillesittende', 'Lite eller ingen trening'],
              ['light', 'Lett aktiv', '1–3 dager trening/uke'],
              ['moderate', 'Moderat aktiv', '3–5 dager trening/uke'],
              ['active', 'Veldig aktiv', '6–7 dager trening/uke'],
              ['very_active', 'Ekstremt aktiv', 'Hard trening + fysisk jobb'],
            ] as [ActivityLevel, string, string][]
          ).map(([val, label, desc]) => (
            <TouchableOpacity
              key={val}
              style={[styles.activityRow, draft.activityLevel === val && styles.activityRowActive]}
              onPress={() => set('activityLevel', val)}>
              <View style={[styles.radioOuter, draft.activityLevel === val && styles.radioOuterActive]}>
                {draft.activityLevel === val && <View style={styles.radioInner} />}
              </View>
              <View style={styles.activityText}>
                <Text style={styles.activityLabel}>{label}</Text>
                <Text style={styles.activityDesc}>{desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Calculated goal */}
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>Daglig mål beregnet</Text>
        <Text style={styles.goalKcal}>{macros.kcal} kcal</Text>
        <View style={styles.goalMacros}>
          <View style={styles.goalMacroItem}>
            <Text style={styles.goalMacroNum}>{macros.proteinG}g</Text>
            <Text style={styles.goalMacroLabel}>protein</Text>
          </View>
          <View style={styles.goalMacroDivider} />
          <View style={styles.goalMacroItem}>
            <Text style={styles.goalMacroNum}>{macros.carbsG}g</Text>
            <Text style={styles.goalMacroLabel}>karbo</Text>
          </View>
          <View style={styles.goalMacroDivider} />
          <View style={styles.goalMacroItem}>
            <Text style={styles.goalMacroNum}>{macros.fatG}g</Text>
            <Text style={styles.goalMacroLabel}>fett</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Lagre profil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
  section: { gap: Spacing.two },
  sectionLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  input: {
    backgroundColor: C.backgroundElement,
    color: C.text,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: C.accent },
  segmentText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: '#000' },
  statsGrid: { flexDirection: 'row', gap: Spacing.two },
  statBlock: { flex: 1, backgroundColor: C.backgroundElement, borderRadius: 12, padding: Spacing.two, gap: Spacing.one, alignItems: 'center' },
  statBlockLabel: { color: C.textSecondary, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: C.text, fontSize: 18, lineHeight: 22 },
  stepValue: { color: C.text, fontSize: 17, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  activityList: { gap: Spacing.one },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two + 4,
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    gap: Spacing.two,
  },
  activityRowActive: { backgroundColor: C.backgroundSelected },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.textSecondary, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: C.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
  activityText: { flex: 1 },
  activityLabel: { color: C.text, fontSize: 15, fontWeight: '500' },
  activityDesc: { color: C.textSecondary, fontSize: 12 },
  goalCard: {
    backgroundColor: C.accentMuted,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.accent + '44',
  },
  goalTitle: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },
  goalKcal: { color: C.accent, fontSize: 40, fontWeight: '700' },
  goalMacros: { flexDirection: 'row', alignItems: 'center' },
  goalMacroItem: { flex: 1, alignItems: 'center' },
  goalMacroNum: { color: C.text, fontSize: 18, fontWeight: '600' },
  goalMacroLabel: { color: C.textSecondary, fontSize: 12 },
  goalMacroDivider: { width: 1, height: 30, backgroundColor: C.border },
  saveBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
