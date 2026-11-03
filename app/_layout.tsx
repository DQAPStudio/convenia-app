import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';
import { colors } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.accent,
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerBackTitle: 'Atrás',
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'Completa tu alta' }} />
          <Stack.Screen name="alumno" options={{ headerShown: false }} />
          <Stack.Screen name="empresa" options={{ headerShown: false }} />
          <Stack.Screen name="centro" options={{ headerShown: false }} />
          <Stack.Screen name="oferta/[id]" options={{ title: 'Oferta' }} />
          <Stack.Screen name="oferta/nueva" options={{ title: 'Nueva oferta', presentation: 'modal' }} />
          <Stack.Screen name="convenio/[id]" options={{ title: 'Convenio' }} />
          <Stack.Screen name="validar/[id]" options={{ title: 'Validar selección' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
