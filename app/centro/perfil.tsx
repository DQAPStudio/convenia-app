import { ProfileScreen } from '@/components/ProfileScreen';
import { Badge, Card, H2, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Center } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

const SUB: Record<string, { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' }> = {
  trial: { label: 'Periodo de prueba', tone: 'info' },
  active: { label: 'Suscripción activa', tone: 'ok' },
  past_due: { label: 'Pago pendiente', tone: 'warn' },
  canceled: { label: 'Suscripción cancelada', tone: 'bad' },
};

export default function PerfilCentro() {
  const { profile } = useAuth();
  const { data } = useQuery(async () =>
    unwrap(await supabase.from('centers').select('*').eq('id', profile!.center_id!).single()) as Center,
  );
  const sub = data ? SUB[data.subscription_status] ?? SUB.trial : null;
  return (
    <ProfileScreen>
      {data && sub ? (
        <Card>
          <H2>{data.name}</H2>
          <P muted>{data.city}</P>
          <Badge label={sub.label} tone={sub.tone} />
          {/* La facturación del centro (B2B) se gestiona fuera de la app, en el panel web. */}
          <P muted style={{ fontSize: 12 }}>
            La facturación del centro se gestiona desde el panel web de Convenia. Un pago pendiente nunca bloquea validar ni firmar.
          </P>
        </Card>
      ) : null}
    </ProfileScreen>
  );
}
