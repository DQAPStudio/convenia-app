import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** Carga datos al entrar en la pantalla y permite recargar (pull to refresh). */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, error, loading, reload: load };
}

/** Lanza el error de Supabase como Error normal. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
