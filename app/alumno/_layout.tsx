import { RoleTabs } from '@/components/RoleTabs';
import { RoleGuard } from '@/components/RoleGuard';

export default function AlumnoLayout() {
  return (
    <RoleGuard role="alumno">
      <RoleTabs
        tabs={[
          { name: 'index', title: 'Buscar', icon: { ios: 'magnifyingglass', android: 'search', web: 'search' } },
          { name: 'candidaturas', title: 'Candidaturas', icon: { ios: 'briefcase', android: 'work', web: 'work' } },
          { name: 'convenios', title: 'Convenio', icon: { ios: 'signature', android: 'draw', web: 'draw' } },
          { name: 'perfil', title: 'Perfil', icon: { ios: 'person.crop.circle', android: 'person', web: 'person' } },
        ]}
      />
    </RoleGuard>
  );
}
