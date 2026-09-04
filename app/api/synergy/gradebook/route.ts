import { synergyRoute } from "@/lib/synergyRoute";
import type {
  Assignment,
  AssignmentGradeCalc,
  Course,
  GradebookRoot,
  Mark,
  ReportPeriod,
} from "@/types/gradebook";

export const runtime = "nodejs";

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = (v: unknown): Dict[] =>
  Array.isArray(v) ? v.filter(isDict) : isDict(v) ? [v] : [];

const optStr = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

const str = (v: unknown): string => optStr(v) ?? "";

const boolStr = (v: unknown): string => (v ? "true" : "false");

const pick = (obj: Dict, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
};

function parseAssignment(a: Dict): Assignment {
  return {
    _GradebookID: str(pick(a, "gradebookID", "gradebookId")),
    _Measure: str(a.measure),
    _Type: str(a.type),
    _Date: str(a.date),
    _DueDate: str(a.dueDate),
    _Score: optStr(a.score),
    _DisplayScore: str(a.displayScore),
    _ScoreCalValue: optStr(a.scoreCalValue),
    _ScoreMaxValue: optStr(a.scoreMaxValue),
    _ScoreType: str(a.scoreType),
    _Points: str(a.points),
    _Point: optStr(a.point),
    _PointPossible: optStr(a.pointPossible),
    _Notes: str(a.notes),
    _MeasureDescription: str(a.measureDescription),
    _TeacherID: str(pick(a, "teacherID", "teacherId")),
    _StudentID: str(pick(a, "studentID", "studentId")),
    _TimeSincePost: str(a.timeSincePost),
    _TotalSecondsSincePost: str(a.totalSecondsSincePost),
    _HasDropBox: boolStr(a.hasDropBox),
    _DropStartDate: str(a.dropStartDate),
    _DropEndDate: str(a.dropEndDate),
    Resources: (a.resources as Assignment["Resources"]) ?? {},
    Standards: (a.standards as Assignment["Standards"]) ?? {},
  };
}

function parseGradeCalc(c: Dict): AssignmentGradeCalc {
  return {
    _Type: str(c.type),
    _Weight: str(c.weight),
    _Points: str(c.points),
    _PointsPossible: str(pick(c, "pointsPossible", "pointPossible")),
    _WeightedPct: str(pick(c, "weightedPct", "weightedPercentage")),
    _CalculatedMark: str(pick(c, "calculatedMark", "calculatedScoreString")),
  };
}

function parseMark(m: Dict): Mark {
  return {
    _MarkName: str(m.markName),
    _ShortMarkName: str(m.shortMarkName),
    _CalculatedScoreString: str(m.calculatedScoreString),
    _CalculatedScoreRaw: str(m.calculatedScoreRaw),
    Assignments: { Assignment: asArray(m.assignments).map(parseAssignment) },
    AssignmentsSinceLastAccess: {
      Assignment: asArray(m.assignmentsSinceLastAccess).map(parseAssignment),
    },
    GradeCalculationSummary: {
      AssignmentGradeCalc: asArray(m.gradeCalculationSummary).map(
        parseGradeCalc,
      ),
    },
    StandardViews: (m.standardViews as Mark["StandardViews"]) ?? {},
  };
}

function parseCourse(c: Dict): Course {
  return {
    _Period: str(c.period),
    _Title: str(c.title),
    _CourseName: str(c.courseName),
    _CourseID: str(pick(c, "courseID", "courseId")),
    _Room: str(c.room),
    _Staff: str(c.staff),
    _StaffEMail: str(pick(c, "staffEMail", "staffEmail")),
    _StaffGU: str(pick(c, "staffGU", "staffGu")),
    _ImageType: str(c.imageType),
    _HighlightPercentageCutOffForProgressBar: str(
      c.highlightPercentageCutOffForProgressBar,
    ),
    _UsesRichContent: boolStr(c.usesRichContent),
    Marks: { Mark: asArray(c.marks).map(parseMark) },
  };
}

function parseReportPeriod(p: Dict): ReportPeriod {
  return {
    _Index: str(p.index),
    _GradePeriod: str(p.gradePeriod),
    _StartDate: str(p.startDate),
    _EndDate: str(p.endDate),
  };
}

export function parseGradebook(raw: unknown): GradebookRoot {
  const gb = isDict(raw) ? raw : {};
  const current = isDict(gb.reportingPeriod)
    ? parseReportPeriod(gb.reportingPeriod)
    : undefined;

  return {
    "@Type": str(gb.type),
    "@ErrorMessage": str(gb.errorMessage),
    "@HideStandardGraphInd": !!gb.hideStandardGraphInd,
    "@HideMarksColumnElementary": !!gb.hideMarksColumnElementary,
    "@HidePointsColumnElementary": !!gb.hidePointsColumnElementary,
    "@HidePercentSecondary": !!gb.hidePercentSecondary,
    "@DisplayStandardsData": !!gb.displayStandardsData,
    "@GBStandardsTabDefault": !!gb.gbStandardsTabDefault,
    ReportingPeriods: {
      ReportPeriod: asArray(gb.reportingPeriods).map(parseReportPeriod),
    },
    ...(current ? { ReportingPeriod: current } : {}),
    Courses: { Course: asArray(gb.courses).map(parseCourse) },
  };
}

export const POST = synergyRoute(async ({ client, body }) => {
  const raw = await client.getGradebook(
    body.reportPeriod != null ? Number(body.reportPeriod) : undefined,
  );
  return parseGradebook(raw);
});
