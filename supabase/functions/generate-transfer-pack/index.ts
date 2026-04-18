// Generates a Transfer Pack PDF server-side and uploads it to public storage.
// Returns a 7-day expiring share link (token + expires_at recorded in student_data_exports).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const safe = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Validate caller is an authenticated admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { student_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!body.student_id || typeof body.student_id !== "string") {
    return new Response(JSON.stringify({ error: "student_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Confirm caller is admin of the student's school
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all data in parallel
    const studentId = body.student_id;
    const [studentRes, periodsRes, yearlyRes, attRes, paysRes, billsRes, schoolRes] = await Promise.all([
      admin
        .from("students")
        .select("*, classes:class_id(name), departments:department_id(name)")
        .eq("id", studentId)
        .single(),
      admin
        .from("student_period_totals")
        .select("period, total_score, class_rank, class_subjects(subjects(name))")
        .eq("student_id", studentId),
      admin
        .from("student_yearly_totals")
        .select("yearly_avg, semester1_avg, semester2_avg, class_rank, class_subjects(subjects(name))")
        .eq("student_id", studentId),
      admin
        .from("attendance_records")
        .select("status")
        .eq("student_id", studentId),
      admin
        .from("student_payments")
        .select("payment_date, amount, payment_method, receipt_number, notes")
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false }),
      admin
        .from("student_bills")
        .select("grand_total, amount_paid, balance, status, academic_years(year_name)")
        .eq("student_id", studentId),
      admin.from("students").select("school_id").eq("id", studentId).single(),
    ]);

    if (studentRes.error || !studentRes.data) {
      throw studentRes.error ?? new Error("Student not found");
    }
    const s: any = studentRes.data;

    const schoolId = schoolRes.data?.school_id;
    const { data: school } = schoolId
      ? await admin.from("schools").select("name, address, phone, email").eq("id", schoolId).single()
      : { data: null };

    // Build PDF
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("Student Transfer Pack", pageW / 2, y, { align: "center" });
    y += 20;
    if (school?.name) {
      doc.setFontSize(10).setFont("helvetica", "normal");
      doc.text(school.name, pageW / 2, y, { align: "center" });
      y += 14;
    }
    if (school?.address || school?.phone || school?.email) {
      doc.setFontSize(9);
      doc.text([school?.address, school?.phone, school?.email].filter(Boolean).join(" · "), pageW / 2, y, { align: "center" });
      y += 14;
    }
    doc.setFontSize(8).setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}  ·  Confidential`, pageW / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 24;

    doc.setFontSize(12).setFont("helvetica", "bold").text("1. Student Biodata", 40, y);
    autoTable(doc, {
      startY: y + 6,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 130, fillColor: [245, 245, 245] } },
      body: [
        ["Student ID", safe(s.student_id)],
        ["Full name", safe(s.full_name)],
        ["Date of birth", fmt(s.date_of_birth)],
        ["Gender", safe(s.gender)],
        ["Nationality", safe(s.nationality)],
        ["Class at departure", safe(s.classes?.name)],
        ["Department", safe(s.departments?.name)],
        ["Status", safe(s.status)],
        ["Departure date", fmt(s.departure_date)],
        ["Departure reason", safe(s.departure_reason)],
        ["Phone", safe(s.phone_number)],
        ["Address", safe(s.address)],
        ["Father", `${safe(s.father_name)} (${safe(s.father_contact)})`],
        ["Mother", `${safe(s.mother_name)} (${safe(s.mother_contact)})`],
        ["Emergency contact", `${safe(s.emergency_contact_name)} — ${safe(s.emergency_contact_relationship)} — ${safe(s.emergency_contact_phone)}`],
        ["Health notes", safe(s.health_issues)],
        ["Previous school", `${safe(s.previous_school)} (${safe(s.previous_class)})`],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 18;

    if (y > 700) { doc.addPage(); y = 40; }
    doc.setFontSize(12).setFont("helvetica", "bold").text("2. Yearly Academic Summary", 40, y);
    const yearlyRows = (yearlyRes.data ?? []).map((r: any) => [
      safe(r.class_subjects?.subjects?.name),
      r.semester1_avg != null ? Number(r.semester1_avg).toFixed(1) : "—",
      r.semester2_avg != null ? Number(r.semester2_avg).toFixed(1) : "—",
      r.yearly_avg != null ? Number(r.yearly_avg).toFixed(1) : "—",
      safe(r.class_rank),
    ]);
    autoTable(doc, {
      startY: y + 6,
      head: [["Subject", "Sem 1 Avg", "Sem 2 Avg", "Yearly Avg", "Class Rank"]],
      body: yearlyRows.length ? yearlyRows : [["—", "—", "—", "—", "—"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
    });
    y = (doc as any).lastAutoTable.finalY + 14;

    if (y > 680) { doc.addPage(); y = 40; }
    doc.setFontSize(12).setFont("helvetica", "bold").text("3. Period Performance", 40, y);
    const periodRows = (periodsRes.data ?? []).map((r: any) => [
      safe(r.class_subjects?.subjects?.name),
      safe(r.period),
      r.total_score != null ? Number(r.total_score).toFixed(1) : "—",
      safe(r.class_rank),
    ]);
    autoTable(doc, {
      startY: y + 6,
      head: [["Subject", "Period", "Total Score", "Class Rank"]],
      body: periodRows.length ? periodRows : [["—", "—", "—", "—"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
    });
    y = (doc as any).lastAutoTable.finalY + 14;

    if (y > 700) { doc.addPage(); y = 40; }
    const att = attRes.data ?? [];
    const counts = att.reduce<Record<string, number>>((acc, r: any) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    const total = att.length;
    const rate = total ? (((counts.present ?? 0) / total) * 100).toFixed(1) : "—";

    doc.setFontSize(12).setFont("helvetica", "bold").text("4. Attendance Summary", 40, y);
    autoTable(doc, {
      startY: y + 6,
      head: [["Sessions", "Present", "Absent", "Excused", "Rate"]],
      body: [[String(total), String(counts.present ?? 0), String(counts.absent ?? 0), String(counts.excused ?? 0), `${rate}%`]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
    });
    y = (doc as any).lastAutoTable.finalY + 14;

    if (y > 680) { doc.addPage(); y = 40; }
    doc.setFontSize(12).setFont("helvetica", "bold").text("5. Financial Summary", 40, y);
    const billRows = (billsRes.data ?? []).map((b: any) => [
      safe(b.academic_years?.year_name),
      Number(b.grand_total ?? 0).toFixed(2),
      Number(b.amount_paid ?? 0).toFixed(2),
      Number(b.balance ?? 0).toFixed(2),
      safe(b.status),
    ]);
    autoTable(doc, {
      startY: y + 6,
      head: [["Year", "Total Billed", "Paid", "Balance", "Status"]],
      body: billRows.length ? billRows : [["—", "—", "—", "—", "—"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [60, 60, 60] },
    });
    y = (doc as any).lastAutoTable.finalY + 14;

    if (y > 660) { doc.addPage(); y = 40; }
    doc.setFontSize(12).setFont("helvetica", "bold").text("6. Payment Ledger", 40, y);
    const payRows = (paysRes.data ?? []).map((p: any) => [
      fmt(p.payment_date),
      safe(p.receipt_number),
      safe(p.payment_method),
      Number(p.amount ?? 0).toFixed(2),
      safe(p.notes),
    ]);
    autoTable(doc, {
      startY: y + 6,
      head: [["Date", "Receipt #", "Method", "Amount", "Notes"]],
      body: payRows.length ? payRows : [["—", "—", "—", "—", "No payments"]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [60, 60, 60] },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8).setTextColor(140);
      doc.text(
        `Transfer Pack · ${s.full_name} (${s.student_id}) · Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" },
      );
    }

    const pdfBytes = doc.output("arraybuffer");

    // Insert export record (gets share_token + expires_at defaults)
    const { data: exportRec, error: expErr } = await admin
      .from("student_data_exports")
      .insert({
        student_id: studentId,
        school_id: schoolId,
        export_type: "transfer_pack",
        created_by: userData.user.id,
      })
      .select("id, share_token, expires_at")
      .single();
    if (expErr || !exportRec) throw expErr ?? new Error("Failed to create export record");

    const path = `${schoolId ?? "unscoped"}/${exportRec.share_token}.pdf`;

    const { error: upErr } = await admin.storage
      .from("transfer-packs")
      .upload(path, new Uint8Array(pdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    await admin
      .from("student_data_exports")
      .update({ storage_path: path })
      .eq("id", exportRec.id);

    const { data: pub } = admin.storage.from("transfer-packs").getPublicUrl(path);

    // Audit log (best-effort)
    await admin.rpc("write_audit_log", {
      p_action: "transfer_pack.generated",
      p_entity_type: "student",
      p_entity_id: studentId,
      p_metadata: { share_token: exportRec.share_token, expires_at: exportRec.expires_at },
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        download_url: pub.publicUrl,
        share_link: pub.publicUrl,
        expires_at: exportRec.expires_at,
        share_token: exportRec.share_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("generate-transfer-pack error", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
