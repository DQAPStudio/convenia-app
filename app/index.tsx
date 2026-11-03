import { Redirect } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';

// Decide a dónde va cada usuario según su sesión y su rol.
export default function Index() {
  const { loading, session, profile } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/onboarding" />;
  return <Redirect href={`/${profile.role}`} />;
}
