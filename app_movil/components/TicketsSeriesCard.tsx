import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './ui/Card';

export type ThemePalette = {
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  background: string;
  primary: string;
};

export type WeeksRange = 4 | 8 | 12;

export function TicketsSeriesCard({
  colors,
  weeks,
  onWeeksChange,
  totals,
  series,
  loading,
}: Readonly<{
  colors: ThemePalette;
  weeks: WeeksRange;
  onWeeksChange: (w: WeeksRange) => void;
  totals: { abiertos: number; resueltos: number; label: string };
  series: { label: string; abiertos: number; resueltos: number }[];
  loading: boolean;
}>) {
  const maxVal = Math.max(1, ...series.map(s => Math.max(s.abiertos, s.resueltos)));
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Tickets</Text>
        <View style={styles.toggleRow}>
          {[4, 8, 12].map((w) => (
            <TouchableOpacity
              key={`tkt-${w}`}
              onPress={() => onWeeksChange(w as WeeksRange)}
              style={[
                styles.toggleChip,
                { backgroundColor: colors.background, borderColor: colors.border },
                weeks === w && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
              ]}
            >
              <Text style={{ color: weeks === (w as WeeksRange) ? colors.primary : colors.textSecondary }}>{w} sem</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.bodyRow}>
        <View style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Abiertos</Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{loading ? '…' : totals.abiertos}</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Resueltos</Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{loading ? '…' : totals.resueltos}</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Rango</Text>
          <Text style={[styles.kpiValue, { color: colors.textSecondary }]}>{totals.label}</Text>
        </View>
      </View>
      <View style={styles.miniBarsRow}>
        {series.map((pt) => (
          <View key={`tkt-${pt.label}`} style={styles.barGroup}>
            <View style={[styles.bar, { height: 36 * (pt.abiertos / maxVal), backgroundColor: colors.textSecondary + '55' }]} />
            <View style={[styles.bar, { height: 36 * (pt.resueltos / maxVal), backgroundColor: colors.primary }]} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    marginLeft: 8,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 10,
  },
  barGroup: {
    width: 10,
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 3,
  },
  kpi: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default TicketsSeriesCard;
