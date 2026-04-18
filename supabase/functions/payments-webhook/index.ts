import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// New (per-seat yearly) + legacy (flat monthly) product IDs → tier
const TIER_FROM_PRODUCT: Record<string, 'basic' | 'standard' | 'premium'> = {
  basic_plan: 'basic',
  standard_plan: 'standard',
  premium_plan_v2: 'premium',
  // grandfathered legacy
  starter_plan: 'basic',
  pro_plan: 'standard',
  premium_plan: 'premium',
};

// Keep school.subscription_plan label readable for grandfathered users
const LEGACY_PLAN_FROM_PRODUCT: Record<string, string> = {
  basic_plan: 'basic',
  standard_plan: 'standard',
  premium_plan_v2: 'premium',
  starter_plan: 'starter',
  pro_plan: 'pro',
  premium_plan: 'premium_plan',
};

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
        await handlePaymentFailed(event.data, env);
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
  const quantity = item.quantity ?? 1;

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

  if (schoolId) {
    const tier = TIER_FROM_PRODUCT[productId] ?? 'basic';
    const legacyLabel = LEGACY_PLAN_FROM_PRODUCT[productId] ?? 'basic';
    await supabase.from('schools').update({
      subscription_tier: tier,
      subscription_plan: legacyLabel,
      subscription_status: status === 'trialing' ? 'trialing' : 'active',
      billable_student_count: quantity,
      last_billing_snapshot_at: new Date().toISOString(),
      lockout_state: 'none',
      lockout_started_at: null,
    } as any).eq('id', schoolId);
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
    const quantity = items[0].quantity ?? null;
    const tier = productId ? TIER_FROM_PRODUCT[productId] : null;
    const legacyLabel = productId ? LEGACY_PLAN_FROM_PRODUCT[productId] : null;

    const updates: any = {};
    if (tier) updates.subscription_tier = tier;
    if (legacyLabel) updates.subscription_plan = legacyLabel;
    if (quantity != null) {
      updates.billable_student_count = quantity;
      updates.last_billing_snapshot_at = new Date().toISOString();
    }

    if (status === 'active' || status === 'trialing') {
      updates.subscription_status = status === 'trialing' ? 'trialing' : 'active';
      updates.lockout_state = 'none';
      updates.lockout_started_at = null;
    } else if (status === 'past_due') {
      updates.subscription_status = 'past_due';
      updates.lockout_state = 'past_due';
      updates.lockout_started_at = new Date().toISOString();
    }

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

  if (schoolId && currentBillingPeriod?.endsAt) {
    const endsAt = new Date(currentBillingPeriod.endsAt).getTime();
    if (endsAt <= Date.now()) {
      await supabase.from('schools').update({
        subscription_status: 'canceled',
        lockout_state: 'locked',
        lockout_started_at: new Date().toISOString(),
      } as any).eq('id', schoolId);
    }
  }
}

async function handlePaymentFailed(data: any, _env: PaddleEnv) {
  const { customData } = data;
  const schoolId = customData?.schoolId ?? null;
  if (!schoolId) return;

  await supabase.from('schools').update({
    subscription_status: 'past_due',
    lockout_state: 'past_due',
    lockout_started_at: new Date().toISOString(),
  } as any).eq('id', schoolId);
}
