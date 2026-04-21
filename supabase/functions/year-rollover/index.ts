import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RolloverBody {
  from_year_id: string;
  to_year_id: string;
  pass_mark?: number; // default 60
  dry_run?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Caller (for permission check)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // Service client for everything else (bypasses RLS)
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();
    if (!roleRow) return json({ error: "Only admins can run rollover" }, 403);

    const body: RolloverBody = await req.json();
    const { from_year_id, to_year_id, pass_mark = 60, dry_run = false } = body;
    if (!from_year_id || !to_year_id) return json({ error: "from_year_id and to_year_id are required" }, 400);
    if (from_year_id === to_year_id) return json({ error: "from and to year must differ" }, 400);

    // Resolve school
    const { data: fromYear } = await admin.from("academic_years").select("id, school_id, year_name").eq("id", from_year_id).maybeSingle();
    const { data: toYear } = await admin.from("academic_years").select("id, school_id, year_name").eq("id", to_year_id).maybeSingle();
    if (!fromYear || !toYear) return json({ error: "Year not found" }, 404);
    if (fromYear.school_id !== toYear.school_id) return json({ error: "Years belong to different schools" }, 400);
    const schoolId = fromYear.school_id;

    // 1. Load classes from old year (sorted by department + display_order)
    const { data: oldClasses, error: oldClsErr } = await admin
      .from("classes")
      .select("id, name, department_id, display_order, grading_mode, teacher_id")
      .eq("academic_year_id", from_year_id)
      .order("department_id", { ascending: true })
      .order("display_order", { ascending: true });
    if (oldClsErr) throw oldClsErr;

    // 2. Load existing classes in new year (so we don't duplicate)
    const { data: existingNewClasses } = await admin
      .from("classes")
      .select("id, name, department_id, display_order")
      .eq("academic_year_id", to_year_id);

    const newClassByKey = new Map<string, { id: string; display_order: number }>();
    (existingNewClasses ?? []).forEach((c) => {
      newClassByKey.set(`${c.department_id}::${c.name}`, { id: c.id, display_order: c.display_order });
    });

    // 3. Clone missing classes into new year
    const classesToCreate = (oldClasses ?? [])
      .filter((c) => !newClassByKey.has(`${c.department_id}::${c.name}`))
      .map((c) => ({
        name: c.name,
        department_id: c.department_id,
        academic_year_id: to_year_id,
        display_order: c.display_order,
        grading_mode: c.grading_mode,
        teacher_id: c.teacher_id,
        school_id: schoolId,
      }));

    let createdClasses: any[] = [];
    if (!dry_run && classesToCreate.length > 0) {
      const { data: inserted, error: insErr } = await admin.from("classes").insert(classesToCreate).select("id, name, department_id, display_order");
      if (insErr) throw insErr;
      createdClasses = inserted ?? [];
      createdClasses.forEach((c) => {
        newClassByKey.set(`${c.department_id}::${c.name}`, { id: c.id, display_order: c.display_order });
      });
    } else if (dry_run) {
      // simulate
      classesToCreate.forEach((c) => {
        newClassByKey.set(`${c.department_id}::${c.name}`, { id: `new-${c.name}`, display_order: c.display_order });
      });
    }

    // 4. Build promotion map (old class_id -> next class id within same department by display_order)
    const oldByDept = new Map<string, typeof oldClasses>();
    (oldClasses ?? []).forEach((c) => {
      const arr = oldByDept.get(c.department_id) ?? [];
      arr.push(c);
      oldByDept.set(c.department_id, arr);
    });

    // For each old class, the "next" is the old class with display_order > current (smallest such), then we look up that name in new year.
    // If no next exists in same department -> graduation candidate.
    const promotionMap = new Map<string, { nextNewClassId: string | null; nextName: string | null }>();
    for (const [deptId, list] of oldByDept) {
      const sorted = [...list].sort((a, b) => a.display_order - b.display_order);
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i];
        const next = sorted[i + 1];
        if (next) {
          const key = `${deptId}::${next.name}`;
          const newCls = newClassByKey.get(key);
          promotionMap.set(cur.id, { nextNewClassId: newCls?.id ?? null, nextName: next.name });
        } else {
          promotionMap.set(cur.id, { nextNewClassId: null, nextName: null });
        }
      }
    }

    // 5. Load active students whose class is in old year
    const oldClassIds = (oldClasses ?? []).map((c) => c.id);
    if (oldClassIds.length === 0) {
      return json({ ok: true, message: "No classes in source year", summary: emptySummary() });
    }

    const { data: students, error: studentsErr } = await admin
      .from("students")
      .select("id, full_name, class_id, department_id, status")
      .eq("status", "active")
      .in("class_id", oldClassIds);
    if (studentsErr) throw studentsErr;

    // 6. Compute average per student (across all class_subjects in their class, all 8 periods)
    const studentIds = (students ?? []).map((s) => s.id);
    const summary = {
      promoted: [] as any[],
      graduated: [] as any[],
      retained: [] as any[],
      no_grades: [] as any[],
    };

    if (studentIds.length === 0) {
      return json({ ok: true, summary, classes_created: createdClasses.length, dry_run });
    }

    // Pull period totals + max possible per class_subject
    const { data: periodTotals } = await admin
      .from("student_period_totals")
      .select("student_id, class_subject_id, total_score, period")
      .in("student_id", studentIds);

    // Get max possible per class_subject = sum of assessment_types max_points (school-wide or matching dept)
    const { data: assessmentTypes } = await admin
      .from("assessment_types")
      .select("max_points, department_id")
      .eq("school_id", schoolId);

    // Total max per period per dept
    const maxPerPeriodByDept = new Map<string, number>();
    const fallbackMax = (assessmentTypes ?? []).filter((a) => !a.department_id).reduce((s, a) => s + (a.max_points || 0), 0);
    const deptIds = Array.from(new Set((students ?? []).map((s) => s.department_id)));
    deptIds.forEach((d) => {
      const sum = (assessmentTypes ?? []).filter((a) => a.department_id === d).reduce((s, a) => s + (a.max_points || 0), 0);
      maxPerPeriodByDept.set(d, sum > 0 ? sum : fallbackMax);
    });

    // class_subjects count per class
    const { data: classSubjects } = await admin
      .from("class_subjects")
      .select("id, class_id")
      .in("class_id", oldClassIds);
    const subjectsPerClass = new Map<string, number>();
    (classSubjects ?? []).forEach((cs) => subjectsPerClass.set(cs.class_id, (subjectsPerClass.get(cs.class_id) ?? 0) + 1));

    // Group totals per student
    const totalsByStudent = new Map<string, { score: number; max: number; periods: Set<string> }>();
    (periodTotals ?? []).forEach((t) => {
      const cur = totalsByStudent.get(t.student_id) ?? { score: 0, max: 0, periods: new Set() };
      cur.score += Number(t.total_score) || 0;
      cur.periods.add(t.period);
      totalsByStudent.set(t.student_id, cur);
    });

    // Compute max per student: subjects_in_class * max_per_period * 8 periods
    const PERIOD_COUNT = 8;
    for (const s of students ?? []) {
      const subjectCount = subjectsPerClass.get(s.class_id) ?? 0;
      const perPeriodMax = maxPerPeriodByDept.get(s.department_id) ?? fallbackMax;
      const totalMax = subjectCount * perPeriodMax * PERIOD_COUNT;
      const cur = totalsByStudent.get(s.id);

      if (!cur || totalMax === 0 || cur.score === 0) {
        summary.no_grades.push({ id: s.id, name: s.full_name, class_id: s.class_id });
        continue;
      }
      cur.max = totalMax;
      const pct = (cur.score / totalMax) * 100;
      const passed = pct >= pass_mark;

      const promo = promotionMap.get(s.class_id);
      if (passed) {
        if (promo?.nextNewClassId) {
          summary.promoted.push({
            id: s.id,
            name: s.full_name,
            from_class_id: s.class_id,
            to_class_id: promo.nextNewClassId,
            to_class_name: promo.nextName,
            average: Math.round(pct * 10) / 10,
          });
        } else {
          // No next class -> graduate
          summary.graduated.push({ id: s.id, name: s.full_name, average: Math.round(pct * 10) / 10 });
        }
      } else {
        // Retain: move to new year's clone of same class (repeat)
        const oldCls = (oldClasses ?? []).find((c) => c.id === s.class_id)!;
        const newCls = newClassByKey.get(`${oldCls.department_id}::${oldCls.name}`);
        summary.retained.push({
          id: s.id,
          name: s.full_name,
          from_class_id: s.class_id,
          to_class_id: newCls?.id ?? null,
          class_name: oldCls.name,
          average: Math.round(pct * 10) / 10,
        });
      }
    }

    if (dry_run) {
      return json({ ok: true, dry_run: true, classes_to_create: classesToCreate.length, summary: countsOnly(summary), preview: summary });
    }

    // 7. Apply: update students
    // Promoted -> set class_id to new
    for (const p of summary.promoted) {
      await admin.from("students").update({ class_id: p.to_class_id }).eq("id", p.id);
    }
    // Graduated -> mark_student_departed
    for (const g of summary.graduated) {
      await admin.rpc("mark_student_departed", {
        p_student_id: g.id,
        p_status: "graduated",
        p_departure_date: new Date().toISOString().slice(0, 10),
        p_reason: `Graduated at end of ${fromYear.year_name}`,
      });
    }
    // Retained -> move to new year clone of same class (only if a new clone exists)
    for (const r of summary.retained) {
      if (r.to_class_id) {
        await admin.from("students").update({ class_id: r.to_class_id }).eq("id", r.id);
      }
    }

    // 8. Set new year as current
    await admin.from("academic_years").update({ is_current: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("academic_years").update({ is_current: true }).eq("id", to_year_id);

    // 9. Audit log
    await admin.from("audit_logs").insert({
      school_id: schoolId,
      actor_user_id: userId,
      action: "year.rollover",
      entity_type: "academic_year",
      entity_id: to_year_id,
      metadata: {
        from_year: fromYear.year_name,
        to_year: toYear.year_name,
        pass_mark,
        promoted: summary.promoted.length,
        graduated: summary.graduated.length,
        retained: summary.retained.length,
        no_grades: summary.no_grades.length,
        classes_created: createdClasses.length,
      },
    });

    return json({
      ok: true,
      classes_created: createdClasses.length,
      summary: countsOnly(summary),
      details: summary,
    });
  } catch (e: any) {
    console.error("rollover error", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function emptySummary() {
  return { promoted: 0, graduated: 0, retained: 0, no_grades: 0 };
}
function countsOnly(s: any) {
  return {
    promoted: s.promoted.length,
    graduated: s.graduated.length,
    retained: s.retained.length,
    no_grades: s.no_grades.length,
  };
}
