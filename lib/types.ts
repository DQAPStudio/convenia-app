export type Role = 'alumno' | 'empresa' | 'centro';

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  center_id: string | null;
  company_id: string | null;
  ciclo: string | null;
  curso: string | null;
  city: string | null;
  skills: string[];
  is_minor: boolean;
  guardian_name: string | null;
};

export type Company = { id: string; name: string; cif: string | null; sector: string | null; city: string | null };
export type Center = { id: string; name: string; city: string | null; student_code: string; subscription_status: string };

export type Offer = {
  id: string;
  company_id: string;
  title: string;
  department: string | null;
  city: string | null;
  ciclo: string;
  modality: 'Prácticas' | 'Dual';
  hours: number;
  vacancies: number;
  start_date: string | null;
  stipend: number;
  tasks: string[];
  requirements: string[];
  is_open: boolean;
  created_at: string;
  companies?: Pick<Company, 'name' | 'city'> | null;
};

export type AppStatus = 'enviada' | 'preseleccionada' | 'entrevista' | 'seleccionada' | 'rechazada';
export type Validation = 'na' | 'pendiente' | 'aprobada' | 'rechazada';

export type Application = {
  id: string;
  offer_id: string;
  student_id: string;
  status: AppStatus;
  validation: Validation;
  deny_reason: string | null;
  checks: Record<string, boolean>;
  created_at: string;
  offers?: Offer | null;
  profiles?: Pick<Profile, 'full_name' | 'ciclo' | 'curso' | 'city' | 'skills' | 'is_minor'> | null;
};

export type Agreement = {
  id: string;
  application_id: string;
  code: string;
  company_signer: string | null;
  company_signed_at: string | null;
  center_signer: string | null;
  center_signed_at: string | null;
  student_signer: string | null;
  student_signed_at: string | null;
  qbid_ref: string | null;
  qbid_exported_at: string | null;
  created_at: string;
  applications?: Application | null;
};
