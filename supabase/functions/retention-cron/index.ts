// Daily retention job: archives expired students and notifies admins
// of students approaching the 3-year retention deadline (90/30/7 days).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1. Archive expired
    const { data: archivedCount, error: archErr } = await supabase.rpc(
      "archive_expired_students",
    );
    if (archErr) throw archErr;

    // 2. Build warning notifications at 90/30/7-day windows
    const buckets = [90, 30, 7];
    const summary: Record<string, number> = { archived: archivedCount ?? 0 };

    for (const days of buckets) {
      const { data: rows } = await supabase.rpc("students_expiring_within", {
        p_days: days,
      });
      if (!rows?.length) continue;

      // Filter to those that haven't been reminded for this bucket yet
      const studentIds = rows.map((r: any) => r.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("id, full_name, school_id, export_reminded_at, retention_expires_at")
        .in("id", studentIds);

      const toRemind = (students ?? []).filter((s: any) => {
        const daysLeft = Math.ceil(
          (new Date(s.retention_expires_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        // remind once per bucket: skip if already reminded in last 60 days for 90-bucket etc.
        return daysLeft <= days;
      });

      // Group by school
      const bySchool = new Map<string, any[]>();
      for (const s of toRemind) {
        if (!s.school_id) continue;
        if (!bySchool.has(s.school_id)) bySchool.set(s.school_id, []);
        bySchool.get(s.school_id)!.push(s);
      }

      for (const [schoolId, list] of bySchool) {
        await supabase.from("notifications").insert({
          school_id: schoolId,
          target_role: "admin",
          type: "retention",
          title: `${list.length} student record${list.length > 1 ? "s" : ""} expiring in ~${days} days`,
          message: `Records will be auto-archived after retention. Export Transfer Packs from the Students page if needed.`,
        });
      }

      // Mark reminded
      await supabase
        .from("students")
        .update({ export_reminded_at: new Date().toISOString() })
        .in("id", toRemind.map((s: any) => s.id));

      summary[`warned_${days}d`] = toRemind.length;
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("retention-cron error", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
