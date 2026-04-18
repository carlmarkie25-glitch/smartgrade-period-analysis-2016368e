import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  const schoolId = customData?.schoolId ?? null;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product.importMeta?.externalId || item.product.id;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    school_id: schoolId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,environment' });

  // Mirror plan/status onto the school for feature gating
  if (schoolId) {
    const planMap: Record<string, string> = {
      starter_plan: 'starter',
      pro_plan: 'pro',
      premium_plan: 'premium',
    };
    await supabase.from('schools').update({
      subscription_plan: planMap[productId] || 'starter',
      subscription_status: status === 'trialing' ? 'trialing' : 'active',
    }).eq('id', schoolId);
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customData } = data;
  const schoolId = customData?.schoolId ?? null;

  await supabase.from('subscriptions')
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  if (schoolId && items?.[0]) {
    const productId = items[0].product?.importMeta?.externalId || items[0].product?.id;
    const planMap: Record<string, string> = {
      starter_plan: 'starter',
      pro_plan: 'pro',
      premium_plan: 'premium',
    };
    const updates: any = {};
    if (productId && planMap[productId]) updates.subscription_plan = planMap[productId];
    if (status === 'active' || status === 'trialing') updates.subscription_status = status === 'trialing' ? 'trialing' : 'active';
    if (status === 'past_due') updates.subscription_status = 'past_due';
    if (Object.keys(updates).length) {
      await supabase.from('schools').update(updates).eq('id', schoolId);
    }
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, currentBillingPeriod, customData } = data;
  const schoolId = customData?.schoolId ?? null;

  await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      current_period_end: currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // Access until period end — only flip school to canceled when the period actually ends.
  // Webhook keeps current_period_end fresh so a scheduled job (or query-time check) can downgrade later.
  if (schoolId && currentBillingPeriod?.endsAt) {
    const endsAt = new Date(currentBillingPeriod.endsAt).getTime();
    if (endsAt <= Date.now()) {
      await supabase.from('schools').update({ subscription_status: 'canceled' }).eq('id', schoolId);
    }
  }
}
