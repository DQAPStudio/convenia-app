import { Badge, Card, Empty, ErrorBox, H1, H2, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Center, Profile } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

type Student = Profile & { applications: { status: string; validation: string }[] };

function summary(s: Student): { label: string; tone: 'ok' | 'warn' | 'info' | 'silver' } {
  if (s.applications.some((a) => a.validation === 'aprobada')) return { label: 'Con empresa', tone: 'ok' };
  if (s.applications.some((a) => a.validation === 'pendiente')) return { label: 'Por validar', tone: 'warn' };
  if (s.applications.length) return { label: `${s.applications.length} candidatura(s)`, tone: 'info' };
  return { label: 'Sin candidaturas', tone: 'silver' };
}

export default function Alumnos() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useQuery(async () => {
    const center = unwrap(await supabase.from('centers').select('*').eq('id', profile!.center_id!).single()) as Center;
    const students = unwrap(
      await supabase
        .from('profiles')
        .select('*, applications(status, validation)')
        .eq('role', 'alumno')
        .eq('center_id', profile!.center_id!)
        .order('full_name'),
    ) as Student[];
    return { center, students };
  });

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Alumnos</H1>
      {data ? (
        <Card>
          <H2>Código para tus alumnos: {data.center.student_code}</H2>
          <P muted>Compártelo en clase. Con él se dan de alta en tu centro.</P>
        </Card>
      ) : null}
      <ErrorBox message={error} />
      {data && data.students.length === 0 ? <Empty title="Aún no hay alumnos" text="Comparte el código de arriba." /> : null}
      {data?.students.map((s) => {
        const st = summary(s);
        return (
          <Card key={s.id}>
            <H2>{s.full_name}</H2>
            <P muted>
              {cicloName(s.ciclo)} · {s.curso}
            </P>
            <Row>
              <Badge label={st.label} tone={st.tone} />
              {s.is_minor ? <Badge label="Menor" tone="warn" /> : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
