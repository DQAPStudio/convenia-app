import { useState } from 'react';

import { Badge, Button, Card, Empty, ErrorBox, H1, H2, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName, fmtDate, STATUS, VALIDATION } from '@/lib/labels';
import { rpc, supabase } from '@/lib/supabase';
import type { Application, AppStatus } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

const ACTIONS: Partial<Record<AppStatus, { to: AppStatus; title: string }[]>> = {
  enviada: [{ to: 'preseleccionada', title: 'Preseleccionar' }],
  preseleccionada: [{ to: 'entrevista', title: 'Proponer entrevista' }],
  entrevista: [{ to: 'seleccionada', title: 'Seleccionar' }],
};

export default function Candidatos() {
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, reload } = useQuery(async () =>
    unwrap(
      await supabase
        .from('applications')
        .select('*, offers!inner(*), profiles(full_name, ciclo, curso, city, skills, is_minor)')
        .eq('offers.company_id', profile!.company_id!)
        .order('created_at', { ascending: false }),
    ) as Application[],
  );

  async function move(id: string, to: AppStatus) {
    setError(null);
    setBusy(id + to);
    try {
      await rpc('set_application_status', { p_app: id, p_status: to });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Candidatos</H1>
      <ErrorBox message={error} />
      {data && data.length === 0 ? <Empty title="Sin candidaturas" text="Cuando un centro apruebe tu oferta, sus alumnos podrán inscribirse." /> : null}
      {data?.map((a) => (
        <Card key={a.id}>
          <H2>{a.profiles?.full_name}</H2>
          <P muted>
            {cicloName(a.profiles?.ciclo)} · {a.profiles?.curso} · {a.profiles?.city ?? 'Zona sin indicar'}
          </P>
          <P muted>Oferta: {a.offers?.title}</P>
          {a.profiles?.skills?.length ? <P>{a.profiles.skills.join(' · ')}</P> : null}
          <Row>
            <Badge label={STATUS[a.status].label} tone={STATUS[a.status].tone} />
            {a.validation !== 'na' ? <Badge label={VALIDATION[a.validation].label} tone={VALIDATION[a.validation].tone} /> : null}
            {a.profiles?.is_minor ? <Badge label="Menor de edad" tone="warn" /> : null}
            <Badge label={fmtDate(a.created_at)} />
          </Row>
          {a.status !== 'seleccionada' && a.status !== 'rechazada' && (
            <>
              {ACTIONS[a.status]?.map((x) => (
                <Button key={x.to} title={x.title} loading={busy === a.id + x.to} onPress={() => move(a.id, x.to)} />
              ))}
              <Button title="Descartar" variant="danger" loading={busy === a.id + 'rechazada'} onPress={() => move(a.id, 'rechazada')} />
            </>
          )}
        </Card>
      ))}
    </Screen>
  );
}
