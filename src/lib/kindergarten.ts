/**
 * Kindergarten grading utilities (Liberian letter system).
 *
 * Scale (out of 100):
 *   A+  95–100   Outstanding
 *   A   90–94    Excellent
 *   B+  85–89    Very Good
 *   B   80–84    Good
 *   C+  75–79    Above Average
 *   C   70–74    Average
 *   D   65–69    Below Average
 *   F   60–64    Failing (lowest acceptable entry)
 *   <60          Not allowed in the Liberian school system
 */

export type KgLetter = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";

export const KG_DEPARTMENT_NAME = "Kindergarten";

export const KG_SCALE: Array<{
  letter: KgLetter;
  min: number;
  max: number;
  label: string;
}> = [
  { letter: "A+", min: 95, max: 100, label: "Outstanding" },
  { letter: "A", min: 90, max: 94, label: "Excellent" },
  { letter: "B+", min: 85, max: 89, label: "Very Good" },
  { letter: "B", min: 80, max: 84, label: "Good" },
  { letter: "C+", min: 75, max: 79, label: "Above Average" },
  { letter: "C", min: 70, max: 74, label: "Average" },
  { letter: "D", min: 65, max: 69, label: "Below Average" },
  { letter: "F", min: 60, max: 64, label: "Failing" },
];

/** Convert a percentage (0–100) to a letter. Returns null if no valid score (<60 or missing). */
export const scoreToLetter = (
  score: number | null | undefined,
  maxPoints?: number,
): KgLetter | null => {
  if (score === null || score === undefined || isNaN(score)) return null;

  // Convert raw score to a 0–100 percentage if max is provided and ≠ 100.
  const pct =
    maxPoints && maxPoints > 0 && maxPoints !== 100
      ? (score / maxPoints) * 100
      : score;

  if (pct < 60) return null; // disallowed in Liberian system
  for (const tier of KG_SCALE) {
    if (pct >= tier.min && pct <= tier.max) return tier.letter;
  }
  if (pct > 100) return "A+";
  return null;
};

/** Tailwind text color class for a letter (uses semantic tokens). */
export const letterColorClass = (letter: KgLetter | null): string => {
  if (!letter) return "text-muted-foreground";
  if (letter === "A+" || letter === "A") return "text-emerald-600 dark:text-emerald-400";
  if (letter === "B+" || letter === "B") return "text-primary";
  if (letter === "C+" || letter === "C") return "text-amber-600 dark:text-amber-400";
  if (letter === "D") return "text-orange-600 dark:text-orange-400";
  return "text-destructive";
};

/** Check whether a class object (with .departments.name) belongs to Kindergarten. */
export const isKindergartenClass = (cls: any): boolean => {
  const name =
    cls?.departments?.name ??
    cls?.department?.name ??
    cls?.department_name ??
    "";
  return typeof name === "string" && name.trim().toLowerCase() === KG_DEPARTMENT_NAME.toLowerCase();
};
