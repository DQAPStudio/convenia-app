import { RoleTabs } from '@/components/RoleTabs';
import { RoleGuard } from '@/components/RoleGuard';

export default function EmpresaLayout() {
  return (
    <RoleGuard role="empresa">
      <RoleTabs
        tabs={[
          { name: 'index', title: 'Ofertas', icon: { ios: 'briefcase', android: 'work', web: 'work' } },
          { name: 'candidatos', title: 'Candidatos', icon: { ios: 'person.2', android: 'group', web: 'group' } },
          { name: 'convenios', title: 'Convenios', icon: { ios: 'signature', android: 'draw', web: 'draw' } },
          { name: 'perfil', title: 'Perfil', icon: { ios: 'building.2', android: 'business', web: 'business' } },
        ]}
      />
    </RoleGuard>
  );
}
