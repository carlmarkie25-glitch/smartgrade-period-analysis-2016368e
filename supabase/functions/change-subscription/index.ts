import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    const { newPriceId, environment } = await req.json();
    if (!newPriceId) {
      return new Response(JSON.stringify({ error: 'newPriceId required' }), { status: 400, headers: corsHeaders });
    }
    const env = (environment || 'sandbox') as PaddleEnv;

    // Look up the user's current subscription
    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', env)
      .maybeSingle();
    if (subErr || !sub) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), { status: 404, headers: corsHeaders });
    }

    // Resolve human-readable price -> Paddle internal price id
    const priceLookup = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(newPriceId)}`);
    const priceData = await priceLookup.json();
    const paddlePriceId = priceData?.data?.[0]?.id;
    if (!paddlePriceId) {
      return new Response(JSON.stringify({ error: 'Target price not found' }), { status: 404, headers: corsHeaders });
    }

    const paddle = getPaddleClient(env);
    // Swap the subscription's items immediately, prorated.
    const updated = await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: 'prorated_immediately',
    } as any);

    return new Response(JSON.stringify({ ok: true, status: updated.status }), { headers: corsHeaders });
  } catch (e) {
    console.error('change-subscription error:', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: corsHeaders });
  }
});
