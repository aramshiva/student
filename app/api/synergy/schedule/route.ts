import { synergyRoute } from "@/lib/synergyRoute";
import type {
  ClassListing,
  ScheduleRoot,
  TermListing,
  TodayClassInfo,
  TodayScheduleInfoData,
} from "@/types/schedule";

export const runtime = "nodejs";

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = (v: unknown): Dict[] =>
  Array.isArray(v) ? v.filter(isDict) : isDict(v) ? [v] : [];

const optStr = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

const str = (v: unknown): string => optStr(v) ?? "";

const pick = (obj: Dict, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return undefined;
};

function parseClassListing(c: Dict): ClassListing {
  return {
    _Period: str(c.period),
    _CourseTitle: str(c.courseTitle),
    _RoomName: optStr(c.roomName),
    _Teacher: optStr(c.teacher),
    _TeacherEmail: optStr(c.teacherEmail),
    _SectionGU: optStr(pick(c, "sectionGU", "sectionGu")),
    _TeacherStaffGU: optStr(pick(c, "teacherStaffGU", "teacherStaffGu")),
    _MeetingDays: optStr(c.meetingDays),
    _ExcludePVUE: c.excludePVUE ? "true" : "false",
  };
}

function parseTermListing(t: Dict): TermListing {
  return {
    _TermIndex: str(t.termIndex),
    _TermCode: str(t.termCode),
    _TermName: str(t.termName),
    _BeginDate: str(t.beginDate),
    _EndDate: str(t.endDate),
    _SchoolYearTrmCodeGU: optStr(
      pick(t, "schoolYearTrmCodeGU", "schoolYearTrmCodeGu"),
    ),
    _SchoolName: optStr(t.schoolName),
    TermDefCodes: {
      TermDefCode: asArray(t.termDefCodes).map((d) => ({
        _TermDefName: str(d.termDefName),
      })),
    },
  };
}

function parseTodayClass(c: Dict): TodayClassInfo {
  return {
    _Period: optStr(pick(c, "period", "_Period")),
    _ClassName: optStr(pick(c, "className", "courseTitle", "_ClassName")),
    _RoomName: optStr(pick(c, "roomName", "_RoomName")),
    _TeacherName: optStr(pick(c, "teacherName", "teacher", "_TeacherName")),
    _TeacherEmail: optStr(pick(c, "teacherEmail", "_TeacherEmail")),
    _StartTime: optStr(pick(c, "startTime", "_StartTime")),
    _EndTime: optStr(pick(c, "endTime", "_EndTime")),
    _SectionGU: optStr(pick(c, "sectionGU", "sectionGu", "_SectionGU")),
  };
}

function parseTodaySchedule(t: Dict): TodayScheduleInfoData {
  const schools = asArray(t.schoolInfos);
  const classes = schools.flatMap((s) =>
    asArray(pick(s, "classes", "classInfos")).map(parseTodayClass),
  );
  return {
    _Date: optStr(t.date),
    SchoolInfos: {
      SchoolInfo: {
        _SchoolName: optStr(schools[0]?.schoolName),
        Classes: { ClassInfo: classes },
      },
    },
  };
}

export function parseSchedule(raw: unknown): ScheduleRoot {
  const sc = isDict(raw) ? raw : {};
  return {
    StudentClassSchedule: {
      _TermIndex: str(sc.termIndex),
      _TermIndexName: str(sc.termIndexName),
      _ErrorMessage: str(sc.errorMessage),
      _IncludeAdditionalStaffWhenEmailingTeachers:
        !!sc.includeAdditionalStaffWhenEmailingTeachers,
      ClassLists: {
        ClassListing: asArray(sc.classLists).map(parseClassListing),
      },
      TermLists: { TermListing: asArray(sc.termLists).map(parseTermListing) },
      TodayScheduleInfoData: parseTodaySchedule(
        isDict(sc.todayScheduleInfoData) ? sc.todayScheduleInfoData : {},
      ),
    },
  };
}

export const POST = synergyRoute(async ({ client, body }) => {
  const raw = await client.getSchedule(
    body.term_index != null ? Number(body.term_index) : undefined,
  );
  return parseSchedule(raw);
});
