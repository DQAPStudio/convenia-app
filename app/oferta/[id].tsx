import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Badge, Button, Card, ErrorBox, Field, H1, H2, Loading, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName, fmtDate, STATUS } from '@/lib/labels';
import { rpc, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Application, Offer } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

type Review = { approved: boolean; reason: string | null };

export default function OfertaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const { data, reload } = useQuery(async () => {
    const offer = unwrap(await supabase.from('offers').select('*, companies(name, city, sector)').eq('id', id).single()) as Offer;
    let mine: Application | null = null;
    let review: Review | null = null;
    if (profile?.role === 'alumno') {
      mine = unwrap(
        await supabase.from('applications').select('*').eq('offer_id', id).eq('student_id', profile.id).maybeSingle(),
      ) as Application | null;
    }
    if (profile?.role === 'centro') {
      review = unwrap(
        await supabase.from('offer_reviews').select('approved, reason').eq('offer_id', id).eq('center_id', profile.center_id!).maybeSingle(),
      ) as Review | null;
    }
    return { offer, mine, review };
  }, [id]);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Loading />;
  const { offer, mine, review } = data;
  const isOwner = profile?.role === 'empresa' && profile.company_id === offer.company_id;

  return (
    <Screen>
      <Stack.Screen options={{ title: offer.companies?.name ?? 'Oferta' }} />
      <Text style={{ color: colors.muted, fontWeight: '600' }}>{offer.companies?.name}</Text>
      <H1>{offer.title}</H1>
      <P muted>
        {[offer.department, offer.city || offer.companies?.city].filter(Boolean).join(' · ')}
      </P>
      <Row>
        <Badge label={offer.modality} tone={offer.modality === 'Dual' ? 'accent' : 'silver'} />
        <Badge label={`${offer.hours} h`} />
        <Badge label={`${offer.vacancies} plaza${offer.vacancies > 1 ? 's' : ''}`} />
        {offer.stipend > 0 ? <Badge label={`${offer.stipend} €/mes`} tone="info" /> : <Badge label="Sin remuneración" />}
      </Row>

      <Card>
        <H2>Ciclo</H2>
        <P>{cicloName(offer.ciclo)}</P>
        <H2>Inicio</H2>
        <P>{fmtDate(offer.start_date)}</P>
      </Card>

      {offer.tasks.length > 0 && (
        <Card>
          <H2>Qué harás</H2>
          {offer.tasks.map((t) => (
            <P key={t}>• {t}</P>
          ))}
        </Card>
      )}
      {offer.requirements.length > 0 && (
        <Card>
          <H2>Requisitos</H2>
          {offer.requirements.map((t) => (
            <P key={t}>• {t}</P>
          ))}
          <P muted style={{ fontSize: 12 }}>
            La documentación (vacunas, certificados) la revisa tu centro fuera de la app. Aquí no se sube.
          </P>
        </Card>
      )}

      <ErrorBox message={error} />

      {profile?.role === 'alumno' &&
        (mine ? (
          <Card>
            <H2>Ya estás inscrito/a</H2>
            <Badge label={STATUS[mine.status].label} tone={STATUS[mine.status].tone} />
          </Card>
        ) : (
          <Button title="Inscribirme" loading={busy} onPress={() => act(() => rpc('apply_to_offer', { p_offer: offer.id }))} />
        ))}

      {isOwner && (
        <Button
          title={offer.is_open ? 'Cerrar oferta' : 'Reabrir oferta'}
          variant="secondary"
          loading={busy}
          onPress={() => act(async () => unwrap(await supabase.from('offers').update({ is_open: !offer.is_open }).eq('id', offer.id)))}
        />
      )}

      {profile?.role === 'centro' && (
        <Card>
          <H2>Revisión del centro</H2>
          {review ? (
            <Badge label={review.approved ? 'Aprobada para tus alumnos' : `Rechazada: ${review.reason}`} tone={review.approved ? 'ok' : 'bad'} />
          ) : (
            <P muted>Tus alumnos no la verán hasta que la apruebes.</P>
          )}
          <Button
            title="Aprobar oferta"
            loading={busy}
            onPress={() => act(() => rpc('review_offer', { p_offer: offer.id, p_approved: true }))}
          />
          <Field label="Motivo si la rechazas" value={reason} onChangeText={setReason} placeholder="Tareas no ajustadas al ciclo…" />
          <Button
            title="Rechazar"
            variant="danger"
            loading={busy}
            disabled={!reason.trim()}
            onPress={() => act(() => rpc('review_offer', { p_offer: offer.id, p_approved: false, p_reason: reason.trim() }))}
          />
        </Card>
      )}
    </Screen>
  );
}
