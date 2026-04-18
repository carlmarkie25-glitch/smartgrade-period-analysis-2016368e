// Scheduled job: 7 days before each subscription renews, snapshot active student
// count and update Paddle quantity. Also enforces the 50-seat floor.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const MIN_SEATS = 50;
const SNAPSHOT_WINDOW_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Find subscriptions renewing within the snapshot window.
    const cutoff = new Date(Date.now() + SNAPSHOT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing'])
      .not('school_id', 'is', null)
      .lte('current_period_end', cutoff)
      .gte('current_period_end', new Date().toISOString());

    if (error) throw error;

    const results: any[] = [];
    for (const sub of subs ?? []) {
      try {
        // Count active students for this school
        const { data: countData, error: countErr } = await supabase
          .rpc('count_active_students', { p_school_id: sub.school_id });
        if (countErr) throw countErr;

        const active = (countData as number) ?? 0;
        const targetQty = Math.max(MIN_SEATS, active);

        // Update Paddle subscription quantity (prorated immediately at renewal billing)
        const paddle = getPaddleClient(sub.environment as PaddleEnv);
        await paddle.subscriptions.update(sub.paddle_subscription_id, {
          items: [{ priceId: sub.price_id, quantity: targetQty }],
          prorationBillingMode: 'prorated_next_billing_period',
        } as any);

        // Update local snapshot (webhook will also fire and confirm)
        await supabase.from('schools').update({
          billable_student_count: targetQty,
          last_billing_snapshot_at: new Date().toISOString(),
        } as any).eq('id', sub.school_id);

        results.push({ school_id: sub.school_id, active, billed: targetQty, ok: true });
      } catch (e) {
        console.error('seat sync failed for sub', sub.id, e);
        results.push({ school_id: sub.school_id, ok: false, error: String((e as Error).message) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), { headers: corsHeaders });
  } catch (e) {
    console.error('sync-subscription-seats error:', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: corsHeaders });
  }
});
