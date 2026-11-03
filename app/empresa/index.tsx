import { router } from 'expo-router';

import { OfferCard } from '@/components/OfferCard';
import { Badge, Button, Empty, ErrorBox, H1, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Offer } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

type Row_ = Offer & { offer_reviews: { approved: boolean }[]; applications: { id: string }[] };

export default function OfertasEmpresa() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useQuery(async () =>
    unwrap(
      await supabase
        .from('offers')
        .select('*, companies(name, city), offer_reviews(approved), applications(id)')
        .eq('company_id', profile!.company_id!)
        .order('created_at', { ascending: false }),
    ) as Row_[],
  );

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Tus ofertas</H1>
      <P muted>Publicar es gratis. Los centros las revisan antes de mostrarlas.</P>
      <Button title="+ Nueva oferta" onPress={() => router.push('/oferta/nueva')} />
      <ErrorBox message={error} />
      {data && data.length === 0 ? <Empty title="Aún no tienes ofertas" text="Crea la primera en un minuto." /> : null}
      {data?.map((o) => {
        const approved = o.offer_reviews.filter((r) => r.approved).length;
        return (
          <OfferCard
            key={o.id}
            offer={o}
            extra={
              <Row>
                <Badge
                  label={approved ? `Aprobada por ${approved} centro${approved > 1 ? 's' : ''}` : 'Pendiente de centros'}
                  tone={approved ? 'ok' : 'warn'}
                />
                <Badge label={`${o.applications.length} candidatura${o.applications.length === 1 ? '' : 's'}`} tone="info" />
              </Row>
            }
          />
        );
      })}
    </Screen>
  );
}
