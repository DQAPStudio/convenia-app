-- Datos para probar en local o en el proyecto de pruebas. NO usar en producción.
insert into public.centers (id, name, city, student_code)
values ('00000000-0000-0000-0000-0000000000c1', 'Institut Collserola (pruebas)', 'Barcelona', 'COLL26');
insert into public.center_secrets (center_id, staff_code)
values ('00000000-0000-0000-0000-0000000000c1', 'STAFF2026');
