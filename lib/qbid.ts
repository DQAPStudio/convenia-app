import { cicloName } from './labels';
import type { Agreement } from './types';

const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/**
 * CSV con los datos que el centro copia en qBID.
 * qBID no tiene API pública: el centro lo registra a mano o con su importación.
 */
export function buildQbidCsv(list: Agreement[]) {
  const head = ['codigo_convenio', 'alumno', 'ciclo', 'empresa', 'puesto', 'modalidad', 'horas', 'inicio', 'firmado_empresa', 'firmado_centro', 'firmado_alumno'];
  const rows = list.map((g) => {
    const a = g.applications;
    const o = a?.offers;
    return [
      g.code,
      a?.profiles?.full_name,
      cicloName(o?.ciclo),
      o?.companies?.name,
      o?.title,
      o?.modality,
      o?.hours,
      o?.start_date,
      g.company_signed_at,
      g.center_signed_at,
      g.student_signed_at,
    ];
  });
  return [head, ...rows].map((r) => r.map(esc).join(';')).join('\n');
}
