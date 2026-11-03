import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Badge, Button, Card, Check, ErrorBox, Field, H1, H2, Loading, P, Row } from '@/components/ui';
import { Screen } from '@/components/ui';
import { cicloName, fmtDate } from '@/lib/labels';
import { rpc, supabase } from '@/lib/supabase';
import type { Application } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

// Las comprobaciones son manuales a propósito: el tutor confirma cada una.
const CHECKS = [
  { key: 'seguro', label: 'Seguro escolar y de responsabilidad civil en vigor', required: true },
  { key: 'seguridad_social', label: 'Alta en la Seguridad Social tramitada', required: true },
  { key: 'plan_formativo', label: 'Plan de formación acordado con la empresa', required: false },
  { key: 'requisitos_sanitarios', label: 'Requisitos sanitarios revisados (si aplica)', required: false },
  { key: 'autorizacion_tutor', label: 'Autorización del tutor legal (si es menor)', required: false },
] as const;

export default function ValidarSeleccion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: a } = useQuery(async () =>
    unwrap(
      await supabase
        .from('applications')
        .select('*, offers(*, companies(name, city)), profiles(full_name, ciclo, curso, city, skills, is_minor)')
        .eq('id', id)
        .single(),
    ) as Application,
  [id]);

  async function decide(ok: boolean) {
    setError(null);
    setBusy(true);
    try {
      const agreementId = await rpc<string | null>('validate_application', {
        p_app: id,
        p_ok: ok,
        p_reason: ok ? null : reason.trim(),
        p_checks: checks,
      });
      if (ok && agreementId) router.replace({ pathname: '/convenio/[id]', params: { id: agreementId } });
      else router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  if (!a) return <Loading />;
  const requiredOk = CHECKS.filter((c) => c.required).every((c) => checks[c.key]);
  const minorOk = !a.profiles?.is_minor || checks.autorizacion_tutor;

  return (
    <Screen>
      <H1>{a.profiles?.full_name}</H1>
      <P muted>
        {cicloName(a.profiles?.ciclo)} · {a.profiles?.curso}
      </P>
      <Card>
        <H2>{a.offers?.title}</H2>
        <P muted>{a.offers?.companies?.name}</P>
        <Row>
          <Badge label={a.offers?.modality ?? ''} />
          <Badge label={`${a.offers?.hours} h`} />
          <Badge label={`Inicio ${fmtDate(a.offers?.start_date)}`} />
          {a.profiles?.is_minor ? <Badge label="Menor de edad" tone="warn" /> : null}
        </Row>
      </Card>

      <Card>
        <H2>Comprobaciones</H2>
        {CHECKS.map((c) => (
          <Check
            key={c.key}
            label={c.label + (c.required ? ' *' : '')}
            value={!!checks[c.key]}
            onChange={(v) => setChecks((p) => ({ ...p, [c.key]: v }))}
          />
        ))}
        <P muted style={{ fontSize: 12 }}>* Obligatorio. Al validar se crea el convenio para firmar.</P>
      </Card>

      <ErrorBox message={error} />
      <Button title="Validar y crear convenio" onPress={() => decide(true)} loading={busy} disabled={!requiredOk || !minorOk} />

      <Card>
        <H2>No validar</H2>
        <Field label="Motivo (lo verán la empresa y el alumno)" value={reason} onChangeText={setReason} multiline />
        <Button title="No validar" variant="danger" onPress={() => decide(false)} loading={busy} disabled={!reason.trim()} />
      </Card>
    </Screen>
  );
}
