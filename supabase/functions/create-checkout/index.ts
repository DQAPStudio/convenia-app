// Crea una sesión de pago de Stripe para la suscripción anual del centro.
// Se usa desde el panel WEB del centro, nunca desde la app de iOS.
// Secretos: STRIPE_SECRET_KEY, STRIPE_PRICE_BASICO, STRIPE_PRICE_PRO, SITE_URL
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const PRICES: Record<string, string | undefined> = {
  basico: Deno.env.get('STRIPE_PRICE_BASICO'),
  pro: Deno.env.get('STRIPE_PRICE_PRO'),
};
const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: profile } = await supabase.from('profiles').select('role, center_id').single();
    if (profile?.role !== 'centro' || !profile.center_id) return json({ error: 'Solo personal del centro' }, 403);

    const { plan } = await req.json();
    const price = PRICES[plan];
    if (!price) return json({ error: 'Plan no válido' }, 400);

    const site = Deno.env.get('SITE_URL')!;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: profile.center_id,
      subscription_data: { metadata: { center_id: profile.center_id } },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      locale: 'es',
      success_url: `${site}/centro/facturacion?ok=1`,
      cancel_url: `${site}/centro/facturacion`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
