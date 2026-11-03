# Lanzamiento en la App Store

## 1. Cuentas (las abre Daniel)

- [ ] **Apple Developer Program** (99 €/año). Mejor como autónomo o empresa: así el vendedor es "Convenia".
- [ ] **Expo** (expo.dev, gratis). Después: `npx eas-cli@latest login` y `npx eas-cli@latest init`.
- [ ] **Supabase**, proyecto de producción en la UE. Otro proyecto aparte para pruebas.
- [ ] **Stripe** con tus datos fiscales. Crea dos precios anuales (Básico y Pro).
- [ ] **Dominio** (p. ej. convenia.es) con tres páginas: `/privacidad`, `/terminos`, `/soporte`.

## 2. Configurar el proyecto

- [ ] Cambiar el `bundleIdentifier` de `app.json` si no es `es.convenia.app`.
- [ ] Icono 1024×1024 y pantalla de inicio en `assets/images/` (azul oscuro + plata).
- [ ] Secretos de EAS: `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Secretos de las funciones de Supabase: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BASICO`, `STRIPE_PRICE_PRO`, `SITE_URL`.
- [ ] `supabase functions deploy create-checkout` y `supabase functions deploy stripe-webhook --no-verify-jwt`.

## 3. TestFlight con los centros piloto

1. `npx eas-cli@latest build -p ios --profile production`
2. `npx eas-cli@latest submit -p ios`
3. En App Store Connect → TestFlight, invita a los tutores, empresas y alumnos del piloto.
4. Prueba el flujo completo con datos de **prueba** antes de usar datos reales.

## 4. Ficha de la App Store

- **Nombre**: Convenia (ojo: comprobar la marca en la OEPM antes).
- **Categoría**: Educación.
- **Clasificación de edad**: rellenar el cuestionario. Hay menores de edad como usuarios.
- **Privacidad (App Privacy)**: declarar nombre, correo y datos educativos. Vinculados a la identidad. Sin seguimiento ni publicidad.
- **Cuenta de prueba para Apple**: un correo con código fijo o una cuenta demo con datos ficticios. Explicar en las notas para el revisor que el alta necesita un código de centro y darles uno.
- **Borrar cuenta**: ya está en Perfil → "Eliminar mi cuenta" (Apple lo exige).
- **Pagos**: la app no vende nada. El centro contrata por web (servicio B2B). No poner enlaces de compra dentro de la app.

## 5. Antes de la publicación pública

- [ ] Revisión de un abogado: política de privacidad, términos, contrato de encargado del tratamiento con cada centro.
- [ ] Evaluación de impacto (EIPD) por tratar datos de menores.
- [ ] Versión en catalán (obligatoria con centros públicos de Cataluña).
- [ ] Firma electrónica avanzada (Signaturit o similar) si los centros la exigen. Ahora es una firma simple con nombre, fecha y hora.
