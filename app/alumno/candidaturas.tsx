import { router } from 'expo-router';

import { Badge, Card, Empty, ErrorBox, H1, H2, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fmtDate, STATUS, VALIDATION } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Application } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

const NEXT: Record<string, string> = {
  enviada: 'La empresa aún no ha revisado tu candidatura.',
  preseleccionada: 'Estás preseleccionado/a. Atento/a al correo.',
  entrevista: 'La empresa quiere hacerte una entrevista.',
  seleccionada: 'Te han elegido. Falta que tu centro lo valide.',
  rechazada: 'La empresa ha cerrado tu candidatura.',
};

export default function Candidaturas() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useQuery(async () =>
    unwrap(
      await supabase
        .from('applications')
        .select('*, offers(*, companies(name, city))')
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false }),
    ) as Application[],
  );

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Mis candidaturas</H1>
      <ErrorBox message={error} />
      {data && data.length === 0 ? <Empty title="Aún no te has inscrito" text="Busca una oferta y pulsa «Inscribirme»." /> : null}
      {data?.map((a) => {
        const st = STATUS[a.status];
        let next = NEXT[a.status];
        if (a.validation === 'aprobada') next = 'Validada. Revisa la pestaña Convenio para firmar.';
        if (a.validation === 'rechazada') next = `Tu centro no la ha validado: ${a.deny_reason ?? 'sin motivo'}`;
        return (
          <Card key={a.id} onPress={() => router.push({ pathname: '/oferta/[id]', params: { id: a.offer_id } })}>
            <H2>{a.offers?.title}</H2>
            <P muted>{a.offers?.companies?.name}</P>
            <Row>
              <Badge label={st.label} tone={st.tone} />
              {a.validation !== 'na' ? <Badge label={VALIDATION[a.validation].label} tone={VALIDATION[a.validation].tone} /> : null}
              <Badge label={fmtDate(a.created_at)} tone="silver" />
            </Row>
            <P muted>{next}</P>
          </Card>
        );
      })}
    </Screen>
  );
}
