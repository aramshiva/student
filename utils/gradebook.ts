export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
    case "A+":
    case "A-":
      return "text-green-700 bg-green-200 dark:text-green-300 dark:bg-green-800";
    case "B":
    case "B+":
    case "B-":
      return "text-blue-700 bg-blue-200 dark:text-blue-300 dark:bg-blue-800";
    case "C":
    case "C+":
    case "C-":
      return "text-yellow-700 bg-yellow-200 dark:text-yellow-300 dark:bg-yellow-800";
    case "D":
    case "D+":
    case "D-":
      return "text-orange-700 bg-orange-200 dark:text-orange-300 dark:bg-orange-800";
    case "F":
      return "text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-800";
    case "E":
      return "text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-800";
    case "P":
      return "text-green-700 bg-green-200 dark:text-green-300 dark:bg-green-800";
    default:
      return "text-gray-700 bg-gray-200 dark:text-gray-300 dark:bg-gray-700";
  }
}

export function getCourseIcon(imageType: string): string {
  switch (imageType.toLowerCase()) {
    case "math":
      return "📊";
    case "science":
      return "🔬";
    case "social":
      return "🌍";
    case "phyeducation":
      return "⚽";
    case "language":
      return "🌐";
    case "art":
    case "arts":
      return "🎨";
    case "music":
      return "🎵";
    default:
      return "📖";
  }
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}

export interface GradeBound {
  letter: string;
  min: number;
}
const DEFAULT_GRADE_BOUNDS: GradeBound[] = [
  { letter: "A", min: 93 },
  { letter: "A-", min: 90 },
  { letter: "B+", min: 87 },
  { letter: "B", min: 83 },
  { letter: "B-", min: 80 },
  { letter: "C+", min: 77 },
  { letter: "C", min: 73 },
  { letter: "C-", min: 70 },
  { letter: "D+", min: 67 },
  { letter: "D", min: 60 },
  { letter: "F", min: 40 },
];

const GRADE_BOUNDS_STORAGE_KEY = "studentvue-custom-grade-bounds";

export function loadCustomGradeBounds(): GradeBound[] {
  if (typeof window === "undefined") return [...DEFAULT_GRADE_BOUNDS];
  try {
    const raw = localStorage.getItem(GRADE_BOUNDS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_GRADE_BOUNDS];
    const parsed = JSON.parse(raw) as GradeBound[];
    if (!Array.isArray(parsed) || !parsed.length)
      return [...DEFAULT_GRADE_BOUNDS];
    const cleaned = parsed
      .filter(
        (p) =>
          p &&
          typeof p.letter === "string" &&
          typeof p.min === "number" &&
          !isNaN(p.min),
      )
      .sort((a, b) => b.min - a.min);
    if (!cleaned.some((c) => c.letter === "F"))
      cleaned.push({ letter: "F", min: 0 });
    return cleaned;
  } catch {
    return [...DEFAULT_GRADE_BOUNDS];
  }
}

export function saveCustomGradeBounds(bounds: GradeBound[]) {
  if (typeof window === "undefined") return;
  try {
    const sanitized = bounds
      .filter(
        (b) =>
          b &&
          typeof b.letter === "string" &&
          typeof b.min === "number" &&
          !isNaN(b.min),
      )
      .sort((a, b) => b.min - a.min);
    localStorage.setItem(GRADE_BOUNDS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {}
}

export function resetCustomGradeBounds() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GRADE_BOUNDS_STORAGE_KEY);
  } catch {}
}

export function numericToLetterGrade(pct: number): string {
  if (!Number.isFinite(pct)) return "N/A";
  const bounds = loadCustomGradeBounds();
  for (const b of bounds) {
    if (pct >= b.min) return b.letter;
  }
  return bounds[bounds.length - 1]?.letter || "F";
}

export function parseWeightString(weight: string | undefined): number {
  if (!weight) return 0;
  const m = /([0-9]+(?:\.[0-9]+)?)%/.exec(weight.trim());
  return m ? parseFloat(m[1]) : 0;
}

const DEFAULT_LETTER_GPA: Record<string, number> = {
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0,
};
const GPA_STORAGE_KEY = "studentvue-custom-gpa-scale";

export type GPAScaleEntry = { letter: string; value: number };

export function loadCustomGPAScale(): Record<string, number> {
  if (typeof window === "undefined") return { ...DEFAULT_LETTER_GPA };
  try {
    const raw = localStorage.getItem(GPA_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LETTER_GPA };
    const parsed = JSON.parse(raw) as GPAScaleEntry[];
    const map: Record<string, number> = {};
    for (const e of parsed) {
      if (e && typeof e.letter === "string" && typeof e.value === "number") {
        map[e.letter] = e.value;
      }
    }
    for (const k of Object.keys(DEFAULT_LETTER_GPA)) {
      if (!(k in map)) map[k] = DEFAULT_LETTER_GPA[k];
    }
    return map;
  } catch {
    return { ...DEFAULT_LETTER_GPA };
  }
}

export function saveCustomGPAScale(entries: GPAScaleEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GPA_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function resetCustomGPAScale() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GPA_STORAGE_KEY);
  } catch {}
}

export function letterToGPA(letter: string): number | null {
  const scale = loadCustomGPAScale();
  return scale[letter] ?? null;
}

export function percentToGPA(pct: number): number | null {
  const letter = numericToLetterGrade(pct);
  return letterToGPA(letter);
}
const CALC_GRADES_STORAGE_KEY = "studentvue-calc-grades";

export function loadCalculateGradesEnabled(): boolean {
  if (typeof window === "undefined") return false; // default off
  try {
    const raw = localStorage.getItem(CALC_GRADES_STORAGE_KEY);
    if (raw === null) return false;
    return raw === "1";
  } catch {
    return false;
  }
}

export function saveCalculateGradesEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CALC_GRADES_STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

export function resetCalculateGradesEnabled() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CALC_GRADES_STORAGE_KEY);
  } catch {}
}
