# Convenia · app móvil

App de iOS y Android para cerrar convenios de prácticas de FP rápido.
Complementa a **qBID**: aquí se busca empresa, se valida y se firma. Las horas y el seguimiento oficial siguen en qBID.

- **Alumno/a**: busca ofertas aprobadas por su centro, se inscribe y firma.
- **Empresa**: publica ofertas gratis, elige candidatos y firma.
- **Centro**: aprueba ofertas, valida selecciones, firma y pasa los convenios a qBID. Es quien paga (por web, con Stripe).

## Tecnología

| Parte | Qué usamos |
| --- | --- |
| App | Expo SDK 58 (React Native) + Expo Router |
| Datos y login | Supabase (Postgres + Auth), región UE |
| Pagos del centro | Stripe Checkout desde la web (no dentro de la app) |
| Publicación | EAS Build + EAS Submit → TestFlight → App Store |

## Estructura

```
app/                 Pantallas (cada archivo es una ruta)
  alumno/            Buscar, Candidaturas, Convenio, Perfil
  empresa/           Ofertas, Candidatos, Convenios, Perfil
  centro/            Validar, Alumnos, Convenios y qBID, Centro
  oferta/ convenio/ validar/   Pantallas de detalle
components/          Piezas de interfaz reutilizables
lib/                 Supabase, sesión, tipos, textos, exportación qBID
supabase/migrations/ Esquema, seguridad por rol (RLS) y funciones del flujo
supabase/functions/  Stripe: crear pago y webhook
scripts/test-db.mjs  Prueba del flujo completo en un Postgres en memoria
```

## Arrancar en local

1. `npm install`
2. Copia `.env.example` a `.env` y pon la URL y la clave *anon* de Supabase.
3. `npx expo start` y abre la app con Expo Go o un simulador.

## Base de datos

1. Crea el proyecto en Supabase en la región **Frankfurt (eu-central-1)**.
2. Ejecuta `supabase/migrations/0001_init.sql` (SQL Editor o `supabase db push`).
3. En **Auth → Email templates → Magic link**, añade el código: `Tu código es {{ .Token }}`.
4. Da de alta cada centro a mano (ver `supabase/seed.sql`). Te da dos códigos:
   - `student_code`: para los alumnos.
   - `staff_code` (tabla `center_secrets`): para tutores y coordinación.

Probar el flujo y la seguridad sin Supabase: `npm run test:db`.

## Reglas del flujo (aplicadas en la base de datos)

1. La empresa publica. **Cada centro aprueba** la oferta antes de que la vean sus alumnos.
2. El alumno se inscribe. La empresa preselecciona, entrevista y selecciona.
3. El centro **valida** con comprobaciones manuales (seguro y alta en la Seguridad Social obligatorias). Si no valida, debe dar un motivo.
4. Se crea el convenio. Firman **en orden**: empresa → centro → alumno (con su tutor legal si es menor).
5. El centro exporta los datos y los registra en **qBID**.
6. Un pago pendiente del centro **nunca** bloquea validar ni firmar.

No se guarda DNI, fotos, vacunas ni certificados. Esa documentación la revisa el centro fuera de la app.

## Publicar

Ver [docs/LANZAMIENTO.md](docs/LANZAMIENTO.md).
