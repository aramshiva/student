export interface Assignment {
  "@Date": string;
  "@DisplayScore": string;
  "@DropEndDate": string;
  "@DropStartDate": string;
  "@DueDate": string;
  "@GradebookID": number;
  "@HasDropBox": boolean;
  "@Measure": string;
  "@MeasureDescription": string;
  "@Notes": string;
  "@Point": number;
  "@PointPossible": number;
  "@Points": string;
  "@Score": number;
  "@ScoreCalValue": number;
  "@ScoreMaxValue": number;
  "@ScoreType": string;
  "@StudentID": number;
  "@TeacherID": number;
  "@TimeSincePost": string;
  "@TotalSecondsSincePost": number;
  "@Type": string;
  Resources: Record<string, unknown>;
  Standards: Record<string, unknown>;
}

export interface AssignmentGradeCalc {
  "@CalculatedMark": string;
  "@Points": number;
  "@PointsPossible": number;
  "@Type": string;
  "@Weight": string;
  "@WeightedPct": string;
}

export interface Mark {
  "@CalculatedScoreRaw": number;
  "@CalculatedScoreString": string;
  "@MarkName": string;
  "@ShortMarkName": string;
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
  "@CourseID": string;
  "@CourseName": string;
  "@HighlightPercentageCutOffForProgressBar": number;
  "@ImageType": string;
  "@Period": number;
  "@Room": string | number;
  "@Staff": string;
  "@StaffEMail": string;
  "@StaffGU": string;
  "@Title": string;
  "@UsesRichContent": boolean;
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
}
