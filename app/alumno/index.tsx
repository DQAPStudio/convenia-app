import { useMemo, useState } from 'react';

import { OfferCard } from '@/components/OfferCard';
import { Check, Empty, ErrorBox, Field, H1, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cicloName } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Offer } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

// Solo aparecen ofertas abiertas que tu centro ya ha aprobado (lo filtra la base de datos).
export default function Buscar() {
  const { profile } = useAuth();
  const [q, setQ] = useState('');
  const [onlyMine, setOnlyMine] = useState(true);
  const { data, error, loading, reload } = useQuery(async () =>
    unwrap(
      await supabase.from('offers').select('*, companies(name, city)').eq('is_open', true).order('created_at', { ascending: false }),
    ) as Offer[],
  );

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (o) =>
        (!onlyMine || o.ciclo === profile?.ciclo) &&
        (!term || `${o.title} ${o.companies?.name} ${o.city ?? ''} ${o.department ?? ''}`.toLowerCase().includes(term)),
    );
  }, [data, q, onlyMine, profile?.ciclo]);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <H1>Buscar prácticas</H1>
      <P muted>Ofertas aprobadas por tu centro.</P>
      <Field label="Buscar" value={q} onChangeText={setQ} placeholder="Empresa, puesto o municipio" />
      <Check label={`Solo mi ciclo (${cicloName(profile?.ciclo)})`} value={onlyMine} onChange={setOnlyMine} />
      <ErrorBox message={error} />
      {data && list.length === 0 ? (
        <Empty title="No hay ofertas" text="Tu centro aún no ha aprobado ofertas para ti. Vuelve en unos días." />
      ) : null}
      {list.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </Screen>
  );
}
