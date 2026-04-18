import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require an authenticated user — this resolves price IDs only for signed-in users.
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

  try {
    const { priceId, environment } = await req.json();
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'priceId required' }), { status: 400, headers: corsHeaders });
    }

    const env = (environment || 'sandbox') as PaddleEnv;
    const response = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`);
    const data = await response.json();

    if (!data.data?.length) {
      return new Response(JSON.stringify({ error: 'Price not found' }), { status: 404, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ paddleId: data.data[0].id }), { headers: corsHeaders });
  } catch (e) {
    console.error('get-paddle-price error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
