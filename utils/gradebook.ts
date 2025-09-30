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
      return "text-green-700 bg-green-200";
    case "B":
    case "B+":
    case "B-":
      return "text-blue-700 bg-blue-200";
    case "C":
    case "C+":
    case "C-":
      return "text-yellow-700 bg-yellow-200";
    case "D":
    case "D+":
    case "D-":
      return "text-orange-700 bg-orange-200";
    case "F":
      return "text-red-700 bg-red-200";
    case "E":
      return "text-red-700 bg-red-200";
    case "P":
      return "text-green-700 bg-green-200";
    default:
      return "text-gray-700 bg-gray-200";
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

export function numericToLetterGrade(pct: number): string {
  if (!Number.isFinite(pct)) return 'N/A';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  if (pct >= 40) return 'F';
  return 'F';
}

export function parseWeightString(weight: string | undefined): number {
  if (!weight) return 0;
  const m = /([0-9]+(?:\.[0-9]+)?)%/.exec(weight.trim());
  return m ? parseFloat(m[1]) : 0;
}

const LETTER_GPA: Record<string, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
};

export function letterToGPA(letter: string): number | null {
  return LETTER_GPA[letter] ?? null;
}

export function percentToGPA(pct: number): number | null {
  const letter = numericToLetterGrade(pct);
  return letterToGPA(letter);
}
