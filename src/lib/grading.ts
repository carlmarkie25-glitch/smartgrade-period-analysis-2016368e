const toFiniteNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isMissingGrade = (score: number | string | null | undefined): boolean => {
  return toFiniteNumber(score) === null;
};

export const getAggregatePercentage = (
  totalScore: number | string | null | undefined,
  totalMax: number | string | null | undefined,
): number | null => {
  const max = toFiniteNumber(totalMax);
  if (max === null || max <= 0) return null;

  const score = toFiniteNumber(totalScore) ?? 0;
  return (score / max) * 100;
};

export const isAggregateIncomplete = (
  totalScore: number | string | null | undefined,
  totalMax: number | string | null | undefined,
  hasMissing: boolean,
): boolean => {
  if (hasMissing) return true;

  const percentage = getAggregatePercentage(totalScore, totalMax);
  if (percentage === null) return true;

  return percentage < 60;
};