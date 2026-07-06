import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

let _supabase: any = null;
function getSupabase(): any {
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
  if (!userId) {
    // No userId in metadata means this subscription was created outside our
    // checkout flow (e.g. Stripe dashboard). We can't associate it with a
    // user, so log loudly and skip — dashboard-created subs need to be
    // reconciled manually.
    console.error('[stripe webhook] subscription missing metadata.userId', {
      subscription_id: sub.id,
      customer: sub.customer,
      env,
    });
    return;
  }
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

  // Seed Mirror onboarding flag on first trial/active subscription.
  // ON CONFLICT DO NOTHING preserves the original onboarded_at across cancel/resubscribe.
  if (sub.status === 'trialing' || sub.status === 'active') {
    const { error } = await getSupabase()
      .from('mirror_onboarding')
      .upsert(
        { user_id: userId, source: 'subscription' },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );
    if (error) console.error('mirror_onboarding upsert failed:', error);
  }
}


async function handleUpdated(sub: any, env: StripeEnv) {
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;
  const userId = sub.metadata?.userId;

  // Stripe does NOT guarantee `.created` arrives before `.updated`. If we
  // only UPDATE, an out-of-order `.updated` matches zero rows and is lost,
  // leaving the paying user without an entitlement row. Upsert on
  // stripe_subscription_id so this event self-heals either way. If userId
  // is missing on the update event (metadata not always echoed), fall
  // back to a plain UPDATE so we don't null out user_id on an existing row.
  if (userId) {
    const { error } = await getSupabase().from('subscriptions').upsert({
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
    if (error) console.error('[stripe webhook] subscriptions upsert failed on updated:', error, { subscription_id: sub.id, env });
    return;
  }

  const { error, count } = await getSupabase().from('subscriptions').update({
    status: sub.status,
    price_id: priceIdFrom(item),
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }, { count: 'exact' }).eq('stripe_subscription_id', sub.id).eq('environment', env);
  if (error) console.error('[stripe webhook] subscriptions update failed on updated:', error, { subscription_id: sub.id, env });
  else if (!count) console.error(`[stripe webhook] no subscription row for ${sub.id} — event out of order?`, { env });
}

async function handleDeleted(sub: any, env: StripeEnv) {
  const { error, count } = await getSupabase().from('subscriptions').update({
    status: 'canceled',
    updated_at: new Date().toISOString(),
  }, { count: 'exact' }).eq('stripe_subscription_id', sub.id).eq('environment', env);
  if (error) console.error('[stripe webhook] subscriptions update failed on deleted:', error, { subscription_id: sub.id, env });
  else if (!count) console.error(`[stripe webhook] no subscription row for ${sub.id} — event out of order?`, { env });
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  // Dunning: reflect payment failure promptly so the UI can warn the user
  // instead of waiting for the downstream customer.subscription.updated event.
  const subId = invoice.subscription;
  if (!subId) return;
  const { error, count } = await getSupabase().from('subscriptions').update({
    status: 'past_due',
    updated_at: new Date().toISOString(),
  }, { count: 'exact' }).eq('stripe_subscription_id', subId).eq('environment', env);
  if (error) console.error('[stripe webhook] subscriptions update failed on invoice.payment_failed:', error, { subscription_id: subId, env });
  else if (!count) console.error(`[stripe webhook] no subscription row for ${subId} — event out of order?`, { env });
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
            case 'invoice.payment_failed':
              await handleInvoicePaymentFailed(event.data.object, env); break;
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
