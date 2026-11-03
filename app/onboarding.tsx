import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Check, ErrorBox, Field, H1, H2, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CICLOS } from '@/lib/labels';
import { rpc } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import type { Role } from '@/lib/types';

const ROLES: { id: Role; title: string; text: string }[] = [
  { id: 'alumno', title: 'Soy alumno/a', text: 'Busco empresa para mis prácticas. Necesito el código de mi centro.' },
  { id: 'empresa', title: 'Soy empresa', text: 'Quiero publicar plazas de prácticas. Es gratis.' },
  { id: 'centro', title: 'Soy del centro', text: 'Tutor/a o coordinación. Necesito el código de personal.' },
];

export default function Onboarding() {
  const { refreshProfile, signOut } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ciclo, setCiclo] = useState('');
  const [curso, setCurso] = useState('2º');
  const [minor, setMinor] = useState(false);
  const [company, setCompany] = useState('');
  const [cif, setCif] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError('Escribe tu nombre completo.');
    setBusy(true);
    try {
      if (role === 'alumno') {
        if (!code.trim() || !ciclo) throw new Error('Falta el código del centro o el ciclo.');
        await rpc('onboard_student', { p_code: code, p_full_name: name.trim(), p_ciclo: ciclo, p_curso: curso, p_is_minor: minor });
      } else if (role === 'empresa') {
        if (!company.trim()) throw new Error('Escribe el nombre de la empresa.');
        await rpc('onboard_company', { p_full_name: name.trim(), p_company: company.trim(), p_cif: cif, p_city: city, p_sector: sector });
      } else if (role === 'centro') {
        if (!code.trim()) throw new Error('Falta el código de personal.');
        await rpc('onboard_center_staff', { p_code: code, p_full_name: name.trim() });
      }
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  if (!role) {
    return (
      <Screen>
        <H1>¿Quién eres?</H1>
        <P muted>Elige tu perfil. Solo se hace una vez.</P>
        {ROLES.map((r) => (
          <Card key={r.id} onPress={() => setRole(r.id)}>
            <H2>{r.title}</H2>
            <P muted>{r.text}</P>
          </Card>
        ))}
        <Button title="Cerrar sesión" variant="secondary" onPress={signOut} />
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{ROLES.find((r) => r.id === role)!.title}</H1>
      <Field label="Nombre y apellidos" value={name} onChangeText={setName} autoComplete="name" />

      {role === 'alumno' && (
        <>
          <Field label="Código del centro" value={code} onChangeText={setCode} autoCapitalize="characters" hint="Te lo da tu tutor/a." />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Ciclo</Text>
          <Row>
            {Object.entries(CICLOS).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => setCiclo(id)}
                style={{
                  paddingHorizontal: space(3),
                  paddingVertical: space(2),
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: ciclo === id ? colors.accent : colors.line,
                  backgroundColor: ciclo === id ? colors.accent : colors.surface,
                }}>
                <Text style={{ color: ciclo === id ? '#fff' : colors.ink, fontSize: 13 }}>{label}</Text>
              </Pressable>
            ))}
          </Row>
          <Field label="Curso" value={curso} onChangeText={setCurso} />
          <Check label="Soy menor de 18 años" value={minor} onChange={setMinor} />
          {minor ? (
            <View style={{ backgroundColor: colors.warnSoft, padding: space(3), borderRadius: radius.md }}>
              <Text style={{ color: colors.warn }}>
                Tu madre, padre o tutor legal tendrá que firmar el convenio contigo. Tu centro ya tiene su autorización.
              </Text>
            </View>
          ) : null}
        </>
      )}

      {role === 'empresa' && (
        <>
          <Field label="Nombre de la empresa" value={company} onChangeText={setCompany} />
          <Field label="CIF" value={cif} onChangeText={setCif} autoCapitalize="characters" />
          <Field label="Municipio" value={city} onChangeText={setCity} />
          <Field label="Sector" value={sector} onChangeText={setSector} placeholder="Sanidad, Informática…" />
        </>
      )}

      {role === 'centro' && (
        <Field label="Código de personal" value={code} onChangeText={setCode} autoCapitalize="characters" hint="Te lo enviamos al dar de alta tu centro." />
      )}

      <ErrorBox message={error} />
      <Button title="Crear mi perfil" onPress={submit} loading={busy} />
      <Button title="Atrás" variant="secondary" onPress={() => setRole(null)} />
    </Screen>
  );
}
