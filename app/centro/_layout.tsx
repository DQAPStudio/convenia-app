import { RoleTabs } from '@/components/RoleTabs';
import { RoleGuard } from '@/components/RoleGuard';

export default function CentroLayout() {
  return (
    <RoleGuard role="centro">
      <RoleTabs
        tabs={[
          { name: 'index', title: 'Validar', icon: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' } },
          { name: 'alumnos', title: 'Alumnos', icon: { ios: 'person.3', android: 'groups', web: 'groups' } },
          { name: 'convenios', title: 'Convenios y qBID', icon: { ios: 'signature', android: 'draw', web: 'draw' } },
          { name: 'perfil', title: 'Centro', icon: { ios: 'building.columns', android: 'school', web: 'school' } },
        ]}
      />
    </RoleGuard>
  );
}
