import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { FoodEntry, useFoodLog } from '@/hooks/use-food-log';
import { analyzeFoodImage } from '@/services/anthropic';

const C = Colors.dark;

type PendingFood = {
  name: string;
  portionG: string;
  kcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

const EMPTY: PendingFood = { name: '', portionG: '', kcal: '', proteinG: '', carbsG: '', fatG: '' };

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const { entries, totals, addEntry, removeEntry } = useFoodLog();
  const [mode, setMode] = useState<null | 'manual' | 'camera'>( null);
  const [pending, setPending] = useState<PendingFood>(EMPTY);
  const [scanning, setScanning] = useState(false);

  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Tilgang nektet', 'Gi tilgang til kamera i innstillinger.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;
    setScanning(true);
    try {
      const food = await analyzeFoodImage(result.assets[0].base64);
      setPending({
        name: food.name,
        portionG: String(food.portionG),
        kcal: String(food.kcal),
        proteinG: String(food.proteinG),
        carbsG: String(food.carbsG),
        fatG: String(food.fatG),
      });
      setMode('manual');
    } catch {
      Alert.alert('Feil', 'Kunne ikke gjenkjenne maten. Prøv igjen eller legg til manuelt.');
    } finally {
      setScanning(false);
    }
  }

  function handleAdd() {
    const entry = {
      name: pending.name || 'Ukjent mat',
      portionG: Number(pending.portionG) || 0,
      kcal: Number(pending.kcal) || 0,
      proteinG: Number(pending.proteinG) || 0,
      carbsG: Number(pending.carbsG) || 0,
      fatG: Number(pending.fatG) || 0,
    };
    addEntry(entry);
    setPending(EMPTY);
    setMode(null);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.title}>Logg mat</Text>

      {/* Action buttons */}
      {!mode && (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={handleCamera} disabled={scanning}>
            {scanning ? (
              <ActivityIndicator color={C.accent} />
            ) : (
              <>
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionLabel}>Ta bilde</Text>
                <Text style={styles.actionSub}>AI gjenkjenner maten</Text>
              </>
            )}
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => { setPending(EMPTY); setMode('manual'); }}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionLabel}>Legg til manuelt</Text>
            <Text style={styles.actionSub}>Skriv inn selv</Text>
          </Pressable>
        </View>
      )}

      {/* Manual entry form */}
      {mode === 'manual' && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Legg til matvare</Text>

          <Text style={styles.fieldLabel}>Matvare</Text>
          <TextInput
            style={styles.input}
            value={pending.name}
            onChangeText={(v) => setPending((p) => ({ ...p, name: v }))}
            placeholder="Navn på matvare"
            placeholderTextColor={C.textSecondary}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Mengde (g)</Text>
              <TextInput
                style={styles.input}
                value={pending.portionG}
                onChangeText={(v) => setPending((p) => ({ ...p, portionG: v }))}
                placeholder="0"
                placeholderTextColor={C.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Kalorier (kcal)</Text>
              <TextInput
                style={styles.input}
                value={pending.kcal}
                onChangeText={(v) => setPending((p) => ({ ...p, kcal: v }))}
                placeholder="0"
                placeholderTextColor={C.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            {[
              { label: 'Protein (g)', key: 'proteinG' as const },
              { label: 'Karbo (g)', key: 'carbsG' as const },
              { label: 'Fett (g)', key: 'fatG' as const },
            ].map((f) => (
              <View key={f.key} style={styles.thirdField}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={pending[f.key]}
                  onChangeText={(v) => setPending((p) => ({ ...p, [f.key]: v }))}
                  placeholder="0"
                  placeholderTextColor={C.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <View style={styles.formButtons}>
            <Pressable style={styles.cancelBtn} onPress={() => setMode(null)}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addText}>Legg til</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Today's log */}
      {entries.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>I DAG</Text>
          {entries.map((e) => (
            <LogEntry key={e.id} entry={e} onRemove={() => removeEntry(e.id)} />
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Totalt</Text>
            <Text style={styles.totalKcal}>{totals.kcal} kcal</Text>
          </View>
          <View style={styles.macroSummary}>
            <Text style={styles.macroItem}>P: {totals.proteinG}g</Text>
            <Text style={styles.macroItem}>K: {totals.carbsG}g</Text>
            <Text style={styles.macroItem}>F: {totals.fatG}g</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function LogEntry({ entry, onRemove }: { entry: FoodEntry; onRemove: () => void }) {
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryName}>{entry.name}</Text>
        <Text style={styles.entrySub}>{entry.portionG}g · P:{entry.proteinG}g K:{entry.carbsG}g F:{entry.fatG}g</Text>
      </View>
      <Text style={styles.entryKcal}>{entry.kcal} kcal</Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: {
    flex: 1,
    backgroundColor: C.backgroundElement,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 32 },
  actionLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  actionSub: { color: C.textSecondary, fontSize: 12, textAlign: 'center' },
  form: { backgroundColor: C.backgroundElement, borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  formTitle: { color: C.text, fontSize: 18, fontWeight: '600' },
  fieldLabel: { color: C.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  input: {
    backgroundColor: C.backgroundSelected,
    color: C.text,
    borderRadius: 10,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: Spacing.two },
  halfField: { flex: 1, gap: 4 },
  thirdField: { flex: 1, gap: 4 },
  formButtons: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  cancelBtn: {
    flex: 1,
    backgroundColor: C.backgroundSelected,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  cancelText: { color: C.textSecondary, fontSize: 15, fontWeight: '600' },
  addBtn: {
    flex: 2,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addText: { color: '#000', fontSize: 15, fontWeight: '700' },
  logSection: { gap: Spacing.two },
  logTitle: { color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    padding: Spacing.two + 4,
    gap: Spacing.two,
  },
  entryInfo: { flex: 1 },
  entryName: { color: C.text, fontSize: 15, fontWeight: '500' },
  entrySub: { color: C.textSecondary, fontSize: 12 },
  entryKcal: { color: C.accent, fontSize: 15, fontWeight: '600' },
  removeBtn: { padding: 4 },
  removeText: { color: C.textSecondary, fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  totalLabel: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  totalKcal: { color: C.text, fontSize: 14, fontWeight: '700' },
  macroSummary: { flexDirection: 'row', gap: Spacing.three, paddingHorizontal: Spacing.two },
  macroItem: { color: C.textSecondary, fontSize: 13 },
});
