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
import { isKindergartenClass, scoreToLetter, KG_SCALE, type KgLetter } from "@/lib/kindergarten";
import { useSchool } from "@/contexts/SchoolContext";
import {
  DEFAULT_REPORT_CARD_SETTINGS,
  gradeFromSettings,
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
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  multiline?: boolean;
  placeholder?: string;
  options?: string[];
  minHeight?: number;
}) => {
  const baseStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#222',
    border: '0.5px solid #ddd',
    padding: '4px 6px',
    borderRadius: 3,
    background: editable ? '#fff' : '#fafafa',
    margin: 0,
    minHeight: minHeight ?? 30,
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
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
  if (score >= 90) return { color: '#155724', fontWeight: 700 };
  if (score >= 75) return { color: '#1a3a6e', fontWeight: 600 };
  if (score >= 60) return { color: '#856404' };
  return { color: '#721c24' };
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

  const handlePrint = () => window.print();

  const getSemesterLabel = () => {
    switch (period) {
      case "yearly": return "1 & 2";
      case "semester1": return "1";
      case "semester2": return "2";
      default: return period.replace("p", "P").replace("exam_s", "Exam S");
    }
  };

  const getDepartmentLabel = () => {
    return className || "PRIMARY";
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

          // ============= KG (letter-only) report =============
          if (isKg) {
            const periodLabel = (() => {
              switch (period) {
                case 'yearly': return 'Final Year';
                case 'semester1': return 'Semester 1';
                case 'semester2': return 'Semester 2';
                case 'exam_s1': return 'Semester 1 Exam';
                case 'exam_s2': return 'Semester 2 Exam';
                case 'p1': return 'Period 1';
                case 'p2': return 'Period 2';
                case 'p3': return 'Period 3';
                case 'p4': return 'Period 4';
                case 'p5': return 'Period 5';
                case 'p6': return 'Period 6';
                default: return period;
              }
            })();

            // Compute one letter per subject for the selected period.
            const subjectLetters: Array<{ name: string; letter: KgLetter | null; pct: number | null }> =
              subjects.map((s: any) => {
                let total = 0;
                let max = 0;
                if (report.isSemesterReport) {
                  Object.values(s.periods || {}).forEach((p: any) => {
                    if (p && !p.noGrades && typeof p.score === 'number') {
                      total += p.score;
                      max += p.max ?? 0;
                    }
                  });
                } else {
                  total = s.total ?? 0;
                  max = s.max ?? 0;
                }
                if (!max || max <= 0) return { name: s.name, letter: null, pct: null };
                const pct = (total / max) * 100;
                return { name: s.name, letter: scoreToLetter(pct, 100), pct: Math.round(pct) };
              });

            return (
              <div>
                <div className="flex gap-2 justify-center py-3 print:hidden flex-wrap" style={{ background: '#e8eaf0' }}>
                  <Button onClick={handlePrint} size="sm" className="gap-2" style={{ background: navy, color: '#fff' }}>
                    <Printer className="h-4 w-4" /> Print / Save as PDF
                  </Button>
                  {canEdit && !editing && (
                    <Button onClick={() => setEditing(true)} size="sm" variant="outline" className="gap-2">
                      <Pencil className="h-4 w-4" /> Edit Teacher Inputs
                    </Button>
                  )}
                  {canEdit && editing && (
                    <>
                      <Button onClick={handleSave} size="sm" className="gap-2" disabled={saveMutation.isPending} style={{ background: '#16a34a', color: '#fff' }}>
                        <Save className="h-4 w-4" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Inputs'}
                      </Button>
                      <Button onClick={() => { setInputs(savedInputs ?? {}); setEditing(false); }} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>

                <div id="report-content" style={{ background: '#fff', color: '#111', fontSize: '12px', fontFamily: 'Arial, sans-serif', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #bbb' }}>
                  {/* Header */}
                  <div style={{ background: navy, color: '#fff', padding: '14px 18px', textAlign: 'center', borderBottom: `3px solid ${gold}` }}>
                    <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '1px' }}>KINDERGARTEN PROGRESS REPORT</h1>
                    <p style={{ fontSize: '11px', color: gold, margin: '4px 0 0' }}>
                      {report.student.classes?.academic_years?.year_name || '--'} • {periodLabel}
                    </p>
                  </div>

                  {/* Student info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #ccc' }}>
                    {[
                      ['Pupil Name', report.student.full_name],
                      ['Pupil ID', report.student.student_id],
                      ['Class', report.student.classes?.name || '--'],
                      ['Gender', report.student.gender || '--'],
                    ].map(([label, val], i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 12px', borderBottom: '0.5px solid #e5e5e5', borderRight: i % 2 === 0 ? '0.5px solid #ccc' : 'none' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#666', textTransform: 'uppercase', minWidth: 90 }}>{label}</span>
                        <span style={{ fontSize: '11px' }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Letter grades table */}
                  <div style={{ background: navy, color: '#fff', padding: '6px 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                    SUBJECT PROGRESS — {periodLabel.toUpperCase()}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thBase, background: navy, textAlign: 'left', paddingLeft: 10 }}>Subject / Activity</th>
                        <th style={{ ...thBase, background: gold, color: '#fff', width: 100 }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectLetters.length === 0 ? (
                        <tr><td colSpan={2} style={{ ...tdBase, padding: 16, color: '#999' }}>No subjects assigned to this class.</td></tr>
                      ) : subjectLetters.map((s, i) => (
                        <tr key={i}>
                          <td style={{ ...tdBase, textAlign: 'left', paddingLeft: 10, background: '#f9f9fc' }}>{s.name}</td>
                          <td style={{ ...tdBase, fontWeight: 700, fontSize: 16, color: s.letter ? (s.letter === 'F' ? '#721c24' : s.letter.startsWith('A') ? '#155724' : s.letter.startsWith('B') ? '#1a3a6e' : s.letter.startsWith('C') ? '#7d5a00' : '#a04a00') : '#999' }}>
                            {s.letter ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Legend */}
                  <div style={{ padding: '10px 12px', borderTop: '1px solid #ccc', background: '#fafafa' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Grading Legend</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 10 }}>
                      {KG_SCALE.map((t) => (
                        <div key={t.letter} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                          <strong style={{ minWidth: 24 }}>{t.letter}</strong>
                          <span style={{ color: '#555' }}>{t.min}–{t.max} · {t.label}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 9, color: '#888', margin: '6px 0 0' }}>Scores below 60 are not permitted in the Liberian school system.</p>
                  </div>

                  {/* Conduct */}
                  <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>CONDUCT & DEVELOPMENT</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid #ccc' }}>
                    {([
                      ['Behavior', 'behavior'],
                      ['Punctuality', 'punctuality'],
                      ['Participation', 'participation'],
                      ['Listening Skills', 'homework'],
                    ] as const).map(([label, key], i) => (
                      <div key={key} style={{ padding: '6px 10px', borderRight: i < 3 ? '0.5px solid #ccc' : 'none' }}>
                        <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>{label}</label>
                        <EditableField value={(inputs[key] as string) || ''} onChange={setField(key)} editable={editing} options={RATING_OPTIONS} minHeight={22} />
                      </div>
                    ))}
                  </div>

                  {/* Teacher remarks */}
                  <div style={{ background: navy, color: '#fff', padding: '5px 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>TEACHER REMARKS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '0.5px solid #ccc' }}>
                    <div style={{ padding: '8px 10px', borderRight: '0.5px solid #ccc' }}>
                      <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Teacher Comment</label>
                      <EditableField value={inputs.teacher_comment || ''} onChange={setField('teacher_comment')} editable={editing} multiline minHeight={70} placeholder="Overall remarks about the pupil..." />
                    </div>
                    <div>
                      <div style={{ padding: '8px 10px', borderBottom: '0.5px solid #ccc' }}>
                        <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Excels In</label>
                        <EditableField value={inputs.excels_in || ''} onChange={setField('excels_in')} editable={editing} multiline minHeight={28} placeholder="Strengths..." />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Can Improve In</label>
                        <EditableField value={inputs.can_improve_in || ''} onChange={setField('can_improve_in')} editable={editing} multiline minHeight={28} placeholder="Areas to work on..." />
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '12px 14px', borderTop: '1px solid #ccc' }}>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#333', minWidth: 140 }}>
                      <div style={{ borderBottom: '1px solid #333', width: 120, margin: '18px auto 4px', minHeight: 16 }}>
                        <EditableField value={inputs.administrator_name || ''} onChange={setField('administrator_name')} editable={editing} placeholder="Name" minHeight={16} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Administrator</div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#333', minWidth: 140 }}>
                      <div style={{ borderBottom: '1px solid #333', width: 120, margin: '18px auto 4px', minHeight: 16 }}>
                        <EditableField value={inputs.class_teacher_name || ''} onChange={setField('class_teacher_name')} editable={editing} placeholder="Name" minHeight={16} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Class Teacher</div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#333' }}>
                      <div style={{ borderBottom: '1px solid #333', width: 80, margin: '18px auto 4px' }} />
                      <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Parent / Guardian</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          // ============= /KG branch =============

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
          const colAvg = (k: string): number | null => {
            if (subjects.length === 0) return null;
            const hasAny = subjects.some((s: any) => {
              const p = s.periods?.[k];
              return p && p.score !== null && p.score !== undefined && p.max > 0;
            });
            if (!hasAny) return null;
            return computeColumnAvg(subjects, k);
          };

          // Semester averages include the exam (4 columns averaged equally) — only over available periods
          const s1Avg = avgOf([colAvg('p1'), colAvg('p2'), colAvg('p3'), colAvg('exam_s1')]);
          const s2Avg = avgOf([colAvg('p4'), colAvg('p5'), colAvg('p6'), colAvg('exam_s2')]);

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
                <Button onClick={handlePrint} size="sm" className="gap-2" style={{ background: navy, color: '#fff' }}>
                  <Printer className="h-4 w-4" /> Print / Save as PDF
                </Button>
                <Button onClick={handlePrint} size="sm" className="gap-2" style={{ background: gold, color: '#fff' }}>
                  <Download className="h-4 w-4" /> Download PDF
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
                  const logo = rcSettings.logo_url || school?.logo_url || null;
                  return (
                    <div style={{ background: navy, color: '#fff', display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '14px' }}>
                      {logo ? (
                        <img
                          src={logo}
                          alt="School logo"
                          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${gold}`, background: '#fff', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '9px', color: navy, textAlign: 'center', lineHeight: 1.2,
                          border: `2px solid ${gold}`, flexShrink: 0,
                        }}>
                          SCHOOL<br />LOGO
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {headerTitle.toUpperCase()}
                        </h1>
                        {rcSettings.header_subtitle && (
                          <p style={{ fontSize: '10px', color: gold, margin: '2px 0 0', fontStyle: 'italic' }}>
                            {rcSettings.header_subtitle}
                          </p>
                        )}
                        {headerAddress && (
                          <p style={{ fontSize: '11px', color: '#ccd', margin: 0 }}>
                            {headerAddress}{headerContact ? ` | ${headerContact}` : ''}
                          </p>
                        )}
                        {headerWebsite && (
                          <p style={{ fontSize: '11px', color: '#ccd', margin: 0 }}>{headerWebsite}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{
                          background: gold, color: '#fff', textAlign: 'center', padding: '4px 10px',
                          fontSize: '10px', fontWeight: 700, borderRadius: '3px', minWidth: '80px'
                        }}>
                          <small style={{ display: 'block', fontSize: '8px', fontWeight: 400, opacity: 0.85, letterSpacing: '0.5px' }}>REPORT TYPE</small>
                          {getDepartmentLabel().toUpperCase()}
                        </div>
                        <div style={{
                          background: gold, color: '#fff', textAlign: 'center', padding: '4px 10px',
                          fontSize: '10px', fontWeight: 700, borderRadius: '3px', minWidth: '80px'
                        }}>
                          <small style={{ display: 'block', fontSize: '8px', fontWeight: 400, opacity: 0.85, letterSpacing: '0.5px' }}>SEMESTER</small>
                          {getSemesterLabel()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── TITLE BAR ── */}
                <div style={{ background: navy, textAlign: 'center', padding: '8px', borderTop: `2px solid ${gold}` }}>
                  <h2 style={{ color: '#fff', fontSize: '14px', letterSpacing: '2px', fontWeight: 700, margin: 0 }}>
                    ACADEMIC REPORT CARD
                  </h2>
                  <p style={{ color: gold, fontSize: '10px', margin: 0 }}>
                    {report.student.classes?.academic_years?.year_name || '--'} School Year
                  </p>
                </div>

                {/* ── STUDENT INFO ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #ccc' }}>
                  {(() => {
                    const att = (report as any).attendance ?? { total: 0, present: 0, absent: 0 };
                    const teacherName = (report as any).classTeacherName || inputs.class_teacher_name || '--';
                    return [
                      ['Student Name', report.student.full_name],
                      ['Student ID', report.student.student_id],
                      ['Grade Level', report.student.classes?.name || '--'],
                      ['Class Teacher', teacherName],
                      ['Date of Birth', report.student.date_of_birth || '--'],
                      ['Days Present', `${att.present} / ${att.total}`],
                      ['Gender', report.student.gender || '--'],
                      ['Days Absent', String(att.absent)],
                    ];
                  })().map(([label, val], i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px',
                      borderBottom: '0.5px solid #e5e5e5',
                      borderRight: i % 2 === 0 ? '0.5px solid #ccc' : 'none',
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#666', textTransform: 'uppercase', minWidth: '90px' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#111' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* ── INCOMPLETE NOTICE ── */}
                {report.hasIncomplete && (
                  <div style={{ margin: '8px 10px', padding: '6px 10px', background: '#fff3cd', color: '#856404', fontSize: '10px', fontWeight: 600, border: '1px solid #ffeaa7', borderRadius: '3px' }}>
                    ⚠️ This student has incomplete grades (marked as "I"). Averages and rankings cannot be calculated until all grades are complete.
                  </div>
                )}

                {/* ── SECTION: GRADES ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  ACADEMIC PERFORMANCE — GRADES BY PERIOD
                </div>

                {/* ── GRADES TABLE ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11px' }}>
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
                          <td style={{ ...tdBase, textAlign: 'left', paddingLeft: 8, background: '#f9f9fc', color: '#111' }}>
                            {subject.name}
                          </td>
                          {isSemester && isYearly ? (
                            <>
                              {['p1','p2','p3'].map(p => (
                                <td key={p} style={{ ...tdBase, ...scoreColorStyle(subject.periods?.[p]?.score) }}>
                                  {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                </td>
                              ))}
                              <td style={{ ...tdBase, background: lightBlue, color: '#fff', fontWeight: 600 }}>
                                {displayScore(subject.periods?.exam_s1?.score, subject.periods?.exam_s1?.noGrades)}
                              </td>
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {s1avg !== null ? s1avg : '--'}
                              </td>
                              {['p4','p5','p6'].map(p => (
                                <td key={p} style={{ ...tdBase, ...scoreColorStyle(subject.periods?.[p]?.score) }}>
                                  {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                </td>
                              ))}
                              <td style={{ ...tdBase, background: lightBlue, color: '#fff', fontWeight: 600 }}>
                                {displayScore(subject.periods?.exam_s2?.score, subject.periods?.exam_s2?.noGrades)}
                              </td>
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {s2avg !== null ? s2avg : '--'}
                              </td>
                              <td style={{ ...tdBase, background: gold, color: '#fff', fontWeight: 700 }}>
                                {yavg !== null ? yavg : '--'}
                              </td>
                            </>
                          ) : isSemester ? (
                            <>
                              {(isSem1 ? ['p1','p2','p3','exam_s1'] : ['p4','p5','p6','exam_s2']).map(p => {
                                const isExam = p.startsWith('exam');
                                return (
                                  <td key={p} style={{
                                    ...tdBase,
                                    ...(isExam ? { background: lightBlue, color: '#fff', fontWeight: 600 } : scoreColorStyle(subject.periods?.[p]?.score))
                                  }}>
                                    {displayScore(subject.periods?.[p]?.score, subject.periods?.[p]?.noGrades)}
                                  </td>
                                );
                              })}
                              <td style={{ ...tdBase, background: '#1a5276', color: '#fff', fontWeight: 700 }}>
                                {(() => {
                                  const avg = computeSubjectSemAvg(subject, isSem1 ? ['p1','p2','p3'] : ['p4','p5','p6']);
                                  return avg !== null ? avg : '--';
                                })()}
                              </td>
                            </>
                          ) : (
                            <td style={{ ...tdBase, fontWeight: 700, color: subject.noGrades ? '#999' : subject.hasIncomplete ? '#721c24' : '#111' }}>
                              {subject.noGrades ? '--' : subject.hasIncomplete ? 'I' : subject.total}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* Aggregate / Average rows */}
                    {isSemester && isYearly && (
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
                                {['p1','p2','p3'].map(p => <td key={p} style={avgStyle}>{computeColumnAvg(subjects, p)}</td>)}
                                <td style={{ ...avgStyle, background: lightBlue, color: '#fff' }}>{computeColumnAvg(subjects, 'exam_s1')}</td>
                                <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{s1Avg ?? '--'}</td>
                                {['p4','p5','p6'].map(p => <td key={p} style={avgStyle}>{computeColumnAvg(subjects, p)}</td>)}
                                <td style={{ ...avgStyle, background: lightBlue, color: '#fff' }}>{computeColumnAvg(subjects, 'exam_s2')}</td>
                                <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{s2Avg ?? '--'}</td>
                                <td style={{ ...avgStyle, background: gold, color: '#fff' }}>{generalAvg ?? '--'}</td>
                              </>
                            );
                          })()}
                        </tr>
                      </>
                    )}

                    {/* Aggregate / Average — single semester (S1 or S2) */}
                    {isSemester && !isYearly && (() => {
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
                                  {computeColumnAvg(subjects, p)}
                                </td>
                              );
                            })}
                            <td style={{ ...avgStyle, background: '#1a5276', color: '#fff' }}>{semAvg ?? '--'}</td>
                          </tr>
                        </>
                      );
                    })()}

                    {/* Aggregate / Average — single period view */}
                    {!isSemester && subjects.length > 0 && (() => {
                      const aggStyle: React.CSSProperties = { ...tdBase, background: '#e8f0e8', fontWeight: 700, color: '#1a5226' };
                      const avgStyle: React.CSSProperties = { ...tdBase, background: '#fff3cd', fontWeight: 700, color: '#7d5a00' };
                      const totalSum = subjects.reduce((a: number, s: any) => a + (s.noGrades || s.hasIncomplete ? 0 : (s.total ?? 0)), 0);
                      const validSubjects = subjects.filter((s: any) => !s.noGrades && !s.hasIncomplete);
                      const avg = validSubjects.length > 0 ? Math.round(totalSum / validSubjects.length) : 0;
                      return (
                        <>
                          <tr>
                            <td style={{ ...aggStyle, textAlign: 'left', paddingLeft: 8 }}>Aggregate</td>
                            <td style={aggStyle}>{totalSum}</td>
                          </tr>
                          <tr>
                            <td style={{ ...avgStyle, textAlign: 'left', paddingLeft: 8 }}>Average</td>
                            <td style={avgStyle}>{avg}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>

                {/* ── CONDUCT ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  CONDUCT & CHARACTER ASSESSMENT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid #ccc' }}>
                  {([
                    ['Behavior', 'behavior'],
                    ['Punctuality', 'punctuality'],
                    ['Participation', 'participation'],
                    ['Homework', 'homework'],
                  ] as const).map(([label, key], i) => (
                    <div key={key} style={{ padding: '6px 10px', borderRight: i < 3 ? '0.5px solid #ccc' : 'none' }}>
                      <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>{label}</label>
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
                <div style={{ background: navy, color: '#fff', padding: '5px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  TEACHER REMARKS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '0.5px solid #ccc' }}>
                  <div style={{ padding: '8px 10px', borderRight: '0.5px solid #ccc' }}>
                    <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Teacher Comment</label>
                    <EditableField
                      value={inputs.teacher_comment || ''}
                      onChange={setField('teacher_comment')}
                      editable={editing}
                      multiline
                      minHeight={80}
                      placeholder="Overall remarks about the student..."
                    />
                  </div>
                  <div>
                    <div style={{ padding: '8px 10px', borderBottom: '0.5px solid #ccc' }}>
                      <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Can Improve In</label>
                      <EditableField
                        value={inputs.can_improve_in || ''}
                        onChange={setField('can_improve_in')}
                        editable={editing}
                        multiline
                        minHeight={32}
                        placeholder="Areas needing improvement..."
                      />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <label style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 4 }}>Excels In</label>
                      <EditableField
                        value={inputs.excels_in || ''}
                        onChange={setField('excels_in')}
                        editable={editing}
                        multiline
                        minHeight={32}
                        placeholder="Subjects/areas of strength..."
                      />
                    </div>
                  </div>
                </div>

                {/* ── PROMOTION STATUS (yearly only) ── */}
                {isYearly && (() => {
                  const grade = generalAvg;
                  const passed = grade !== null && grade >= rcSettings.pass_mark && !report.hasIncomplete;
                  const className = report.student.classes?.name || 'next class';
                  const nextClassMatch = className.match(/(\d+)/);
                  const nextLabel = nextClassMatch
                    ? className.replace(nextClassMatch[1], String(parseInt(nextClassMatch[1], 10) + 1))
                    : 'Next Class';
                  return (
                    <>
                      <div style={{ background: navy, color: '#fff', padding: '5px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                        PROMOTION STATUS
                      </div>
                      <div style={{ padding: '10px 14px', borderTop: '0.5px solid #ccc' }}>
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: 4,
                          border: `1px solid ${passed ? '#16a34a' : '#dc2626'}`,
                          background: passed ? '#e8f5e8' : '#fde8e8',
                          color: passed ? '#15803d' : '#991b1b',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}>
                          {report.hasIncomplete
                            ? '⚠ Promotion pending — incomplete grades on record'
                            : passed
                              ? `✓ Promoted to ${nextLabel}`
                              : `✗ Not promoted — must repeat ${className}`}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ── SEMESTER AVERAGES ── */}
                <div style={{ background: navy, color: '#fff', padding: '5px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  SEMESTER AVERAGES
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRight: '0.5px solid #ccc' }}>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      <tbody>
                        {(isYearly || isSem1) && (
                          <tr>
                            <td style={{ padding: '3px 0' }}>Semester 1 Average</td>
                            <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{s1Avg !== null ? `${s1Avg}%` : '--'}</td>
                          </tr>
                        )}
                        {(isYearly || isSem2) && (
                          <tr>
                            <td style={{ padding: '3px 0' }}>Semester 2 Average</td>
                            <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>{s2Avg !== null ? `${s2Avg}%` : '--'}</td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ padding: '3px 0' }}>Class Position</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700 }}>
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
                          <td colSpan={2} style={{ padding: '3px 0', fontSize: '10px', color: '#666' }}>
                            A = {rcSettings.grade_a_min}–100 &nbsp;|&nbsp; B = {rcSettings.grade_b_min}–{rcSettings.grade_a_min - 1} &nbsp;|&nbsp; C = {rcSettings.grade_c_min}–{rcSettings.grade_b_min - 1} &nbsp;|&nbsp; D = {rcSettings.grade_d_min}–{rcSettings.grade_c_min - 1} &nbsp;|&nbsp; Pass: {rcSettings.pass_mark}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{
                    width: 200, background: navy, color: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 14, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', color: '#aab', letterSpacing: '1px', marginBottom: 4 }}>GENERAL AVERAGE</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: gold }}>
                      {generalAvg !== null ? `${generalAvg}%` : '--'}
                    </div>
                    <div style={{ fontSize: '12px', color: gold }}>
                      {generalAvg !== null ? `Grade: ${letterGrade} — ${gradeLabel}` : ''}
                    </div>
                  </div>
                </div>

                {/* ── SIGNATURES ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '10px 14px', borderTop: '1px solid #ccc' }}>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#333', minWidth: 140 }}>
                    <div style={{ borderBottom: '1px solid #333', width: 120, margin: '18px auto 4px', minHeight: 16 }}>
                      <EditableField
                        value={inputs.administrator_name || rcSettings.default_administrator_name || ''}
                        onChange={setField('administrator_name')}
                        editable={editing}
                        placeholder="Name"
                        minHeight={16}
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Administrator</div>
                    <div style={{ color: '#888' }}>School Sponsor</div>
                  </div>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%', border: `2px solid ${gold}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8px', color: gold, textAlign: 'center', fontWeight: 700, lineHeight: 1.2,
                  }}>
                    OFFICIAL<br />SCHOOL<br />SEAL
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#333', minWidth: 140 }}>
                    <div style={{ borderBottom: '1px solid #333', width: 120, margin: '18px auto 4px', minHeight: 16 }}>
                      <EditableField
                        value={inputs.class_teacher_name || (report as any).classTeacherName || rcSettings.default_class_teacher_name || ''}
                        onChange={setField('class_teacher_name')}
                        editable={editing}
                        placeholder="Name"
                        minHeight={16}
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Class Teacher</div>
                    <div style={{ color: '#888' }}>Teacher Signature</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#333' }}>
                    <div style={{ borderBottom: '1px solid #333', width: 80, margin: '18px auto 4px' }} />
                    <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Parent / Guardian</div>
                    <div style={{ color: '#888' }}>Acknowledgement</div>
                  </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{ background: navy, color: '#fff', textAlign: 'center', fontSize: '9px', padding: '4px' }}>
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

// Shared cell styles
const thBase: React.CSSProperties = {
  border: '0.5px solid #ccc', textAlign: 'center', padding: '4px 2px',
  fontSize: '10px', fontWeight: 600, background: '#2a3a8e', color: '#fff',
};

const tdBase: React.CSSProperties = {
  border: '0.5px solid #ccc', textAlign: 'center', padding: '4px 2px', fontSize: '11px',
};
