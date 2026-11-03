import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { colors } from '@/lib/theme';

export type TabDef = { name: string; title: string; icon: SymbolViewProps['name'] };

export function RoleTabs({ tabs }: { tabs: TabDef[] }) {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
      }}>
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => <SymbolView name={t.icon} tintColor={color} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}
