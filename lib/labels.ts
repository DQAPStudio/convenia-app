import type { Agreement, AppStatus, Validation } from './types';

// Ciclos del piloto (familia Sanidad + algunos de Informática). Ampliable.
export const CICLOS: Record<string, string> = {
  tcae: 'Cuidados Auxiliares de Enfermería',
  lcb: 'Laboratorio Clínico y Biomédico',
  imd: 'Imagen para el Diagnóstico',
  hbd: 'Higiene Bucodental',
  far: 'Farmacia y Parafarmacia',
  dam: 'Desarrollo de Aplicaciones Multiplataforma',
  daw: 'Desarrollo de Aplicaciones Web',
  smr: 'Sistemas Microinformáticos y Redes',
};
export const cicloName = (c?: string | null) => (c && CICLOS[c]) || c || '—';

export type Tone = 'info' | 'warn' | 'ok' | 'bad' | 'accent' | 'silver';

export const STATUS: Record<AppStatus, { label: string; tone: Tone }> = {
  enviada: { label: 'Enviada', tone: 'info' },
  preseleccionada: { label: 'Preseleccionada', tone: 'warn' },
  entrevista: { label: 'Entrevista', tone: 'silver' },
  seleccionada: { label: 'Seleccionada', tone: 'ok' },
  rechazada: { label: 'Rechazada', tone: 'bad' },
};

export const VALIDATION: Record<Validation, { label: string; tone: Tone }> = {
  na: { label: '—', tone: 'silver' },
  pendiente: { label: 'Pendiente del centro', tone: 'warn' },
  aprobada: { label: 'Validada', tone: 'ok' },
  rechazada: { label: 'No validada', tone: 'bad' },
};

export function signedCount(g: Agreement) {
  return [g.company_signed_at, g.center_signed_at, g.student_signed_at].filter(Boolean).length;
}

/** A quién le toca firmar ahora. */
export function nextSigner(g: Agreement): 'empresa' | 'centro' | 'alumno' | null {
  if (!g.company_signed_at) return 'empresa';
  if (!g.center_signed_at) return 'centro';
  if (!g.student_signed_at) return 'alumno';
  return null;
}

export function agreementState(g: Agreement): { label: string; tone: Tone } {
  if (g.qbid_exported_at) return { label: 'En qBID', tone: 'accent' };
  const n = signedCount(g);
  if (n === 3) return { label: 'Firmado · pasar a qBID', tone: 'ok' };
  return { label: `En firma · ${n}/3`, tone: 'warn' };
}

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
