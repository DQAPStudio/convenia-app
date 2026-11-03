import { ProfileScreen } from '@/components/ProfileScreen';
import { Card, H2, P } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Company } from '@/lib/types';
import { unwrap, useQuery } from '@/lib/useQuery';

export default function PerfilEmpresa() {
  const { profile } = useAuth();
  const { data } = useQuery(async () =>
    unwrap(await supabase.from('companies').select('*').eq('id', profile!.company_id!).single()) as Company,
  );
  return (
    <ProfileScreen>
      {data ? (
        <Card>
          <H2>{data.name}</H2>
          <P muted>
            {[data.cif, data.sector, data.city].filter(Boolean).join(' · ')}
          </P>
          <P muted style={{ fontSize: 12 }}>Convenia es gratis para las empresas.</P>
        </Card>
      ) : null}
    </ProfileScreen>
  );
}
