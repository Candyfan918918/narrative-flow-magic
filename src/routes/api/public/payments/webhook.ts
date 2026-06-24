import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

function priceIdFrom(item: any): string {
  return item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
}
function productIdFrom(item: any): string {
  const p = item?.price?.product;
  return typeof p === 'string' ? p : p?.metadata?.lovable_external_id || p?.id || '';
}

async function handleCreated(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) { console.error('No userId in metadata'); return; }
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer,
    product_id: productIdFrom(item) === 'mirror' ? 'mirror' : (item?.price?.product?.metadata?.lovable_external_id || 'mirror'),
    price_id: priceIdFrom(item),
    status: sub.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
}

async function handleUpdated(sub: any, env: StripeEnv) {
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  await getSupabase().from('subscriptions').update({
    status: sub.status,
    price_id: priceIdFrom(item),
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', sub.id).eq('environment', env);
}

async function handleDeleted(sub: any, env: StripeEnv) {
  await getSupabase().from('subscriptions').update({
    status: 'canceled',
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', sub.id).eq('environment', env);
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case 'customer.subscription.created':
              await handleCreated(event.data.object, env); break;
            case 'customer.subscription.updated':
              await handleUpdated(event.data.object, env); break;
            case 'customer.subscription.deleted':
              await handleDeleted(event.data.object, env); break;
            default:
              console.log('Unhandled:', event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
