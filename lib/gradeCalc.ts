import type {
  Assignment as SynergyAssignment,
  Course as SynergyCourse,
  Mark as SynergyMark,
  AssignmentGradeCalc as SynergyAssignmentGradeCalc,
} from "@/types/gradebook";

export interface Category {
  name: string;
  weightPercentage: number;
  pointsEarned: number;
  pointsPossible: number;
  weightedPercentage: number;
  gradeLetter: string;
}

export interface AssignmentBase {
  name: string;
  id: string | undefined;
  pointsEarned: number | undefined;
  pointsPossible: number | undefined;
  unscaledPoints: { pointsEarned: number; pointsPossible: number } | undefined;
  extraCredit: boolean;
  gradePercentageChange: number | undefined;
  notForGrade: boolean;
  hidden: boolean;
  category: string | undefined;
  date: Date;
  comments?: string;
}

export interface RealAssignment extends AssignmentBase {
  id: string;
  hidden: false;
  category: string;
}

export interface HiddenAssignment extends AssignmentBase {
  id: undefined;
  pointsEarned: number;
  pointsPossible: number;
  unscaledPoints: undefined;
  extraCredit: false;
  notForGrade: false;
  hidden: true;
  category: string;
}

export type Calculable<T extends AssignmentBase> = T & {
  pointsEarned: number;
  pointsPossible: number;
  notForGrade: false;
  category: string;
};

export type Flowed<T extends AssignmentBase> = Calculable<T> & {
  gradePercentageChange: number;
};

interface PointsByCategory {
  [categoryName: string]: {
    pointsEarned: number;
    pointsPossible: number;
  };
}

export function calculateGradePercentage(pointsEarned: number, pointsPossible: number) {
  let gradePercentage = (pointsEarned / pointsPossible) * 100;
  if (isNaN(gradePercentage)) gradePercentage = 0;
  return gradePercentage;
}

// Optimized: iterate over known gradeCategories instead of all entries in pointsByCategory,
// skip categories with no pointsPossible, remove unnecessary console noise & redundant math.
export function calculateCourseGradePercentageFromCategories(
  pointsByCategory: PointsByCategory,
  gradeCategories: Category[],
): number {
  if (!gradeCategories.length) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const cat of gradeCategories) {
    const pts = pointsByCategory[cat.name];
    if (!pts || pts.pointsPossible <= 0) continue;
    weightedSum += (pts.pointsEarned / pts.pointsPossible) * cat.weightPercentage;
    totalWeight += cat.weightPercentage;
  }
  if (totalWeight <= 0) return 0;
  const gradePercentage = (weightedSum / totalWeight) * 100;
  return Number.isFinite(gradePercentage) ? gradePercentage : 0;
}

export function getAssignmentPointTotals<T extends AssignmentBase>(assignments: Calculable<T>[]) {
  let pointsEarned = 0;
  let pointsPossible = 0;

  assignments.forEach((assignment) => {
    const { pointsEarned: earned, pointsPossible: possible, extraCredit } = assignment;
    pointsEarned += earned;
    if (!extraCredit) pointsPossible += possible;
  });

  return { pointsEarned, pointsPossible };
}

export function calculateCourseGradePercentageFromTotals<T extends AssignmentBase>(assignments: Calculable<T>[]) {
  const { pointsEarned, pointsPossible } = getAssignmentPointTotals(assignments);
  return calculateGradePercentage(pointsEarned, pointsPossible);
}

function flowAssignmentFromTotals<T extends AssignmentBase>(
  assignment: Calculable<T>,
  totalPointsEarned: number,
  totalPointsPossible: number,
): { assignment: Flowed<T>; totalPointsEarned: number; totalPointsPossible: number } {
  const priorGrade = calculateGradePercentage(totalPointsEarned, totalPointsPossible);
  if (!assignment.extraCredit) totalPointsPossible += assignment.pointsPossible;
  totalPointsEarned += assignment.pointsEarned;
  const afterGrade = calculateGradePercentage(totalPointsEarned, totalPointsPossible);
  return {
    assignment: { ...assignment, gradePercentageChange: afterGrade - priorGrade },
    totalPointsEarned,
    totalPointsPossible,
  };
}

function flowAssignmentFromCategories<T extends AssignmentBase>(
  assignment: Calculable<T>,
  pointsByCategory: PointsByCategory,
  gradeCategories: Category[],
): { assignment: Flowed<T>; pointsByCategory: PointsByCategory } {
  const priorGrade = calculateCourseGradePercentageFromCategories(pointsByCategory, gradeCategories);
  const existing = pointsByCategory[assignment.category] || { pointsEarned: 0, pointsPossible: 0 };
  pointsByCategory[assignment.category] = {
    pointsEarned: existing.pointsEarned + assignment.pointsEarned,
    pointsPossible: existing.pointsPossible + (assignment.extraCredit ? 0 : assignment.pointsPossible),
  };
  const afterGrade = calculateCourseGradePercentageFromCategories(pointsByCategory, gradeCategories);
  return {
    assignment: { ...assignment, gradePercentageChange: afterGrade - priorGrade },
    pointsByCategory,
  };
}

export function calculateAssignmentGPCsFromCategories<T extends AssignmentBase>(assignments: T[], gradeCategories: Category[]) {
  const out: (T | Flowed<T>)[] = new Array(assignments.length);
  let pointsByCategory: PointsByCategory = {};
  for (let i = assignments.length - 1; i >= 0; i--) {
    const assignment = assignments[i];
    const { pointsEarned, pointsPossible, notForGrade, category } = assignment as AssignmentBase;
    if (pointsEarned === undefined || pointsPossible === undefined || notForGrade || category === undefined) {
      out[i] = assignment;
      continue;
    }
    const calculable: Calculable<T> = {
      ...(assignment as T),
      pointsEarned,
      pointsPossible,
      notForGrade: false,
      category: category as string,
    };
    const flowed = flowAssignmentFromCategories(calculable, pointsByCategory, gradeCategories);
    pointsByCategory = flowed.pointsByCategory;
    out[i] = flowed.assignment;
  }
  return out;
}

export function calculateAssignmentGPCsFromTotals<T extends AssignmentBase>(assignments: T[]) {
  const out: (T | Flowed<T>)[] = new Array(assignments.length);
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;
  for (let i = assignments.length - 1; i >= 0; i--) {
    const assignment = assignments[i];
    const { pointsEarned, pointsPossible, notForGrade, category } = assignment as AssignmentBase;
    if (pointsEarned === undefined || pointsPossible === undefined || notForGrade || category === undefined) {
      out[i] = assignment;
      continue;
    }
    const calculable: Calculable<T> = {
      ...(assignment as T),
      pointsEarned,
      pointsPossible,
      notForGrade: false,
      category: category as string,
    };
    const flowed = flowAssignmentFromTotals(calculable, totalPointsEarned, totalPointsPossible);
    totalPointsEarned = flowed.totalPointsEarned;
    totalPointsPossible = flowed.totalPointsPossible;
    out[i] = flowed.assignment;
  }
  return out;
}

export function calculateAssignmentGPCs<T extends AssignmentBase>(assignments: T[], gradeCategories?: Category[]) {
  if (gradeCategories === undefined) {
    return calculateAssignmentGPCsFromTotals(assignments);
  }
  return calculateAssignmentGPCsFromCategories(assignments, gradeCategories);
}

export function getHiddenAssignmentsFromCategories(categories: Category[], pointsByCategory: PointsByCategory) {
  return categories
    .filter((category) => {
      const categoryPoints = pointsByCategory[category.name];
      if (categoryPoints === undefined) return false;
      return (
        category.pointsEarned !== categoryPoints.pointsEarned ||
        category.pointsPossible !== categoryPoints.pointsPossible
      );
    })
    .map((category) => {
      const categoryPoints = pointsByCategory[category.name];
      if (categoryPoints === undefined) return null;

      const { pointsEarned, pointsPossible } = categoryPoints;
      const hiddenPointsEarned = category.pointsEarned - pointsEarned;
      const hiddenPointsPossible = category.pointsPossible - pointsPossible;

      const priorGrade = calculateCourseGradePercentageFromCategories(pointsByCategory, categories);
      pointsByCategory[category.name] = {
        pointsEarned: pointsEarned + hiddenPointsEarned,
        pointsPossible: pointsPossible + hiddenPointsPossible,
      };
      const afterGrade = calculateCourseGradePercentageFromCategories(pointsByCategory, categories);
      const gradePercentageChange = afterGrade - priorGrade;

      if (Math.abs(gradePercentageChange) < 0.0001) return null;

      const hiddenAssignment: Flowed<HiddenAssignment> = {
        name: `Hidden ${category.name} Assignments`,
        id: undefined,
        pointsEarned: hiddenPointsEarned,
        pointsPossible: hiddenPointsPossible,
        unscaledPoints: undefined,
        extraCredit: false,
        gradePercentageChange,
        notForGrade: false,
        hidden: true,
        category: category.name,
        date: new Date(),
      };

      return hiddenAssignment;
    })
    .filter((x) => x !== null) as Flowed<HiddenAssignment>[];
}

export function getPointsByCategory<T extends AssignmentBase>(assignments: Calculable<T>[]) {
  const pointsByCategory: PointsByCategory = {};
  for (const a of assignments) {
    const existing = pointsByCategory[a.category] || { pointsEarned: 0, pointsPossible: 0 };
    pointsByCategory[a.category] = {
      pointsEarned: existing.pointsEarned + a.pointsEarned,
      pointsPossible: existing.pointsPossible + (a.extraCredit ? 0 : a.pointsPossible),
    };
  }
  return pointsByCategory;
}

function countDecimalPlaces(num: number) {
  const numStr = num.toString();
  const decimalIndex = numStr.indexOf(".");
  if (decimalIndex === -1) return 0;
  return numStr.length - decimalIndex - 1;
}

function roundToPrecision(num: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

function floorToPrecision(num: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.floor(num * factor) / factor;
}

export function gradesMatch(rawGrade: number, expectedGrade: number) {
  const leastPrecision = Math.min(countDecimalPlaces(rawGrade), countDecimalPlaces(expectedGrade));
  const roundedMatches = roundToPrecision(rawGrade, leastPrecision) === roundToPrecision(expectedGrade, leastPrecision);
  const flooredMatches = floorToPrecision(rawGrade, leastPrecision) === floorToPrecision(expectedGrade, leastPrecision);
  return roundedMatches || flooredMatches;
}

export function getSynergyCourseAssignmentCategories(course: SynergyCourse) {
  const marks = course?.Marks;
  const mark: SynergyMark | undefined = Array.isArray(marks?.Mark)
    ? (marks!.Mark as SynergyMark[])[(marks!.Mark as SynergyMark[]).length - 1]
    : (marks?.Mark as SynergyMark | undefined);
  const gradeCalcSummary = mark?.GradeCalculationSummary;
  if (typeof gradeCalcSummary === "string" || !gradeCalcSummary?.AssignmentGradeCalc) return undefined;

  const categories: Category[] = (gradeCalcSummary.AssignmentGradeCalc as SynergyAssignmentGradeCalc[]).map(
    (category) => ({
      name: category._Type,
      weightPercentage: parseFloat(category._Weight),
      pointsEarned: parseFloat(category._Points),
      pointsPossible: parseFloat(category._PointsPossible),
      weightedPercentage: parseFloat(category._WeightedPct),
      gradeLetter: category._CalculatedMark,
    }),
  );

  return categories;
}

export function getCalculableAssignments<T extends AssignmentBase>(assignments: T[]) {
  return assignments
    .map((assignment) => {
      const { pointsEarned, pointsPossible, notForGrade, category } = assignment;
      if (pointsEarned === undefined || pointsPossible === undefined || notForGrade || category === undefined)
        return null;
      const calculable: Calculable<T> = {
        ...(assignment as T),
        pointsEarned,
        pointsPossible,
        notForGrade: false,
        category: category as string,
      };
      return calculable;
    })
    .filter((a) => a !== null) as Calculable<T>[];
}

export function parseSynergyAssignment(synergyAssignment: SynergyAssignment): RealAssignment {
  const { _Date, _Measure, _Notes, _Point, _PointPossible, _Points, _ScoreCalValue, _ScoreMaxValue, _Type } = synergyAssignment;

  const pointsEarned = _Point !== undefined ? (_Point === "" ? 0 : parseFloat(_Point)) : undefined;

  const pointsPossible =
    _PointPossible !== undefined && _PointPossible !== ""
      ? parseFloat(_PointPossible)
      : _ScoreMaxValue !== undefined
      ? parseFloat(_ScoreMaxValue)
      : _Points === "Points Possible"
      ? undefined
      : parseFloat((_Points || "").split(" Points Possible")[0]);

  const pointsEarnedIsScaled = _Point !== undefined && _Point !== "" && _ScoreCalValue !== undefined && _Point !== _ScoreCalValue;
  const pointsPossibleIsScaled = _PointPossible !== undefined && _PointPossible !== "" && _ScoreMaxValue !== undefined && _PointPossible !== _ScoreMaxValue;

  let unscaledPoints: { pointsEarned: number; pointsPossible: number } | undefined = undefined;
  if ((pointsEarnedIsScaled || pointsPossibleIsScaled) && _ScoreCalValue !== undefined && _ScoreMaxValue !== undefined) {
    unscaledPoints = { pointsEarned: parseFloat(_ScoreCalValue), pointsPossible: parseFloat(_ScoreMaxValue) };
  }

  const notesFormatted = (_Notes || "").replace("(Not For Grading)", "");

  const assignment: RealAssignment = {
    name: _Measure,
    id: synergyAssignment._GradebookID,
    pointsEarned,
    pointsPossible,
    unscaledPoints,
    extraCredit: _PointPossible === "",
    gradePercentageChange: undefined,
    notForGrade: (_Notes || "").includes("(Not For Grading)"),
    hidden: false,
    category: _Type,
    date: new Date(_Date),
    comments: notesFormatted && notesFormatted.length > 0 ? notesFormatted : undefined,
  };

  return assignment;
}
