import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AGREEMENT_SELECT } from '@/components/ConveniosList';
import { Badge, Button, Card, Check, ErrorBox, Field, H1, H2, Loading, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { agreementState, cicloName, fmtDate, fmtDateTime, nextSigner } from '@/lib/labels';
import { rpc, supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';
import type { Agreement } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

function SignRow({ who, name, at, active }: { who: string; name: string | null; at: string | null; active: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: space(3), alignItems: 'center', paddingVertical: space(2) }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: at ? colors.ok : active ? colors.accent : colors.silverSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <P style={{ color: at || active ? '#fff' : colors.silver, fontWeight: '700' }}>{at ? '✓' : '·'}</P>
      </View>
      <View style={{ flex: 1 }}>
        <P style={{ fontWeight: '600' }}>{who}</P>
        <P muted style={{ fontSize: 13 }}>{at ? `${name} · ${fmtDateTime(at)}` : active ? 'Le toca firmar' : 'En espera'}</P>
      </View>
    </View>
  );
}

export default function Convenio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [signer, setSigner] = useState('');
  const [agree, setAgree] = useState(false);
  const [qbidRef, setQbidRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: g, reload } = useQuery(async () =>
    unwrap(await supabase.from('agreements').select(AGREEMENT_SELECT).eq('id', id).single()) as Agreement,
  [id]);

  useEffect(() => {
    if (profile) setSigner(profile.full_name);
  }, [profile]);

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      setAgree(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  if (!g) return <Loading />;
  const a = g.applications!;
  const o = a.offers!;
  const st = agreementState(g);
  const next = nextSigner(g);
  const myTurn = !!profile && next === profile.role;
  const minor = !!a.profiles?.is_minor;

  return (
    <Screen>
      <P muted style={{ fontWeight: '600' }}>{g.code}</P>
      <H1>Convenio de prácticas</H1>
      <Badge label={st.label} tone={st.tone} />

      <Card>
        <H2>Datos</H2>
        <P>Alumno/a: {a.profiles?.full_name}</P>
        <P>Ciclo: {cicloName(a.profiles?.ciclo)}</P>
        <P>Empresa: {o.companies?.name}</P>
        <P>Puesto: {o.title}</P>
        <P>
          Modalidad: {o.modality} · {o.hours} h · inicio {fmtDate(o.start_date)}
        </P>
        {o.stipend > 0 ? <P>Ayuda: {o.stipend} €/mes</P> : null}
      </Card>

      <Card>
        <H2>Firmas</H2>
        <SignRow who="Empresa" name={g.company_signer} at={g.company_signed_at} active={next === 'empresa'} />
        <SignRow who="Centro educativo" name={g.center_signer} at={g.center_signed_at} active={next === 'centro'} />
        <SignRow
          who={minor ? 'Alumno/a y tutor legal' : 'Alumno/a'}
          name={g.student_signer}
          at={g.student_signed_at}
          active={next === 'alumno'}
        />
      </Card>

      <ErrorBox message={error} />

      {myTurn && (
        <Card>
          <H2>Firmar</H2>
          <Field
            label={profile?.role === 'alumno' && minor ? 'Nombre del alumno y del tutor legal' : 'Nombre de quien firma'}
            value={signer}
            onChangeText={setSigner}
            placeholder={minor ? 'Lucía Martín · tutora: Rosa Gómez' : undefined}
          />
          <Check label="He leído el convenio y acepto sus condiciones" value={agree} onChange={setAgree} />
          <Button
            title="Firmar convenio"
            loading={busy}
            disabled={!agree || !signer.trim()}
            onPress={() => act(() => rpc('sign_agreement', { p_agreement: g.id, p_signer: signer.trim() }))}
          />
          <P muted style={{ fontSize: 12 }}>Se guarda tu nombre, la fecha y la hora de la firma.</P>
        </Card>
      )}

      {profile?.role === 'centro' && next === null && (
        <Card>
          <H2>qBID</H2>
          {g.qbid_exported_at ? (
            <Row>
              <Badge label={`Registrado · ${g.qbid_ref}`} tone="accent" />
              <Badge label={fmtDateTime(g.qbid_exported_at)} />
            </Row>
          ) : (
            <>
              <P muted>Regístralo en qBID y apunta aquí la referencia.</P>
              <Field label="Referencia de qBID" value={qbidRef} onChangeText={setQbidRef} />
              <Button
                title="Marcar como registrado en qBID"
                loading={busy}
                disabled={!qbidRef.trim()}
                onPress={() => act(() => rpc('mark_qbid_exported', { p_agreement: g.id, p_ref: qbidRef.trim() }))}
              />
            </>
          )}
        </Card>
      )}
    </Screen>
  );
}
