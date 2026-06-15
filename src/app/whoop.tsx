import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useWhoop } from '@/hooks/use-whoop';

const C = Colors.dark;

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const size = 100;
  return (
    <View style={styles.circleWrapper}>
      <View style={[styles.circle, { width: size, height: size, borderColor: color, borderWidth: 5 }]}>
        <Text style={[styles.circleScore, { color }]}>{score}</Text>
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
}

function recoveryColor(score: number) {
  if (score >= 67) return C.accent;
  if (score >= 34) return C.warning;
  return C.danger;
}

export default function WhoopScreen() {
  const insets = useSafeAreaInsets();
  const { connected, hasSecret, recovery, sleep, strain, kcalBurned, loading, error, connect, disconnect, refresh } = useWhoop();
  const [secretInput, setSecretInput] = useState('');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>

      <Text style={styles.title}>WHOOP</Text>

      {!connected ? (
        <View style={styles.connectCard}>
          <Text style={styles.connectIcon}>❤️</Text>
          <Text style={styles.connectTitle}>Koble til WHOOP</Text>
          <Text style={styles.connectDesc}>
            Se recovery, søvn og strain direkte i appen. Lim inn Client Secret fra WHOOP Developer Portal.
          </Text>
          <View style={styles.secretField}>
            <Text style={styles.secretLabel}>Client Secret</Text>
            <TextInput
              style={styles.secretInput}
              value={secretInput}
              onChangeText={setSecretInput}
              placeholder={hasSecret ? '••••••••  (lagret)' : 'Lim inn client secret'}
              placeholderTextColor={C.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Pressable
            style={[styles.connectBtn, !(secretInput || hasSecret) && styles.connectBtnDisabled]}
            onPress={() => connect(secretInput || '')}
            disabled={loading || !(secretInput || hasSecret)}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.connectBtnText}>Koble til WHOOP</Text>
            )}
          </Pressable>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={C.accent} />
              <Text style={styles.loadingText}>Henter data…</Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}


          {/* Recovery */}
          {recovery && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>RECOVERY</Text>
              <View style={styles.recoveryRow}>
                <ScoreCircle
                  score={recovery.score}
                  label="Recovery"
                  color={recoveryColor(recovery.score)}
                />
                <View style={styles.recoveryStats}>
                  <StatRow label="HRV" value={`${recovery.hrv} ms`} />
                  <StatRow label="Hvilepuls" value={`${recovery.restingHr} bpm`} />
                </View>
              </View>
              <Text style={styles.recoveryHint}>
                {recovery.score >= 67
                  ? 'Du er godt restituert. Bra dag for hard trening.'
                  : recovery.score >= 34
                  ? 'Moderat restitusjon. Hold intensiteten lav til middels.'
                  : 'Kroppen trenger hvile. Prioriter lett aktivitet og søvn.'}
              </Text>
            </View>
          )}

          {/* Sleep */}
          {sleep && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SØVN</Text>
              <View style={styles.sleepRow}>
                <View>
                  <Text style={styles.bigNum}>{sleep.durationHours}t</Text>
                  <Text style={styles.bigNumLabel}>søvn</Text>
                </View>
                <View style={styles.sleepScoreBox}>
                  <Text style={[styles.sleepScore, { color: recoveryColor(sleep.score) }]}>
                    {sleep.score}%
                  </Text>
                  <Text style={styles.sleepScoreLabel}>effektivitet</Text>
                </View>
              </View>
            </View>
          )}

          {/* Strain */}
          {strain && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>STRAIN</Text>
              <View style={styles.strainRow}>
                <View>
                  <Text style={styles.bigNum}>{strain.score}</Text>
                  <Text style={styles.bigNumLabel}>av 21</Text>
                </View>
                <View style={styles.strainRight}>
                  <Text style={styles.strainKcal}>{kcalBurned} kcal</Text>
                  <Text style={styles.strainKcalLabel}>forbrent</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(strain.score / 21) * 100}%`, backgroundColor: C.accent },
                  ]}
                />
              </View>
            </View>
          )}

          <Pressable style={styles.refreshBtn} onPress={refresh} disabled={loading}>
            <Text style={styles.refreshText}>Oppdater</Text>
          </Pressable>

          <Pressable onPress={disconnect}>
            <Text style={styles.disconnectText}>Koble fra WHOOP</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
  connectCard: {
    backgroundColor: C.backgroundElement,
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  connectIcon: { fontSize: 48 },
  connectTitle: { color: C.text, fontSize: 22, fontWeight: '700' },
  connectDesc: { color: C.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  connectBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    width: '100%',
  },
  connectBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  connectBtnDisabled: { backgroundColor: C.backgroundSelected },
  secretField: { alignSelf: 'stretch', gap: 6 },
  secretLabel: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },
  secretInput: {
    backgroundColor: C.backgroundSelected,
    color: C.text,
    borderRadius: 10,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  loadingRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  loadingText: { color: C.textSecondary, fontSize: 14 },
  errorText: { color: C.danger, fontSize: 14 },
  card: { backgroundColor: C.backgroundElement, borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  recoveryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  circleWrapper: { alignItems: 'center', gap: 6 },
  circle: { borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  circleScore: { fontSize: 28, fontWeight: '700' },
  circleLabel: { color: C.textSecondary, fontSize: 12 },
  recoveryStats: { flex: 1, gap: Spacing.two },
  recoveryHint: { color: C.textSecondary, fontSize: 13, lineHeight: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: C.textSecondary, fontSize: 14 },
  statValue: { color: C.text, fontSize: 14, fontWeight: '600' },
  sleepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bigNum: { color: C.text, fontSize: 36, fontWeight: '700' },
  bigNumLabel: { color: C.textSecondary, fontSize: 13 },
  sleepScoreBox: { alignItems: 'flex-end' },
  sleepScore: { fontSize: 32, fontWeight: '700' },
  sleepScoreLabel: { color: C.textSecondary, fontSize: 13 },
  strainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strainRight: { alignItems: 'flex-end' },
  strainKcal: { color: C.text, fontSize: 26, fontWeight: '700' },
  strainKcalLabel: { color: C.textSecondary, fontSize: 13 },
  progressTrack: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  refreshBtn: {
    backgroundColor: C.backgroundElement,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  refreshText: { color: C.text, fontSize: 15, fontWeight: '600' },
  disconnectText: { color: C.textSecondary, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
});
