// Prueba el flujo completo y la seguridad (RLS) de la base de datos con un Postgres en memoria.
// Uso: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const db = new PGlite();
const q = (s) => db.exec(s);
await q(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
grant usage on schema public, auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
`);
await q(fs.readFileSync('./supabase/migrations/0001_init.sql','utf8'));
await q(`grant select, insert, delete on all tables in schema public to authenticated; grant update on public.offers, public.companies to authenticated;`);
await q(fs.readFileSync('./supabase/seed.sql','utf8'));
const U = { alu:'00000000-0000-0000-0000-00000000000a', emp:'00000000-0000-0000-0000-00000000000e', cen:'00000000-0000-0000-0000-00000000000c', alu2:'00000000-0000-0000-0000-00000000000b' };
await q(`insert into auth.users values ('${U.alu}','a@x'),('${U.emp}','e@x'),('${U.cen}','c@x'),('${U.alu2}','b@x')`);
async function as(uid, sql) {
  await q(`reset role; select set_config('test.uid','${uid}',false); set role authenticated;`);
  try { const r = await db.query(sql); return r.rows; } catch (e) { return 'ERR: ' + e.message; } finally { await q('reset role'); }
}
const log = (label, v) => console.log(label.padEnd(36), JSON.stringify(v));
log('onboard alumno', await as(U.alu, `select onboard_student('coll26','Lucía','tcae','2º',true)`));
log('onboard alumno bad code', await as(U.alu2, `select onboard_student('XXXX','B','tcae','2º',false)`));
log('onboard empresa', await as(U.emp, `select onboard_company('Marta','Hospital Serra Nord','b123','Barcelona','Sanidad')`));
log('onboard centro', await as(U.cen, `select onboard_center_staff('staff2026','Ana Ruiz')`));
log('alumno cambia rol (debe fallar)', await as(U.alu, `update profiles set role='centro' where id=auth.uid()`));
log('alumno lee secrets', await as(U.alu, `select * from center_secrets`));
const comp = (await as(U.emp, `select company_id from profiles where id=auth.uid()`))[0].company_id;
log('empresa crea oferta', await as(U.emp, `insert into offers (company_id,title,ciclo) values ('${comp}','TCAE Urgencias','tcae') returning id`));
const off = (await as(U.emp, `select id from offers`))[0].id;
log('alumno ve ofertas (0)', await as(U.alu, `select count(*) from offers`));
log('alumno se inscribe sin aprobar', await as(U.alu, `select apply_to_offer('${off}')`));
log('centro rechaza sin motivo', await as(U.cen, `select review_offer('${off}', false)`));
log('centro aprueba', await as(U.cen, `select review_offer('${off}', true)`));
log('alumno ve ofertas (1)', await as(U.alu, `select count(*) from offers`));
log('alumno se inscribe', await as(U.alu, `select apply_to_offer('${off}') is not null as ok`));
const app = (await as(U.alu, `select id from applications`))[0].id;
log('empresa ve candidato', await as(U.emp, `select full_name from profiles where role='alumno'`));
log('alumno cambia estado (falla)', await as(U.alu, `select set_application_status('${app}','seleccionada')`));
log('empresa selecciona', await as(U.emp, `select set_application_status('${app}','seleccionada')`));
log('valid. pendiente', await as(U.cen, `select validation from applications`));
log('centro valida sin checks', await as(U.cen, `select validate_application('${app}', true, null, '{}'::jsonb)`));
log('centro valida', await as(U.cen, `select validate_application('${app}', true, null, '{"seguro":true,"seguridad_social":true}'::jsonb) is not null as ok`));
const ag = (await as(U.cen, `select id from agreements`))[0].id;
log('alumno firma primero (falla)', await as(U.alu, `select sign_agreement('${ag}','Lucía')`));
log('empresa firma', await as(U.emp, `select sign_agreement('${ag}','Marta')`));
log('centro firma', await as(U.cen, `select sign_agreement('${ag}','Ana')`));
log('qbid antes de alumno (falla)', await as(U.cen, `select mark_qbid_exported('${ag}','Q1')`));
log('alumno firma', await as(U.alu, `select sign_agreement('${ag}','Lucía + tutora')`));
log('qbid', await as(U.cen, `select mark_qbid_exported('${ag}','qBID 1234')`));
log('empresa ve convenio', await as(U.emp, `select code, qbid_ref from agreements`));
log('extraño ve convenio (0)', await as(U.alu2, `select count(*) from agreements`));
log('centro ve alumnos', await as(U.cen, `select full_name from profiles where role='alumno'`));
log('alumno borra cuenta', await as(U.alu, `select delete_my_account()`));
log('apps tras borrar', await as(U.cen, `select count(*) from applications`));
