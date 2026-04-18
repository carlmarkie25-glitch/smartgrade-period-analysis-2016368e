import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface SchoolInfo {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const safe = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));

/**
 * Builds a single-PDF Transfer Pack for a student containing:
 * biodata, academic history (period totals + yearly), attendance summary, and payment ledger.
 */
export async function generateTransferPack(studentId: string, school?: SchoolInfo): Promise<Blob> {
  // 1. Fetch all data in parallel
  const [studentRes, gradesRes, periodsRes, yearlyRes, attRes, paysRes, billsRes] = await Promise.all([
    supabase
      .from("students")
      .select("*, classes:class_id(name), departments:department_id(name)")
      .eq("id", studentId)
      .single(),
    supabase
      .from("student_grades")
      .select("score, max_score, period, assessment_types(name), class_subjects(subjects(name))")
      .eq("student_id", studentId),
    supabase
      .from("student_period_totals")
      .select("period, total_score, class_rank, class_subjects(subjects(name))")
      .eq("student_id", studentId),
    supabase
      .from("student_yearly_totals")
      .select("yearly_avg, semester1_avg, semester2_avg, class_rank, class_subjects(subjects(name))")
      .eq("student_id", studentId),
    supabase
      .from("attendance_records")
      .select("status, attendance_sessions(date)")
      .eq("student_id", studentId),
    supabase
      .from("student_payments")
      .select("payment_date, amount, payment_method, receipt_number, notes")
      .eq("student_id", studentId)
      .order("payment_date", { ascending: false }),
    supabase
      .from("student_bills")
      .select("grand_total, amount_paid, balance, status, academic_years(year_name)")
      .eq("student_id", studentId),
  ]);

  if (studentRes.error || !studentRes.data) throw studentRes.error ?? new Error("Student not found");
  const s: any = studentRes.data;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 40;

  // ===== Header =====
  doc.setFontSize(18).setFont("helvetica", "bold");
  doc.text("Student Transfer Pack", pageW / 2, y, { align: "center" });
  y += 20;
  doc.setFontSize(10).setFont("helvetica", "normal");
  if (school?.name) {
    doc.text(school.name, pageW / 2, y, { align: "center" });
    y += 14;
  }
  if (school?.address || school?.phone || school?.email) {
    doc.setFontSize(9);
    doc.text(
      [school?.address, school?.phone, school?.email].filter(Boolean).join(" · "),
      pageW / 2,
      y,
      { align: "center" },
    );
    y += 14;
  }
  doc.setFontSize(8).setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}  ·  Confidential`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 24;

  // ===== Biodata =====
  doc.setFontSize(12).setFont("helvetica", "bold").text("1. Student Biodata", 40, y);
  y += 6;
  autoTable(doc, {
    startY: y + 4,
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
  y = (doc as any).lastAutoTable.finalY + 20;

  // ===== Yearly academic summary =====
  if (y > 700) { doc.addPage(); y = 40; }
  doc.setFontSize(12).setFont("helvetica", "bold").text("2. Academic Performance — Yearly Summary", 40, y);
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

  // ===== Period totals =====
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

  // ===== Attendance summary =====
  if (y > 700) { doc.addPage(); y = 40; }
  const attRecords = attRes.data ?? [];
  const counts = attRecords.reduce<Record<string, number>>((acc, r: any) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalSessions = attRecords.length;
  const present = counts.present ?? 0;
  const rate = totalSessions ? ((present / totalSessions) * 100).toFixed(1) : "—";

  doc.setFontSize(12).setFont("helvetica", "bold").text("4. Attendance Summary", 40, y);
  autoTable(doc, {
    startY: y + 6,
    head: [["Total Sessions", "Present", "Absent", "Late", "Excused", "Attendance Rate"]],
    body: [[
      String(totalSessions),
      String(counts.present ?? 0),
      String(counts.absent ?? 0),
      String(counts.late ?? 0),
      String(counts.excused ?? 0),
      `${rate}%`,
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
  });
  y = (doc as any).lastAutoTable.finalY + 14;

  // ===== Bills summary =====
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

  // ===== Payment ledger =====
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
    body: payRows.length ? payRows : [["—", "—", "—", "—", "No payments recorded"]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [60, 60, 60] },
  });

  // ===== Footer on every page =====
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

  // Audit log
  await supabase.from("student_data_exports").insert({
    student_id: studentId,
    export_type: "transfer_pack",
    school_id: s.school_id,
  });

  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
