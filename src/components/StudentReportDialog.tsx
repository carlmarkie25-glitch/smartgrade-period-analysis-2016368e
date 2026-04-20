import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Save, Pencil } from "lucide-react";
import { useStudentReport } from "@/hooks/useStudentReport";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  ReportInputs,
  useCanEditReportInputs,
  useReportInputs,
  useSaveReportInputs,
} from "@/hooks/useReportInputs";
import { toast } from "@/hooks/use-toast";
import { isKindergartenClass, KG_SCALE, scoreToLetter } from "@/lib/kindergarten";
import { useSchool } from "@/contexts/SchoolContext";
import {
  DEFAULT_REPORT_CARD_SETTINGS,
  gradeFromSettings,
  kgLabelFromSettings,
  useReportCardSettings,
} from "@/hooks/useReportCardSettings";

const RATING_OPTIONS = ["Excellent", "Very Good", "Good", "Fair", "Needs Improvement"];

const EditableField = ({
  value,
  onChange,
  editable,
  multiline,
  placeholder,
  options,
  minHeight,
  plain,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  multiline?: boolean;
  placeholder?: string;
  options?: string[];
  minHeight?: number;
  /** Render with no border / no background — used for signature lines. */
  plain?: boolean;
}) => {
  const baseStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#222',
    border: plain ? 'none' : '0.5px solid #ddd',
    padding: plain ? '0' : '4px 6px',
    borderRadius: plain ? 0 : 3,
    background: plain ? 'transparent' : (editable ? '#fff' : '#fafafa'),
    margin: 0,
    minHeight: minHeight ?? 30,
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    textAlign: plain ? 'center' : undefined,
  };
  if (!editable) {
    return (
      <p style={baseStyle as any}>
        {value?.trim() ? value : '\u00A0'}
      </p>
    );
  }
  if (options) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...baseStyle, fontWeight: 700 }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={baseStyle}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={baseStyle}
    />
  );
};

interface StudentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  period: string;
  className?: string;
}

const isIncompleteScore = (score: number | null | undefined): boolean => {
  return score === null || score === undefined || score < 60;
};

const displayScore = (score: number | null | undefined, noGrades?: boolean): string => {
  if (noGrades) return '--';
  if (isIncompleteScore(score)) return 'I';
  return String(score);
};

/** Score color class */
const scoreColorStyle = (score: number | null | undefined): React.CSSProperties => {
  if (score === null || score === undefined) return { color: '#999' };
  const n = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(n)) return { color: '#999' };
  if (n >= 90) return { color: '#155724', fontWeight: 700 };
  if (n >= 75) return { color: '#1a3a6e', fontWeight: 600 };
  // 70–74 amber
  if (n >= 70) return { color: '#856404', fontWeight: 600 };
  // 60–69 (and anything below) → red, since D tier was removed
  return { color: '#c0392b', fontWeight: 700 };
};

export const StudentReportDialog = ({
  open,
  onOpenChange,
  studentId,
  period,
  className,
}: StudentReportDialogProps) => {
  const { data: report, isLoading } = useStudentReport(studentId, period);
  const { data: savedInputs } = useReportInputs(studentId, period);
  const canEdit = useCanEditReportInputs(studentId);
  const saveMutation = useSaveReportInputs(studentId, period);
  const { school } = useSchool();
  const { data: rcSettingsData } = useReportCardSettings();
  const rcSettings = rcSettingsData ?? DEFAULT_REPORT_CARD_SETTINGS;

  const [editing, setEditing] = useState(false);
  const [inputs, setInputs] = useState<ReportInputs>({});

  useEffect(() => {
    setInputs(savedInputs ?? {});
    setEditing(false);
  }, [savedInputs, studentId, period]);

  const setField = (k: keyof ReportInputs) => (v: string) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(inputs);
      toast({ title: "Saved", description: "Report inputs updated." });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  const [downloading, setDownloading] = useState(false);
  const [greyMode, setGreyMode] = useState(false);

  const handleDownloadPdf = async () => {
    const el = document.getElementById('report-content');
    if (!el) {
      toast({ title: 'Error', description: 'Report not ready', variant: 'destructive' });
      return;
    }

    // Ensure we capture the read-only view (not the editor with form controls,
    // which html2canvas mis-aligns vs static text).
    const wasEditing = editing;
    if (wasEditing) setEditing(false);
    // Wait a tick for React to commit the change.
    await new Promise((r) => setTimeout(r, 50));

    // Replace form controls (textarea/input/select) inside the report with their
    // text values during capture, so html2canvas renders them as plain text
    // with no baseline shifts. Restore them after.
    const controls = Array.from(
      el.querySelectorAll('textarea, input, select')
    ) as (HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement)[];
    const placeholders: { control: HTMLElement; replacement: HTMLElement }[] = [];
    controls.forEach((ctrl) => {
      const span = document.createElement('div');
      let val = '';
      if (ctrl instanceof HTMLSelectElement) {
        val = ctrl.options[ctrl.selectedIndex]?.text || '';
      } else {
        val = (ctrl as HTMLInputElement | HTMLTextAreaElement).value || '';
      }
      span.textContent = val.trim() ? val : '\u00A0';
      span.style.cssText = ctrl.style.cssText;
      span.style.whiteSpace = 'pre-wrap';
      span.style.display = 'block';
      ctrl.parentNode?.insertBefore(span, ctrl);
      ctrl.style.display = 'none';
      placeholders.push({ control: ctrl, replacement: span });
    });

    try {
      setDownloading(true);
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Use the element's natural rendered width so captured layout matches preview.
      const renderWidth = el.scrollWidth;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: renderWidth,
        width: renderWidth,
        scrollX: 0,
        scrollY: -window.scrollY,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Fit the entire report onto a SINGLE A4 page by scaling proportionally.
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      // Center horizontally; align to top vertically.
      const x = (pageW - imgW) / 2;
      const y = 0;
      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);

      const studentName = (report?.student?.full_name || 'student').replace(/\s+/g, '_');
      pdf.save(`Report_${studentName}_${period}.pdf`);
      toast({ title: 'Downloaded', description: 'Report PDF saved.' });
    } catch (e: any) {
      toast({ title: 'Download failed', description: e?.message || 'Could not generate PDF', variant: 'destructive' });
    } finally {
      // Restore form controls
      placeholders.forEach(({ control, replacement }) => {
        replacement.remove();
        control.style.display = '';
      });
      if (wasEditing) setEditing(true);
      setDownloading(false);
    }
  };

  const getSemesterLabel = () => {
    switch (period) {
      case "yearly": return "1 & 2";
      case "semester1": return "1 (P1, P2, P3, Exam)";
      case "semester2": return "2 (P4, P5, P6, Exam)";
      case "p1": return "1 (Period 1)";
      case "p2": return "1 (Period 2)";
      case "p3": return "1 (Period 3)";
      case "exam_s1": return "1 (Exam)";
      case "p4": return "2 (Period 4)";
      case "p5": return "2 (Period 5)";
      case "p6": return "2 (Period 6)";
      case "exam_s2": return "2 (Exam)";
      default: return period;
    }
  };

  const getDepartmentLabel = () => {
    return "Report Card";
  };

  // Compute subject semester average
  const computeSubjectSemAvg = (subject: any, periods: string[]): number | null => {
    const hasInc = periods.some(p => subject.periods?.[p]?.isIncomplete || subject.periods?.[p]?.noGrades);
    if (hasInc) return null;
    const scores = periods.map(p => subject.periods?.[p]?.score).filter((s: any) => s !== null && s !== undefined);
    if (scores.length !== periods.length) return null;
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  };

  // Compute subject yearly average
  const computeSubjectYearlyAvg = (subject: any): number | null => {
    const s1 = computeSubjectSemAvg(subject, ['p1', 'p2', 'p3']);
    const s2 = computeSubjectSemAvg(subject, ['p4', 'p5', 'p6']);
    if (s1 === null || s2 === null) return null;
    return Math.round((s1 + s2) / 2);
  };

  // Compute aggregate sums for a period key
  const computeColumnSum = (subjects: any[], periodKey: string): number => {
    return subjects.reduce((sum: number, s: any) => sum + (s.periods?.[periodKey]?.score ?? 0), 0);
  };

  // Compute column average
  const computeColumnAvg = (subjects: any[], periodKey: string): number => {
    const n = subjects.length;
    if (n === 0) return 0;
    return Math.round(computeColumnSum(subjects, periodKey) / n);
  };

  // Overall summary for averages
  const computeOverallSemAvg = (subjects: any[], periods: string[]): number | null => {
    const avgs = subjects.map((s: any) => computeSubjectSemAvg(s, periods)).filter(v => v !== null) as number[];
    if (avgs.length !== subjects.length) return null;
    return Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length);
  };

  // Styles
  const navy = '#1a2a6e';
  const gold = '#c8a84b';
  const lightBlue = '#2a5298';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] max-h-[95vh] overflow-y-auto p-0 gap-0 border-none" style={{ background: '#e8eaf0' }}>
        <DialogHeader className="sr-only">
          <DialogTitle>Student Report Card</DialogTitle>
          <DialogDescription>Academic Report Card</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : report ? (() => {
          const subjects = report.subjects || [];
          const isYearly = period === 'yearly';
          const isSem1 = period === 'semester1';
          const isSem2 = period === 'semester2';
          const isSemester = report.isSemesterReport;
          const isKg = isKindergartenClass(report.student.classes);
          // KG/Nursery/ABC classes use the SAME standard report layout as all other
          // classes — only the grading legend at the bottom shows the KG letter scale,
          // and numeric scores are rendered as letter grades (A+, A, B+, …).

          // Wrap a numeric score for display: shows letter for KG, raw number otherwise.
          // Scores in `report` are ALREADY normalized to 0–100, so we always treat
          // max as 100 when converting to a KG letter (ignore the raw assessment max).
          const kgWrap = (v: any, _max: number = 100): any => {
            if (!isKg) return v;
            if (v === null || v === undefined || v === '--' || v === 'I') return v;
            const n = typeof v === 'number' ? v : Number(v);
            if (!Number.isFinite(n)) return v;
            return scoreToLetter(n, 100) ?? '—';
          };
          // Wrap displayScore output (handles 'I' / '--' passthrough)
          const kgDisp = (score: number | null | undefined, noGrades?: boolean, _max: number = 100): string => {
            const base = displayScore(score, noGrades);
            if (!isKg) return base;
            if (base === '--' || base === 'I') return base;
            return scoreToLetter(score as number, 100) ?? '—';
          };

          // Unified averaging — these match the "Average" row of the grades table
          // so the General Average always equals the row totals shown above.
          // Cumulative averaging metric:
          // Each period's average is averaged consecutively with the next, including exam,
          // which produces the semester average. Same pattern for semester 2.
          // Yearly = avg(semester1, semester2).
          const avgOf = (vals: (number | null)[]): number | null => {
            const xs = vals.filter((v): v is number => v !== null && v !== undefined);
            if (xs.length === 0) return null;
            return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
          };
          // Returns null when no subject has any score for that period (so it's skipped in averages)
          // Also returns null if ANY subject has an incomplete ("I") grade in that period —
          // averages cannot be computed until all I's are settled.
          const colAvg = (k: string): number | null => {
            if (subjects.length === 0) return null;

            // Non-semester report: subjects have flat { total, hasIncomplete, noGrades }
            // (no `.periods` map). Fall back to the same logic as the single-period
            // Aggregate/Average row so the General Average matches what's shown.
            if (!isSemester && k === period) {
              const anyInc = subjects.some((s: any) => s.noGrades || s.hasIncomplete);
              if (anyInc) return null;
              const valid = subjects.filter((s: any) => !s.noGrades && !s.hasIncomplete);
              if (valid.length === 0) return null;
              const sum = valid.reduce((a: number, s: any) => a + (s.total ?? 0), 0);
              return Math.round(sum / valid.length);
            }

            const anyIncomplete = subjects.some((s: any) => {
              const p = s.periods?.[k];
              return p && (p.isIncomplete || p.noGrades);
            });
            if (anyIncomplete) return null;
            const hasAny = subjects.some((s: any) => {
              const p = s.periods?.[k];
              return p && p.score !== null && p.score !== undefined && p.max > 0;
            });
            if (!hasAny) return null;
            return computeColumnAvg(subjects, k);
          };

          // Semester averages include the exam (4 columns averaged equally).
          // Require ALL 4 columns (3 periods + exam) to be present — otherwise null.
          // A semester average is only valid once every period AND the exam are computed.
          const semAvgStrict = (vals: (number | null)[]): number | null => {
            if (vals.some(v => v === null || v === undefined)) return null;
            return avgOf(vals);
          };
          const s1Avg = semAvgStrict([colAvg('p1'), colAvg('p2'), colAvg('p3'), colAvg('exam_s1')]);
          const s2Avg = semAvgStrict([colAvg('p4'), colAvg('p5'), colAvg('p6'), colAvg('exam_s2')]);

          let generalAvg: number | null;
          if (isYearly) {
            generalAvg = avgOf([s1Avg, s2Avg]);
          } else if (isSem2 || period === 'exam_s2') {
            generalAvg = avgOf([s1Avg, s2Avg]);
          } else if (isSem1 || period === 'exam_s1') {
            generalAvg = s1Avg;
          } else if (period === 'p1') {
            generalAvg = colAvg('p1');
          } else if (period === 'p2') {
            generalAvg = avgOf([colAvg('p1'), colAvg('p2')]);
          } else if (period === 'p3') {
            generalAvg = avgOf([colAvg('p1'), colAvg('p2'), colAvg('p3')]);
          } else if (period === 'p4') {
            generalAvg = avgOf([s1Avg, colAvg('p4')]);
          } else if (period === 'p5') {
            generalAvg = avgOf([s1Avg, colAvg('p4'), colAvg('p5')]);
          } else if (period === 'p6') {
            generalAvg = avgOf([s1Avg, colAvg('p4'), colAvg('p5'), colAvg('p6')]);
          } else {
            generalAvg = colAvg(period);
          }

          const { letter: letterGrade, label: gradeLabel } = gradeFromSettings(generalAvg, rcSettings);

          // Aggregate sums
          const periodKeys = isYearly ? ['p1','p2','p3','p4','p5','p6'] :
                              isSem1 ? ['p1','p2','p3','exam_s1'] :
                              isSem2 ? ['p4','p5','p6','exam_s2'] : [period];

          return (
            <div>
              {/* ===== ACTION BUTTONS (screen only) ===== */}
              <div className="flex gap-2 justify-center py-3 print:hidden flex-wrap" style={{ background: '#e8eaf0' }}>
                <Button onClick={handleDownloadPdf} size="sm" className="gap-2" disabled={downloading} style={{ background: navy, color: '#fff' }}>
                  <Download className="h-4 w-4" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
                </Button>
                {canEdit && !editing && (
                  <Button onClick={() => setEditing(true)} size="sm" variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" /> Edit Teacher Inputs
                  </Button>
                )}
                {canEdit && editing && (
                  <>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="gap-2"
                      disabled={saveMutation.isPending}
                      style={{ background: '#16a34a', color: '#fff' }}
                    >
                      <Save className="h-4 w-4" />
                      {saveMutation.isPending ? 'Saving...' : 'Save Inputs'}
                    </Button>
                    <Button
                      onClick={() => { setInputs(savedInputs ?? {}); setEditing(false); }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              {/* ===== REPORT CARD PAPER ===== */}
              <div id="report-content" style={{
                background: '#fff', color: '#111', fontSize: '12px', fontFamily: 'Arial, sans-serif',
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #bbb',
              }}>

                {/* ── HEADER ── */}
                {(() => {
                  const headerTitle = rcSettings.header_title || school?.name || 'School Name';
                  const headerAddress = rcSettings.header_address || school?.address || '';
                  const headerContact = rcSettings.header_contact || [school?.phone, school?.email].filter(Boolean).join(' • ');
                  const headerWebsite = rcSettings.header_website || school?.website || '';
                   const logo = rcSettings.admin_signature_url || rcSettings.logo_url || school?.logo_url || null;
                   return (
                     <div style={{ background: navy, color: '#fff', display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '14px' }}>
                       {logo && (
                         <img
                           src={logo}
                           alt="School logo"
                           style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0, background: 'transparent' }}
                         />
                       )}
                      <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {headerTitle.toUpperCase()}
                        </h1>
                         {rcSettings.header_subtitle && (
                           <p style={{ fontSize: '12px', color: gold, margin: '2px 0 0', fontStyle: 'italic' }}>
                             {rcSettings.header_subtitle}
                           </p>
                         )}
                         {headerAddress && (
                           <p style={{ fontSize: '12px', color: '#ccd', margin: 0 }}>
                             {headerAddress}{headerContact ? ` | ${headerContact}` : ''}
                           </p>
                         )}
                         {headerWebsite && (
                           <p style={{ fontSize: '12px', color: '#ccd', margin: 0 }}>{headerWebsite}</p>
                         )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <div style={{
                           background: gold, color: '#fff', textAlign: 'center', padding: '4px 10px',
                           fontSize: '11px', fontWeight: 700, borderRadius: '3px', minWidth: '80px'
                         }}>
                           <small style={{ display: 'block', fontSize: '9px', fontWeight: 400, opacity: 0.85, letterSpacing: '0.5px' }}>REPORT TYPE</small>
                           {getDepartmentLabel().toUpperCase()}
                         </div>
                         <div style={{
                           background: gold, color: '#fff', textAlign: 'center', padding: '4px 10px',
                           fontSize: '11px', fontWeight: 700, borderRadius: '3px', minWidth: '80px'
                         }}>
                           <small style={{ display: 'block', fontSize: '9px', fontWeight: 400, opacity: 0.85, letterSpacing: '0.5px' }}>SEMESTER</small>
                           {getSemesterLabel()}
                         </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── TITLE BAR ── */}
                <div style={{ background: navy, textAlign: 'center', padding: '10px', borderTop: `2px solid ${gold}` }}>
                  <h2 style={{ color: '#fff', fontSize: '16px', letterSpacing: '2px', fontWeight: 700, margin: 0 }}>
                    ACADEMIC REPORT CARD
                  </h2>
                  <p style={{ color: gold, fontSize: '12px', margin: 0 }}>
                    {report.student.classes?.academic_years?.year_name || '--'} School Year
                  </p>
                </div>

                {/* ── STUDENT INFO ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #ccc' }}>
                  {(() => {
                    const teacherName = (report as any).classTeacherName || inputs.class_teacher_name || '--';
                    return [
                      ['Student Name', report.student.full_name],
                      ['Student ID', report.student.student_id],
                      ['Grade Level', report.student.classes?.name || '--'],
                      ['Class Teacher', teacherName],
                      ['Gender', report.student.gender || '--'],
                    ];
                  })().map(([label, val], i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px',
                      borderBottom: '0.5px solid #e5e5e5',
                      borderRight: i % 2 === 0 ? '0.5px solid #ccc' : 'none',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#444', textTransform: 'uppercase', minWidth: '100px' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#111', fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* ── INCOMPLETE NOTICE ── */}
                {report.hasIncomplete && (
                  <div style={{ margin: '10px 12px', padding: '8px 12px', background: '#fff3cd', color: '#856404', fontSize: '12px', fontWeight: 600, border: '1px solid #ffeaa7', borderRadius: '3px' }}>
                    ⚠️ This student has incomplete grades (marked as "I"). Averages and rankings cannot be calculated until all grades are complete.
                  </div>
                )}

                {/* ── SECTION: GRADES ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                  ACADEMIC PERFORMANCE — GRADES BY PERIOD
                </div>

                {/* ── GRADES TABLE ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '12px' }}>
                  <colgroup>
                    <col style={{ width: 130 }} />
                    {isSemester && isYearly ? (
                      <>
                        {[...Array(3)].map((_, i) => <col key={`s1p${i}`} style={{ width: '5%' }} />)}
                        <col style={{ width: '6%' }} />{/* S.EXAM */}
                        <col style={{ width: '6%' }} />{/* S.AVG */}
                        {[...Array(3)].map((_, i) => <col key={`s2p${i}`} style={{ width: '5%' }} />)}
                        <col style={{ width: '6%' }} />{/* S.EXAM */}
                        <col style={{ width: '6%' }} />{/* S.AVG */}
                        <col style={{ width: '6%' }} />{/* Y.AVG */}
                      </>
                    ) : isSemester ? (
                      <>
                        {[...Array(3)].map((_, i) => <col key={`p${i}`} style={{ width: '12%' }} />)}
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                      </>
                    ) : (
                      <col style={{ width: '30%' }} />
                    )}
                  </colgroup>
                  <thead>
                    {isSemester && isYearly ? (
                      <>
                        <tr>
                          <th rowSpan={2} style={{ ...thBase, background: navy, textAlign: 'left', paddingLeft: 8 }}>Subject</th>
                          <th colSpan={5} style={{ ...thBase, background: lightBlue }}>Semester 1</th>
                          <th colSpan={5} style={{ ...thBase, background: lightBlue }}>Semester 2</th>
                          <th rowSpan={2} style={{ ...thBase, background: gold, color: '#fff', fontWeight: 700 }}>Y.AVG</th>
                        </tr>
                        <tr>
                          <th style={thBase}>P1</th><th style={thBase}>P2</th><th style={thBase}>P3</th>
                          <th style={{ ...thBase, background: lightBlue }}>S.EXAM</th>
                          <th style={{ ...thBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>S.AVG</th>
                          <th style={thBase}>P4</th><th style={thBase}>P5</th><th style={thBase}>P6</th>
                          <th style={{ ...thBase, background: lightBlue }}>S.EXAM</th>
                          <th style={{ ...thBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>S.AVG</th>
                        </tr>
                      </>
                    ) : isSemester ? (
                      <tr>
                        <th style={{ ...thBase, background: navy, textAlign: 'left', paddingLeft: 8 }}>Subject</th>
                        {(isSem1 ? ['P1','P2','P3','S.EXAM'] : ['P4','P5','P6','S.EXAM']).map(h => (
                          <th key={h} style={{ ...thBase, background: h === 'S.EXAM' ? lightBlue : '#2a3a8e' }}>{h}</th>
                        ))}
                        <th style={{ ...thBase, background: '#1a5276', fontWeight: 700 }}>S.AVG</th>
                      </tr>
                    ) : (
                      <tr>
                        <th style={{ ...thBase, background: navy, textAlign: 'left', paddingLeft: 8 }}>Subject</th>
                        <th style={{ ...thBase, background: '#2a3a8e' }}>Score</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {subjects.map((subject: any, idx: number) => {
                      const s1avg = computeSubjectSemAvg(subject, ['p1', 'p2', 'p3']);
                      const s2avg = computeSubjectSemAvg(subject, ['p4', 'p5', 'p6']);
                      const yavg = computeSubjectYearlyAvg(subject);

                      return (
                        <tr key={idx}>
                          <td style={{ ...tdBase, textAlign: 'left', paddingLeft: 8, background: '#f9f9fc', color: '#111', fontWeight: 700, fontSize: '13px' }}>
                            {subject.name}
                          </td>
                          {isSemester && isYearly ? (
                            <>
                              {['p1','p2','p3'].map(p => (
                                <td key={p} style={{ ...tdBase, ...(isKg ? {} : scoreColorStyle(subject.periods?.[p]?.score)) }}>
                                  {kgDisp(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades, subject.periods?.[p]?.max)}
                                </td>
                              ))}
                              <td style={{ ...tdBase, background: lightBlue, color: '#fff', fontWeight: 600 }}>
                                {kgDisp(subject.periods?.exam_s1?.score, subject.periods?.exam_s1?.noGrades, subject.periods?.exam_s1?.max)}
                              </td>
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {s1avg !== null ? kgWrap(s1avg) : '--'}
                              </td>
                              {['p4','p5','p6'].map(p => (
                                <td key={p} style={{ ...tdBase, ...(isKg ? {} : scoreColorStyle(subject.periods?.[p]?.score)) }}>
                                  {kgDisp(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades, subject.periods?.[p]?.max)}
                                </td>
                              ))}
                              <td style={{ ...tdBase, background: lightBlue, color: '#fff', fontWeight: 600 }}>
                                {kgDisp(subject.periods?.exam_s2?.score, subject.periods?.exam_s2?.noGrades, subject.periods?.exam_s2?.max)}
                              </td>
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {s2avg !== null ? kgWrap(s2avg) : '--'}
                              </td>
                              <td style={{ ...tdBase, background: gold, color: '#fff', fontWeight: 700 }}>
                                {yavg !== null ? kgWrap(yavg) : '--'}
                              </td>
                            </>
                          ) : isSemester ? (
                            <>
                              {(isSem1 ? ['p1','p2','p3','exam_s1'] : ['p4','p5','p6','exam_s2']).map(p => {
                                const isExam = p.startsWith('exam');
                                return (
                                  <td key={p} style={{
                                    ...tdBase,
                                    ...(isExam ? { background: lightBlue, color: '#fff', fontWeight: 600 } : (isKg ? {} : scoreColorStyle(subject.periods?.[p]?.score)))
                                  }}>
                                    {kgDisp(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades, subject.periods?.[p]?.max)}
                                  </td>
                                );
                              })}
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {(() => {
                                  const avg = computeSubjectSemAvg(subject, isSem1 ? ['p1','p2','p3'] : ['p4','p5','p6']);
                                  return avg !== null ? kgWrap(avg) : '--';
                                })()}
                              </td>
                            </>
                          ) : (
                            <td
                              style={{
                                ...tdBase,
                                fontWeight: 700,
                                ...(subject.noGrades
                                  ? { color: '#999' }
                                  : subject.hasIncomplete
                                    ? { color: '#721c24' }
                                    : scoreColorStyle(subject.total))
                              }}
                            >
                              {subject.noGrades ? '--' : subject.hasIncomplete ? 'I' : kgWrap(subject.total, subject.max)}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* Aggregate / Average rows — hidden for KG (letter grades only) */}
                    {!isKg && isSemester && isYearly && (
                      <>
                        <tr>
                          {(() => {
                            const aggStyle: React.CSSProperties = { ...tdBase, background: '#e8f0e8', fontWeight: 700, color: '#1a5226' };
                            const s1Sum = subjects.reduce((a: number, s: any) => a + (computeSubjectSemAvg(s, ['p1','p2','p3']) ?? 0), 0);
                            const s2Sum = subjects.reduce((a: number, s: any) => a + (computeSubjectSemAvg(s, ['p4','p5','p6']) ?? 0), 0);
                            return (
                              <>
                                <td style={{ ...aggStyle, textAlign: 'left', paddingLeft: 8 }}>Aggregate</td>
                                {['p1','p2','p3'].map(p => <td key={p} style={aggStyle}>{computeColumnSum(subjects, p)}</td>)}
                                <td style={{ ...aggStyle, background: lightBlue, color: '#fff' }}>{computeColumnSum(subjects, 'exam_s1')}</td>
                                <td style={{ ...aggStyle, background: '#1a5276', color: '#fff' }}>{s1Sum}</td>
                                {['p4','p5','p6'].map(p => <td key={p} style={aggStyle}>{computeColumnSum(subjects, p)}</td>)}
                                <td style={{ ...aggStyle, background: lightBlue, color: '#fff' }}>{computeColumnSum(subjects, 'exam_s2')}</td>
                                <td style={{ ...aggStyle, background: '#1a5276', color: '#fff' }}>{s2Sum}</td>
                                <td style={{ ...aggStyle, background: gold, color: '#fff' }}>{s1Sum + s2Sum}</td>
                              </>
                            );
                          })()}
                        </tr>
                        <tr>
                          {(() => {
                            const avgStyle: React.CSSProperties = { ...tdBase, background: '#fff3cd', fontWeight: 700, color: '#7d5a00' };
                            return (
                              <>
                                <td style={{ ...avgStyle, textAlign: 'left', paddingLeft: 8 }}>Average</td>
                                {['p1','p2','p3'].map(p => <td key={p} style={avgStyle}>{kgWrap(computeColumnAvg(subjects, p))}</td>)}
                                <td style={{ ...avgStyle, background: lightBlue, color: '#fff' }}>{kgWrap(computeColumnAvg(subjects, 'exam_s1'))}</td>
                                <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{s1Avg !== null && s1Avg !== undefined ? kgWrap(s1Avg) : '--'}</td>
                                {['p4','p5','p6'].map(p => <td key={p} style={avgStyle}>{kgWrap(computeColumnAvg(subjects, p))}</td>)}
                                <td style={{ ...avgStyle, background: lightBlue, color: '#fff' }}>{kgWrap(computeColumnAvg(subjects, 'exam_s2'))}</td>
                                <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{s2Avg !== null && s2Avg !== undefined ? kgWrap(s2Avg) : '--'}</td>
                                <td style={{ ...avgStyle, background: gold, color: '#fff' }}>{generalAvg !== null && generalAvg !== undefined ? kgWrap(generalAvg) : '--'}</td>
                              </>
                            );
                          })()}
                        </tr>
                      </>
                    )}

                    {/* Aggregate / Average — single semester (S1 or S2) */}
                    {!isKg && isSemester && !isYearly && (() => {
                      const cols = isSem1 ? ['p1','p2','p3','exam_s1'] : ['p4','p5','p6','exam_s2'];
                      const periodAvgKeys = isSem1 ? ['p1','p2','p3'] : ['p4','p5','p6'];
                      const semSum = subjects.reduce((a: number, s: any) => a + (computeSubjectSemAvg(s, periodAvgKeys) ?? 0), 0);
                      const semAvg = isSem1 ? s1Avg : s2Avg;
                      const aggStyle: React.CSSProperties = { ...tdBase, background: '#e8f0e8', fontWeight: 700, color: '#1a5226' };
                      const avgStyle: React.CSSProperties = { ...tdBase, background: '#fff3cd', fontWeight: 700, color: '#7d5a00' };
                      return (
                        <>
                          <tr>
                            <td style={{ ...aggStyle, textAlign: 'left', paddingLeft: 8 }}>Aggregate</td>
                            {cols.map((p) => {
                              const isExam = p.startsWith('exam');
                              return (
                                <td key={p} style={isExam ? { ...aggStyle, background: lightBlue, color: '#fff' } : aggStyle}>
                                  {computeColumnSum(subjects, p)}
                                </td>
                              );
                            })}
                            <td style={{ ...aggStyle, background: '#1a5276', color: '#fff' }}>{semSum}</td>
                          </tr>
                          <tr>
                            <td style={{ ...avgStyle, textAlign: 'left', paddingLeft: 8 }}>Average</td>
                            {cols.map((p) => {
                              const isExam = p.startsWith('exam');
                              return (
                                <td key={p} style={isExam ? { ...avgStyle, background: lightBlue, color: '#fff' } : avgStyle}>
                                  {kgWrap(computeColumnAvg(subjects, p))}
                                </td>
                              );
                            })}
                            <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{semAvg !== null && semAvg !== undefined ? kgWrap(semAvg) : '--'}</td>
                          </tr>
                        </>
                      );
                    })()}

                    {/* Aggregate / Average — single period view */}
                    {!isKg && !isSemester && subjects.length > 0 && (() => {
                      const aggStyle: React.CSSProperties = { ...tdBase, background: '#e8f0e8', fontWeight: 700, color: '#1a5226' };
                      const avgStyle: React.CSSProperties = { ...tdBase, background: '#fff3cd', fontWeight: 700, color: '#7d5a00' };
                      const anyIncomplete = subjects.some((s: any) => s.noGrades || s.hasIncomplete);
                      const totalSum = subjects.reduce((a: number, s: any) => a + (s.noGrades || s.hasIncomplete ? 0 : (s.total ?? 0)), 0);
                      const validSubjects = subjects.filter((s: any) => !s.noGrades && !s.hasIncomplete);
                      // Do not compute average if any subject is incomplete — must settle I's first
                      const avgDisplay = anyIncomplete
                        ? 'I'
                        : (validSubjects.length > 0 ? kgWrap(Math.round(totalSum / validSubjects.length)) : '--');
                      return (
                        <>
                          <tr>
                            <td style={{ ...aggStyle, textAlign: 'left', paddingLeft: 8 }}>Aggregate</td>
                            <td style={aggStyle}>{anyIncomplete ? 'I' : totalSum}</td>
                          </tr>
                          <tr>
                            <td style={{ ...avgStyle, textAlign: 'left', paddingLeft: 8 }}>Average</td>
                            <td style={avgStyle}>{avgDisplay}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>

                {/* ── CONDUCT ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                  CONDUCT & CHARACTER ASSESSMENT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid #ccc' }}>
                  {([
                    ['Behavior', 'behavior'],
                    ['Punctuality', 'punctuality'],
                    ['Participation', 'participation'],
                    ['Homework', 'homework'],
                  ] as const).map(([label, key], i) => (
                    <div key={key} style={{ padding: '5px 10px', borderRight: i < 3 ? '0.5px solid #ccc' : 'none' }}>
                      <label style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 2 }}>{label}</label>
                      <EditableField
                        value={(inputs[key] as string) || ''}
                        onChange={setField(key)}
                        editable={editing}
                        options={RATING_OPTIONS}
                        minHeight={22}
                      />
                    </div>
                  ))}
                </div>

                {/* ── TEACHER REMARKS ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                  TEACHER REMARKS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '0.5px solid #ccc' }}>
                  <div style={{ padding: '6px 10px', borderRight: '0.5px solid #ccc' }}>
                    <label style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>Teacher Comment</label>
                    <EditableField
                      value={inputs.teacher_comment || ''}
                      onChange={setField('teacher_comment')}
                      editable={editing}
                      multiline
                      minHeight={60}
                      placeholder="Overall remarks about the student..."
                    />
                  </div>
                  <div>
                    <div style={{ padding: '6px 10px', borderBottom: '0.5px solid #ccc' }}>
                      <label style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>Can Improve In</label>
                      <EditableField
                        value={inputs.can_improve_in || ''}
                        onChange={setField('can_improve_in')}
                        editable={editing}
                        multiline
                        minHeight={26}
                        placeholder="Areas needing improvement..."
                      />
                    </div>
                    <div style={{ padding: '6px 10px' }}>
                      <label style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>Excels In</label>
                      <EditableField
                        value={inputs.excels_in || ''}
                        onChange={setField('excels_in')}
                        editable={editing}
                        multiline
                        minHeight={22}
                        placeholder="Subjects/areas of strength..."
                      />
                    </div>
                  </div>
                </div>

                {/* ── PROMOTION STATEMENT (only on final yearly report card) ── */}
                {isYearly && (() => {
                  const currentClassName = report.student.classes?.name || 'current class';
                  const nextClassMatch = currentClassName.match(/(\d+)/);
                  const nextClassName = nextClassMatch
                    ? currentClassName.replace(nextClassMatch[1], String(parseInt(nextClassMatch[1], 10) + 1))
                    : 'the next class';
                  const studentName = report.student.full_name || '________________';
                  const status = inputs.promotion_status || '';
                  const setStatus = (v: string) => setInputs((prev) => ({ ...prev, promotion_status: v }));

                  const Box = ({ checked }: { checked: boolean }) => (
                    <span style={{
                      display: 'inline-block', width: 14, height: 14, border: '1px solid #333',
                      marginRight: 6, verticalAlign: 'middle', textAlign: 'center', lineHeight: '12px',
                      fontSize: 12, fontWeight: 700, background: '#fff',
                    }}>{checked ? '✓' : ''}</span>
                  );

                  const rowStyle: React.CSSProperties = {
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
                    fontSize: '12px', cursor: editing ? 'pointer' : 'default',
                  };

                  const onPick = (key: string) => () => {
                    if (!editing) return;
                    setStatus(status === key ? '' : key);
                  };

                  return (
                    <>
                      <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                        PROMOTION STATEMENT
                      </div>
                      <div style={{ padding: '12px 16px', borderTop: '0.5px solid #ccc' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '12px' }}>
                          This is to certify that <strong>{studentName}</strong>:
                        </p>
                        <div style={{ paddingLeft: 8 }}>
                          <div style={rowStyle} onClick={onPick('promoted')}>
                            <Box checked={status === 'promoted'} />
                            <span><strong>A.</strong> Promoted to <strong>{nextClassName}</strong></span>
                          </div>
                          <div style={rowStyle} onClick={onPick('probation')}>
                            <Box checked={status === 'probation'} />
                            <span><strong>B.</strong> Promoted on probation to <strong>{nextClassName}</strong></span>
                          </div>
                          <div style={{ paddingLeft: 22, paddingTop: 4, paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}>
                            <span style={{ fontStyle: 'italic', color: '#555' }}>Condition:</span>
                            <div style={{ flex: 1 }}>
                              <EditableField
                                value={inputs.promotion_condition || ''}
                                onChange={setField('promotion_condition')}
                                editable={editing && status === 'probation'}
                                placeholder={status === 'probation' ? 'Subject(s) / condition...' : '—'}
                                minHeight={28}
                              />
                            </div>
                          </div>
                          <div style={rowStyle} onClick={onPick('retained')}>
                            <Box checked={status === 'retained'} />
                            <span><strong>C.</strong> Retained in <strong>{currentClassName}</strong></span>
                          </div>
                          <div style={rowStyle} onClick={onPick('never_return')}>
                            <Box checked={status === 'never_return'} />
                            <span><strong>D.</strong> Never to return</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ── SEMESTER AVERAGES ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
                  SEMESTER AVERAGES
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1, padding: '6px 12px', borderRight: '0.5px solid #ccc' }}>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '2px 0' }}>Semester 1 Average</td>
                          <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>
                            {s1Avg !== null ? (isKg ? (scoreToLetter(s1Avg, 100) ?? '') : `${s1Avg}%`) : ''}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 0' }}>Semester 2 Average</td>
                          <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>
                            {s2Avg !== null ? (isKg ? (scoreToLetter(s2Avg, 100) ?? '') : `${s2Avg}%`) : ''}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 0' }}>Class Position</td>
                          <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>
                            {report.hasIncomplete ? '--' : (() => {
                              if (isSemester) {
                                const rank = report.yearlyTotal?.class_rank;
                                const lastPeriod = isSem1 ? 'exam_s1' : 'exam_s2';
                                const count = report.periodCounts?.[lastPeriod];
                                return rank && count ? `${rank} / ${count}` : '-';
                              }
                              const pt = report.periodTotals?.get(period as any);
                              const count = report.periodCounts?.[period];
                              return pt?.class_rank && count ? `${pt.class_rank} / ${count}` : '-';
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ padding: '4px 0 0', fontSize: '10px', color: '#666', lineHeight: 1.5 }}>
                            {isKg ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                                {KG_SCALE.map((t) => (
                                  <span key={t.letter} style={{ whiteSpace: 'nowrap' }}>{t.letter} = {t.min}–{t.max}</span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                                <span style={{ whiteSpace: 'nowrap' }}>A = {rcSettings.grade_a_min}–100</span>
                                <span style={{ whiteSpace: 'nowrap' }}>B = {rcSettings.grade_b_min}–{rcSettings.grade_a_min - 1}</span>
                                <span style={{ whiteSpace: 'nowrap' }}>C = {rcSettings.grade_c_min}–{rcSettings.grade_b_min - 1}</span>
                                <span style={{ whiteSpace: 'nowrap' }}>F = 0–{rcSettings.grade_c_min - 1}</span>
                                <span style={{ whiteSpace: 'nowrap' }}>Pass: {rcSettings.pass_mark}%</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{
                    width: 180, background: navy, color: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 10, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', color: '#aab', letterSpacing: '1px', marginBottom: 4 }}>GENERAL AVERAGE</div>
                    <div style={{ fontSize: '40px', fontWeight: 800, color: gold, lineHeight: 1 }}>
                      {generalAvg !== null ? (isKg ? (scoreToLetter(generalAvg, 100) ?? '—') : `${generalAvg}%`) : '--'}
                    </div>
                    <div style={{ fontSize: '11px', color: gold, marginTop: 3 }}>
                      {generalAvg !== null
                        ? (isKg
                            ? (() => {
                                const kgL = scoreToLetter(generalAvg, 100);
                                const kgLabel = kgLabelFromSettings(kgL, rcSettings);
                                return kgL ? `Grade: ${kgL}${kgLabel ? ` — ${kgLabel}` : ''}` : '';
                              })()
                            : `Grade: ${letterGrade} — ${gradeLabel}`)
                        : ''}
                    </div>
                  </div>
                </div>

                {/* ── SIGNATURES ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 16px', borderTop: '1px solid #ccc', gap: 16 }}>
                  {/* Administrator (left) — admin signature image acts as watermark behind name */}
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#333', flex: 1, position: 'relative' }}>
                    {rcSettings.admin_signature_url && (
                      <img
                        src={rcSettings.admin_signature_url}
                        alt=""
                        style={{
                          position: 'absolute',
                          left: '50%',
                          bottom: 18,
                          transform: 'translateX(-50%)',
                          maxWidth: 140,
                          maxHeight: 60,
                          opacity: 0.35,
                          pointerEvents: 'none',
                          objectFit: 'contain',
                        }}
                      />
                    )}
                    <div style={{ borderBottom: '1px solid #333', width: 160, margin: '20px auto 2px', minHeight: 18, position: 'relative' }}>
                      <EditableField
                        value={inputs.administrator_name || rcSettings.default_administrator_name || ''}
                        onChange={setField('administrator_name')}
                        editable={editing}
                        placeholder="Name"
                        minHeight={18}
                        plain
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                      {rcSettings.administrator_role_label || 'Administrator'}
                    </div>
                    {rcSettings.administrator_subtitle && (
                      <div style={{ color: '#666', fontSize: '10px' }}>{rcSettings.administrator_subtitle}</div>
                    )}
                  </div>

                  {/* Official school seal (center) — only shown when uploaded */}
                  {rcSettings.seal_url && (
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={rcSettings.seal_url}
                        alt="Official school seal"
                        style={{ width: 72, height: 72, objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {/* Class Teacher (right) */}
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#333', flex: 1 }}>
                    <div style={{ borderBottom: '1px solid #333', width: 160, margin: '20px auto 2px', minHeight: 18 }}>
                      <EditableField
                        value={inputs.class_teacher_name || (report as any).classTeacherName || rcSettings.default_class_teacher_name || ''}
                        onChange={setField('class_teacher_name')}
                        editable={editing}
                        placeholder="Name"
                        minHeight={18}
                        plain
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                      {rcSettings.class_teacher_role_label || 'Class Teacher'}
                    </div>
                    {rcSettings.class_teacher_subtitle && (
                      <div style={{ color: '#666', fontSize: '10px' }}>{rcSettings.class_teacher_subtitle}</div>
                    )}
                  </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{ background: navy, color: '#fff', textAlign: 'center', fontSize: '10px', padding: '6px' }}>
                  {rcSettings.footer_note || 'Generated by SmartGrade School Management System | Confidential — For Student & Family Use Only'}
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="text-center py-8 text-muted-foreground">
            No report data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Shared cell styles — compact to fit on a single A4 page
const thBase: React.CSSProperties = {
  border: '0.5px solid #ccc', textAlign: 'center', padding: '4px 3px',
  fontSize: '11px', fontWeight: 700, background: '#2a3a8e', color: '#fff',
};

const tdBase: React.CSSProperties = {
  border: '0.5px solid #ccc', textAlign: 'center', padding: '4px 3px', fontSize: '12px',
  fontWeight: 700, color: '#111',
};
