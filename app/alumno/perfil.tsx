import { useState } from 'react';

import { ProfileScreen } from '@/components/ProfileScreen';
import { Button, Card, ErrorBox, Field, H2, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName } from '@/lib/labels';
import { supabase } from '@/lib/supabase';

export default function PerfilAlumno() {
  const { profile, refreshProfile } = useAuth();
  const [city, setCity] = useState(profile?.city ?? '');
  const [skills, setSkills] = useState((profile?.skills ?? []).join(', '));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from('profiles')
      .update({ city: city.trim() || null, skills: skills.split(',').map((s) => s.trim()).filter(Boolean) })
      .eq('id', profile!.id);
    setBusy(false);
    setMsg(error ? error.message : null);
    if (!error) await refreshProfile();
  }

  return (
    <ProfileScreen>
      <Card>
        <H2>Lo que ve la empresa</H2>
        <P muted>
          {cicloName(profile?.ciclo)} · {profile?.curso}
        </P>
        <Field label="Zona donde puedes hacer prácticas" value={city} onChangeText={setCity} placeholder="Barcelona, Sabadell…" />
        <Field label="Habilidades (separadas por comas)" value={skills} onChangeText={setSkills} placeholder="Toma de constantes, Primeros auxilios" />
        <P muted style={{ fontSize: 12 }}>
          No pedimos DNI, foto ni datos de salud. La empresa solo ve esto si te inscribes en su oferta.
        </P>
        <ErrorBox message={msg} />
        <Button title="Guardar" onPress={save} loading={busy} />
      </Card>
    </ProfileScreen>
  );
}
