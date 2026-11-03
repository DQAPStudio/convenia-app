import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

/** Impide abrir pantallas de otro rol. La seguridad real está en la base de datos (RLS). */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { loading, session, profile } = useAuth();
  if (loading) return <Loading />;
  if (!session || !profile || profile.role !== role) return <Redirect href="/" />;
  return <>{children}</>;
}
