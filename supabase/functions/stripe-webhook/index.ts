// Recibe eventos de Stripe y actualiza el estado de suscripción del centro.
// Desplegar con: supabase functions deploy stripe-webhook --no-verify-jwt
// Secretos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trial',
  past_due: 'past_due',
  unpaid: 'past_due',
  incomplete: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
};

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch {
    return new Response('Firma no válida', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.client_reference_id) {
      await admin
        .from('centers')
        .update({ subscription_status: 'active', stripe_customer_id: s.customer as string })
        .eq('id', s.client_reference_id);
    }
  }

  if (event.type.startsWith('customer.subscription.')) {
    const sub = event.data.object as Stripe.Subscription;
    const centerId = sub.metadata?.center_id;
    if (centerId) {
      await admin.from('centers').update({ subscription_status: MAP[sub.status] ?? 'past_due' }).eq('id', centerId);
    }
  }

  return new Response('ok');
});
