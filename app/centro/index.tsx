import { router } from 'expo-router';

import { OfferCard } from '@/components/OfferCard';
import { Badge, Card, Empty, ErrorBox, H1, H2, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName, fmtDate } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Application, Offer } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

// Bandeja del centro: selecciones por validar y ofertas nuevas por revisar.
export default function Validar() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useQuery(async () => {
    const pending = unwrap(
      await supabase
        .from('applications')
        .select('*, offers(*, companies(name, city)), profiles(full_name, ciclo, curso, city, skills, is_minor)')
        .eq('validation', 'pendiente')
        .order('updated_at', { ascending: true }),
    ) as Application[];
    const offers = unwrap(
      await supabase.from('offers').select('*, companies(name, city), offer_reviews(center_id)').eq('is_open', true),
    ) as (Offer & { offer_reviews: { center_id: string }[] })[];
    const toReview = offers.filter((o) => !o.offer_reviews.some((r) => r.center_id === profile!.center_id));
    return { pending, toReview };
  });

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Validar</H1>
      <ErrorBox message={error} />

      <H2>Selecciones por validar ({data?.pending.length ?? 0})</H2>
      {data && data.pending.length === 0 ? <P muted>Nada pendiente. Buen trabajo.</P> : null}
      {data?.pending.map((a) => (
        <Card key={a.id} onPress={() => router.push({ pathname: '/validar/[id]', params: { id: a.id } })}>
          <H2>{a.profiles?.full_name}</H2>
          <P muted>
            {a.offers?.title} · {a.offers?.companies?.name}
          </P>
          <Row>
            <Badge label="Pendiente de validar" tone="warn" />
            <Badge label={cicloName(a.profiles?.ciclo)} />
            {a.profiles?.is_minor ? <Badge label="Menor" tone="warn" /> : null}
            <Badge label={fmtDate(a.created_at)} />
          </Row>
        </Card>
      ))}

      <H2>Ofertas nuevas por revisar ({data?.toReview.length ?? 0})</H2>
      <P muted>Tus alumnos solo ven las ofertas que apruebas.</P>
      {data && data.toReview.length === 0 ? <Empty title="Todo revisado" /> : null}
      {data?.toReview.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </Screen>
  );
}
