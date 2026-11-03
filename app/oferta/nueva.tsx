import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Button, ErrorBox, Field, H1, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CICLOS } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <Row>
      {options.map(([id, label]) => (
        <Pressable
          key={id}
          onPress={() => onChange(id)}
          style={{
            paddingHorizontal: space(3),
            paddingVertical: space(2),
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: value === id ? colors.accent : colors.line,
            backgroundColor: value === id ? colors.accent : colors.surface,
          }}>
          <Text style={{ color: value === id ? '#fff' : colors.ink, fontSize: 13 }}>{label}</Text>
        </Pressable>
      ))}
    </Row>
  );
}

export default function NuevaOferta() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [ciclo, setCiclo] = useState('tcae');
  const [modality, setModality] = useState<'Prácticas' | 'Dual'>('Prácticas');
  const [hours, setHours] = useState('515');
  const [vacancies, setVacancies] = useState('1');
  const [start, setStart] = useState('');
  const [stipend, setStipend] = useState('0');
  const [tasks, setTasks] = useState('');
  const [reqs, setReqs] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!title.trim()) return setError('Pon un título a la oferta.');
    if (start && !/^\d{4}-\d{2}-\d{2}$/.test(start)) return setError('La fecha debe ser AAAA-MM-DD.');
    setBusy(true);
    const { error } = await supabase.from('offers').insert({
      company_id: profile!.company_id,
      title: title.trim(),
      department: department.trim() || null,
      city: city.trim() || null,
      ciclo,
      modality,
      hours: parseInt(hours, 10) || 515,
      vacancies: parseInt(vacancies, 10) || 1,
      start_date: start || null,
      stipend: parseInt(stipend, 10) || 0,
      tasks: lines(tasks),
      requirements: lines(reqs),
    });
    setBusy(false);
    if (error) return setError(error.message);
    router.back();
  }

  return (
    <Screen>
      <H1>Nueva oferta</H1>
      <P muted>Cada centro la revisa antes de que la vean sus alumnos.</P>
      <Field label="Puesto" value={title} onChangeText={setTitle} placeholder="TCAE en Urgencias" />
      <Field label="Departamento o unidad" value={department} onChangeText={setDepartment} />
      <Field label="Municipio" value={city} onChangeText={setCity} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Ciclo</Text>
      <Chips options={Object.entries(CICLOS) as [string, string][]} value={ciclo} onChange={setCiclo} />
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>Modalidad</Text>
      <Chips options={[['Prácticas', 'Prácticas'], ['Dual', 'Dual']]} value={modality} onChange={setModality} />
      <Field label="Horas" value={hours} onChangeText={setHours} keyboardType="number-pad" hint="La mayoría de ciclos: 515 h." />
      <Field label="Plazas" value={vacancies} onChangeText={setVacancies} keyboardType="number-pad" />
      <Field label="Fecha de inicio (AAAA-MM-DD)" value={start} onChangeText={setStart} placeholder="2027-01-12" />
      <Field label="Ayuda mensual (€)" value={stipend} onChangeText={setStipend} keyboardType="number-pad" hint="0 si no hay." />
      <Field label="Tareas (una por línea)" value={tasks} onChangeText={setTasks} multiline style={{ minHeight: 90 }} />
      <Field label="Requisitos (uno por línea)" value={reqs} onChangeText={setReqs} multiline style={{ minHeight: 70 }} />
      <ErrorBox message={error} />
      <Button title="Publicar" onPress={save} loading={busy} />
    </Screen>
  );
}
