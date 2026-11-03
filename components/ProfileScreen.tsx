import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { Button, Card, ErrorBox, H1, H2, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { rpc } from '@/lib/supabase';

const extra = Constants.expoConfig?.extra ?? {};
const ROLE_NAME = { alumno: 'Alumno/a', empresa: 'Empresa', centro: 'Centro educativo' } as const;

export function ProfileScreen({ children }: { children?: ReactNode }) {
  const { profile, session, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Requisito de Apple: borrar la cuenta desde la propia app.
  function confirmDelete() {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu perfil y tus candidaturas. Los convenios ya firmados siguen guardados en qBID por tu centro. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rpc('delete_my_account');
              await signOut();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <H1>{profile?.full_name}</H1>
      <P muted>
        {profile ? ROLE_NAME[profile.role] : ''} · {session?.user.email}
      </P>
      {children}
      <Card>
        <H2>Ayuda y legal</H2>
        <Button title="Política de privacidad" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(extra.privacyUrl)} />
        <Button title="Términos de uso" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(extra.termsUrl)} />
        <Button title="Soporte" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(extra.supportUrl)} />
      </Card>
      <ErrorBox message={error} />
      <Button title="Cerrar sesión" variant="secondary" onPress={signOut} />
      <Button title="Eliminar mi cuenta" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
