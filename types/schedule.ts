
export interface ClassListing {
  _Period: string;
  _CourseTitle: string;
  _RoomName?: string;
  _Teacher?: string;
  _TeacherEmail?: string;
  _SectionGU?: string;
  _TeacherStaffGU?: string;
  _MeetingDays?: string;
  _ExcludePVUE?: string;
}

export interface TermDefCode {
  _TermDefName: string;
}

export interface TermListing {
  _TermIndex: string;
  _TermCode: string;
  _TermName: string;
  _BeginDate: string;
  _EndDate: string;
  _SchoolYearTrmCodeGU?: string;
  _SchoolName?: string;
  TermDefCodes?: { TermDefCode: TermDefCode[] };
}

export interface TodayClassInfo {
  _Period?: string;
  _ClassName?: string;
  _RoomName?: string;
  _TeacherName?: string;
  _TeacherEmail?: string;
  _StartTime?: string;
  _EndTime?: string;
  _SectionGU?: string;
}

export interface TodayScheduleInfoData {
  _Date?: string;
  SchoolInfos?: {
    SchoolInfo?: {
      _SchoolName?: string;
      Classes?: { ClassInfo: TodayClassInfo[] };
    };
  };
}

export interface StudentClassSchedule {
  _TermIndex: string;
  _TermIndexName: string;
  _ErrorMessage: string;
  _IncludeAdditionalStaffWhenEmailingTeachers?: boolean;
  ClassLists?: { ClassListing: ClassListing[] };
  TermLists?: { TermListing: TermListing[] };
  TodayScheduleInfoData?: TodayScheduleInfoData;
}

export interface ScheduleRoot {
  StudentClassSchedule: StudentClassSchedule;
}
