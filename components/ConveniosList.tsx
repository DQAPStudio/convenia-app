import { router } from 'expo-router';
import { Text } from 'react-native';

import { Badge, Card, Empty, ErrorBox, H1, H2, P, Row, Screen } from '@/components/ui';
import { agreementState, fmtDate, nextSigner } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Agreement, Role } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

export const AGREEMENT_SELECT =
  '*, applications(*, offers(*, companies(name, city)), profiles(full_name, ciclo, curso, city, skills, is_minor))';

export function useAgreements() {
  return useQuery(async () =>
    unwrap(await supabase.from('agreements').select(AGREEMENT_SELECT).order('created_at', { ascending: false })) as Agreement[],
  );
}

export function ConveniosList({ role, header }: { role: Role; header?: React.ReactNode }) {
  const { data, error, loading, reload } = useAgreements();
  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Convenios</H1>
      {header}
      <ErrorBox message={error} />
      {data && data.length === 0 ? (
        <Empty title="Aún no hay convenios" text="Aparecen aquí cuando el centro valida una selección." />
      ) : null}
      {data?.map((g) => {
        const st = agreementState(g);
        const mine = nextSigner(g) === role;
        const a = g.applications;
        return (
          <Card key={g.id} onPress={() => router.push({ pathname: '/convenio/[id]', params: { id: g.id } })}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>{g.code}</Text>
            <H2>{a?.offers?.title}</H2>
            <P muted>
              {a?.profiles?.full_name ?? 'Alumno/a'} · {a?.offers?.companies?.name}
            </P>
            <Row>
              <Badge label={st.label} tone={st.tone} />
              {mine ? <Badge label="Te toca firmar" tone="info" /> : null}
              <Badge label={fmtDate(g.created_at)} tone="silver" />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
