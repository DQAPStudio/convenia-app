import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Tone } from '@/lib/labels';
import { colors, radius, space } from '@/lib/theme';

export function Screen({
  children,
  refreshing,
  onRefresh,
  edges = [],
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      <ScrollView
        contentContainerStyle={{ padding: space(4), gap: space(3), paddingBottom: space(10) }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  return <Text style={s.h2}>{children}</Text>;
}
export function P({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[s.p, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const bg = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.badSoft : colors.silverSoft;
  const fg = variant === 'primary' ? colors.accentInk : variant === 'danger' ? colors.bad : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space(1) }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} style={[s.input, style]} {...props} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

const toneColors: Record<Tone, [string, string]> = {
  info: [colors.infoSoft, colors.info],
  warn: [colors.warnSoft, colors.warn],
  ok: [colors.okSoft, colors.ok],
  bad: [colors.badSoft, colors.bad],
  accent: [colors.accentSoft, colors.accent],
  silver: [colors.silverSoft, colors.silver],
};

export function Badge({ label, tone = 'silver' }: { label: string; tone?: Tone }) {
  const [bg, fg] = toneColors[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.h2}>{title}</Text>
      {text ? <P muted style={{ textAlign: 'center' }}>{text}</P> : null}
    </View>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={[s.card, { backgroundColor: colors.badSoft, borderColor: colors.badSoft }]}>
      <Text style={{ color: colors.bad }}>{message}</Text>
    </View>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(2) }}>
      <View style={[s.box, value && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        {value ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}
      </View>
      <Text style={[s.p, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  h2: { fontSize: 17, fontWeight: '600', color: colors.ink },
  p: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2),
  },
  btn: { borderRadius: radius.md, paddingVertical: space(3.5), paddingHorizontal: space(4), alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  hint: { fontSize: 12, color: colors.faint },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space(3),
    paddingVertical: space(3),
    fontSize: 16,
    color: colors.ink,
  },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space(2.5), paddingVertical: space(1) },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', padding: space(8), gap: space(2) },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.silver,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
