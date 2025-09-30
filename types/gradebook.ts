export interface Assignment {
  _Date: string;
  _DisplayScore: string;
  _DropEndDate: string;
  _DropStartDate: string;
  _DueDate: string;
  _GradebookID: string;
  _HasDropBox: string;
  _Measure: string;
  _MeasureDescription: string;
  _Notes: string;
  _Point?: string;
  _PointPossible?: string;
  _Points: string;
  _Score?: string;
  _ScoreCalValue?: string;
  _ScoreMaxValue?: string;
  _ScoreType: string;
  _StudentID: string;
  _TeacherID: string;
  _TimeSincePost: string;
  _TotalSecondsSincePost: string;
  _Type: string;
  Resources: Record<string, unknown>;
  Standards: Record<string, unknown>;
}

export interface AssignmentGradeCalc {
  _CalculatedMark: string;
  _Points: string;
  _PointsPossible: string;
  _Type: string;
  _Weight: string;
  _WeightedPct: string;
}

export interface Mark {
  _CalculatedScoreRaw: string;
  _CalculatedScoreString: string;
  _MarkName: string;
  _ShortMarkName: string;
  Assignments: {
    Assignment: Assignment[];
  };
  AssignmentsSinceLastAccess: Record<string, unknown>;
  GradeCalculationSummary: {
    AssignmentGradeCalc: AssignmentGradeCalc[];
  };
  StandardViews: Record<string, unknown>;
}

export interface Course {
  _CourseID: string;
  _CourseName: string;
  _HighlightPercentageCutOffForProgressBar: string;
  _ImageType: string;
  _Period: string;
  _Room: string;
  _Staff: string;
  _StaffEMail: string;
  _StaffGU: string;
  _Title: string;
  _UsesRichContent: string;
  Marks: {
    Mark: Mark | Mark[];
  };
}

export interface GradebookData {
  data: {
    Gradebook: {
      "@DisplayStandardsData": boolean;
      "@ErrorMessage": string;
      "@GBStandardsTabDefault": boolean;
      "@HideMarksColumnElementary": boolean;
      "@HidePercentSecondary": boolean;
      "@HidePointsColumnElementary": boolean;
      "@HideStandardGraphInd": boolean;
      "@Type": string;
      Courses: {
        Course: Course[];
      };
    };
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
  district_url: string;
  reporting_period: string;
}
