import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, ErrorBox, Field, H1, P, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';

const extra = Constants.expoConfig?.extra ?? {};

// Acceso sin contraseña: enviamos un código de 6 cifras al correo.
export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Escribe un correo válido.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) return setError('Código incorrecto o caducado.');
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top']}>
        <View style={{ backgroundColor: colors.navy, borderRadius: 24, padding: space(6), gap: space(2), marginTop: space(6) }}>
          <Text style={{ color: '#C9D1E0', fontSize: 13, fontWeight: '600', letterSpacing: 1.5 }}>CONVENIA</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
            Prácticas de FP, sin papeleo.
          </Text>
          <Text style={{ color: '#AEB7C9', fontSize: 15, lineHeight: 21 }}>
            Busca empresa, valida y cierra el convenio. El seguimiento sigue en qBID.
          </Text>
        </View>

        <H1>{sent ? 'Revisa tu correo' : 'Entrar'}</H1>
        <P muted>
          {sent ? `Hemos enviado un código de 6 cifras a ${email}.` : 'Sin contraseñas. Te enviamos un código al correo.'}
        </P>

        {!sent ? (
          <>
            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="nombre@centro.cat"
            />
            <Button title="Enviar código" onPress={sendCode} loading={busy} />
          </>
        ) : (
          <>
            <Field
              label="Código"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
            <Button title="Entrar" onPress={verify} loading={busy} disabled={code.trim().length !== 6} />
            <Button title="Cambiar de correo" variant="secondary" onPress={() => { setSent(false); setCode(''); }} />
          </>
        )}

        <ErrorBox message={error} />

        <P muted style={{ fontSize: 12, textAlign: 'center', marginTop: space(4) }}>
          Al entrar aceptas los{' '}
          <Text style={{ color: colors.accent, fontWeight: '600' }} onPress={() => WebBrowser.openBrowserAsync(extra.termsUrl)}>
            términos
          </Text>{' '}
          y la{' '}
          <Text style={{ color: colors.accent, fontWeight: '600' }} onPress={() => WebBrowser.openBrowserAsync(extra.privacyUrl)}>
            política de privacidad
          </Text>
          .
        </P>
      </Screen>
    </KeyboardAvoidingView>
  );
}
