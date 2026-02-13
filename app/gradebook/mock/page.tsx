"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import CourseDetail from "@/components/CourseDetail";
import { Course, Assignment } from "@/types/gradebook";

function a(
  fields: Partial<Assignment> & { _GradebookID: string; _Measure: string; _Type: string; _Date: string; _DueDate: string },
): Assignment {
  return {
    _DisplayScore: "",
    _DropEndDate: fields._DropEndDate ?? fields._DueDate,
    _DropStartDate: fields._DropStartDate ?? fields._DueDate,
    _HasDropBox: "false",
    _MeasureDescription: "",
    _Notes: "",
    _ScoreType: "Raw Score",
    _StudentID: "100001",
    _TeacherID: "50001",
    _TimeSincePost: "",
    _TotalSecondsSincePost: "0",
    _Points: "",
    Resources: "",
    Standards: "",
    ...fields,
  } as unknown as Assignment;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_COURSES: Course[] = ([
  {
    _Period: "1",
    _Title: "IB MATHEMATICS: ANALYSIS AND APPROACHES SL (1) (IBMAASL)",
    _CourseName: "IB MATHEMATICS: ANALYSIS AND APPROACHES SL (1)",
    _CourseID: "IBMAASL",
    _Room: "512",
    _Staff: "Leonhard Euler",
    _StaffEMail: "leuler@school.edu",
    _StaffGU: "D1926623-84AF-4923-9327-89895BC2776B",
    _ImageType: "math",
    _HighlightPercentageCutOffForProgressBar: "50",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "96",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: {
          AssignmentGradeCalc: [
            { _Type: "Assignments", _Weight: "30%", _Points: "245.00", _PointsPossible: "240.00", _WeightedPct: "30.63%", _CalculatedMark: "A" },
            { _Type: "Assessments", _Weight: "70%", _Points: "224.00", _PointsPossible: "250.00", _WeightedPct: "62.72%", _CalculatedMark: "A-" },
            { _Type: "TOTAL", _Weight: "100%", _Points: "469.00", _PointsPossible: "490.00", _WeightedPct: "93.35%", _CalculatedMark: "A" },
          ],
        },
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2080879", _Measure: "This or That - Expanding Binomials ws", _Type: "Assignments", _Date: "2/10/2026", _DueDate: "2/10/2026", _Score: "20", _DisplayScore: "20 out of 10", _ScoreCalValue: "20", _ScoreMaxValue: "10", _Points: "20 / 10", _Point: "20", _PointPossible: "10", _MeasureDescription: "Due Block - In Class", _TimeSincePost: "1d", _TotalSecondsSincePost: "126315" }),
            a({ _GradebookID: "2071843", _Measure: "Ch. 3.3-3.5 Assign Log", _Type: "Assignments", _Date: "1/30/2026", _DueDate: "1/30/2026", _Score: "100", _DisplayScore: "100 out of 100", _ScoreCalValue: "100", _ScoreMaxValue: "100", _Points: "100 / 100", _Point: "100", _PointPossible: "100", _TimeSincePost: "13d", _TotalSecondsSincePost: "1160584" }),
            a({ _GradebookID: "2071838", _Measure: "Ch. 3.3-3.5 Exam", _Type: "Assessments", _Date: "1/30/2026", _DueDate: "1/30/2026", _Score: "90", _DisplayScore: "90 out of 100", _ScoreCalValue: "90", _ScoreMaxValue: "100", _Points: "90 / 100", _Point: "90", _PointPossible: "100", _TimeSincePost: "13d", _TotalSecondsSincePost: "1142713" }),
            a({ _GradebookID: "2071830", _Measure: "Ch. 3.1-3.2 Quiz", _Type: "Assessments", _Date: "1/24/2026", _DueDate: "1/24/2026", _Score: "46", _DisplayScore: "46 out of 50", _ScoreCalValue: "46", _ScoreMaxValue: "50", _Points: "46 / 50", _Point: "46", _PointPossible: "50", _TimeSincePost: "19d", _TotalSecondsSincePost: "1641600" }),
            a({ _GradebookID: "2071825", _Measure: "Sequences & Series Practice Set", _Type: "Assignments", _Date: "1/22/2026", _DueDate: "1/23/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "21d", _TotalSecondsSincePost: "1814400" }),
            a({ _GradebookID: "2071820", _Measure: "Geometric Series Worksheet", _Type: "Assignments", _Date: "1/17/2026", _DueDate: "1/20/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "26d", _TotalSecondsSincePost: "2246400" }),
            a({ _GradebookID: "2071815", _Measure: "Unit 2 Exam - Functions & Equations", _Type: "Assessments", _Date: "1/14/2026", _DueDate: "1/14/2026", _Score: "88", _DisplayScore: "88 out of 100", _ScoreCalValue: "88", _ScoreMaxValue: "100", _Points: "88 / 100", _Point: "88", _PointPossible: "100", _TimeSincePost: "29d", _TotalSecondsSincePost: "2505600" }),
            a({ _GradebookID: "2071810", _Measure: "Logarithmic Functions Assign Log", _Type: "Assignments", _Date: "1/10/2026", _DueDate: "1/13/2026", _Score: "95", _DisplayScore: "95 out of 100", _ScoreCalValue: "95", _ScoreMaxValue: "100", _Points: "95 / 100", _Point: "95", _PointPossible: "100", _TimeSincePost: "33d", _TotalSecondsSincePost: "2851200" }),
            a({ _GradebookID: "2071805", _Measure: "Inverse Functions Investigation", _Type: "Assignments", _Date: "1/7/2026", _DueDate: "1/8/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "36d", _TotalSecondsSincePost: "3110400" }),
          ],
        },
      },
    },
  },
  {
    _Period: "2",
    _Title: "CONCERT ORCHESTRA (ORCH100)",
    _CourseName: "CONCERT ORCHESTRA",
    _CourseID: "ORCH100",
    _Room: "BAND",
    _Staff: "Ludwig van Beethoven",
    _StaffEMail: "lbeethoven@school.edu",
    _StaffGU: "D96206F6-5F51-444F-B9FB-DBC4EA3D2893",
    _ImageType: "arts",
    _HighlightPercentageCutOffForProgressBar: "50",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "97",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: "",
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2078472", _Measure: "Solo & Ensemble", _Type: "Performance", _Date: "2/7/2026", _DueDate: "2/7/2026", _Score: "40", _DisplayScore: "40 out of 40", _ScoreCalValue: "40", _ScoreMaxValue: "40", _Points: "40 / 40", _Point: "40", _PointPossible: "40", _TimeSincePost: "3d", _TotalSecondsSincePost: "311054" }),
            a({ _GradebookID: "2078468", _Measure: "January Rehearsal Grade", _Type: "Classwork", _Date: "1/27/2026", _DueDate: "1/30/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "3d", _TotalSecondsSincePost: "311402" }),
            a({ _GradebookID: "2078465", _Measure: "Sight Reading Exercise 6", _Type: "Classwork", _Date: "1/23/2026", _DueDate: "1/23/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "10d", _TotalSecondsSincePost: "864000" }),
            a({ _GradebookID: "2078460", _Measure: "Winter Concert Reflection", _Type: "Classwork", _Date: "1/15/2026", _DueDate: "1/16/2026", _Score: "20", _DisplayScore: "20 out of 20", _ScoreCalValue: "20", _ScoreMaxValue: "20", _Points: "20 / 20", _Point: "20", _PointPossible: "20", _TimeSincePost: "18d", _TotalSecondsSincePost: "1555200" }),
            a({ _GradebookID: "2078457", _Measure: "Scale & Arpeggio Playing Test", _Type: "Performance", _Date: "1/10/2026", _DueDate: "1/10/2026", _Score: "36", _DisplayScore: "36 out of 40", _ScoreCalValue: "36", _ScoreMaxValue: "40", _Points: "36 / 40", _Point: "36", _PointPossible: "40", _TimeSincePost: "23d", _TotalSecondsSincePost: "1987200" }),
            a({ _GradebookID: "2078453", _Measure: "Music Theory Worksheet - Key Signatures", _Type: "Classwork", _Date: "1/8/2026", _DueDate: "1/9/2026", _Score: "15", _DisplayScore: "15 out of 15", _ScoreCalValue: "15", _ScoreMaxValue: "15", _Points: "15 / 15", _Point: "15", _PointPossible: "15", _TimeSincePost: "25d", _TotalSecondsSincePost: "2160000" }),
            a({ _GradebookID: "2078450", _Measure: "December Rehearsal Grade", _Type: "Classwork", _Date: "1/6/2026", _DueDate: "1/6/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "27d", _TotalSecondsSincePost: "2332800" }),
          ],
        },
      },
    },
  },
  {
    _Period: "3",
    _Title: "PRE-IB ENGLISH 9 (ENG900)",
    _CourseName: "PRE-IB ENGLISH 9",
    _CourseID: "ENG165B",
    _Room: "904",
    _Staff: "William Shakespeare",
    _StaffEMail: "wshakespere@school.edu",
    _StaffGU: "CBFC6763-4342-4470-8515-5849D1C61ED3",
    _ImageType: "language",
    _HighlightPercentageCutOffForProgressBar: "50",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "93",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: "",
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2074359", _Measure: "Argumentative Essay Introduction Practice", _Type: "Classwork", _Date: "1/28/2026", _DueDate: "1/30/2026", _Score: "15", _DisplayScore: "15 out of 15", _ScoreCalValue: "15", _ScoreMaxValue: "15", _Points: "15 / 15", _Point: "15", _PointPossible: "15", _TimeSincePost: "9d", _TotalSecondsSincePost: "813428" }),
            a({ _GradebookID: "2069512", _Measure: "Argumentative Essay Research Worksheet", _Type: "Classwork", _Date: "1/21/2026", _DueDate: "1/27/2026", _Score: "40", _DisplayScore: "40 out of 40", _ScoreCalValue: "40", _ScoreMaxValue: "40", _Points: "40 / 40", _Point: "40", _PointPossible: "40", _TimeSincePost: "15d", _TotalSecondsSincePost: "1331172" }),
            a({ _GradebookID: "2068319", _Measure: "Library Research Assignment", _Type: "Classwork", _Date: "1/27/2026", _DueDate: "1/27/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "16d", _TotalSecondsSincePost: "1425115" }),
            a({ _GradebookID: "2068315", _Measure: "Rhetorical Analysis - Letter from Birmingham Jail", _Type: "Classwork", _Date: "1/16/2026", _DueDate: "1/19/2026", _Score: "28", _DisplayScore: "28 out of 30", _ScoreCalValue: "28", _ScoreMaxValue: "30", _Points: "28 / 30", _Point: "28", _PointPossible: "30", _TimeSincePost: "20d", _TotalSecondsSincePost: "1728000" }),
            a({ _GradebookID: "2068312", _Measure: "Vocabulary Unit 4 Quiz", _Type: "Assessments", _Date: "1/14/2026", _DueDate: "1/14/2026", _Score: "18", _DisplayScore: "18 out of 20", _ScoreCalValue: "18", _ScoreMaxValue: "20", _Points: "18 / 20", _Point: "18", _PointPossible: "20", _TimeSincePost: "22d", _TotalSecondsSincePost: "1900800" }),
            a({ _GradebookID: "2068308", _Measure: "To Kill a Mockingbird Socratic Seminar", _Type: "Classwork", _Date: "1/10/2026", _DueDate: "1/10/2026", _Score: "45", _DisplayScore: "45 out of 50", _ScoreCalValue: "45", _ScoreMaxValue: "50", _Points: "45 / 50", _Point: "45", _PointPossible: "50", _TimeSincePost: "26d", _TotalSecondsSincePost: "2246400" }),
            a({ _GradebookID: "2068305", _Measure: "Reading Journal - Chapters 20-25", _Type: "Classwork", _Date: "1/8/2026", _DueDate: "1/9/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "28d", _TotalSecondsSincePost: "2419200" }),
            a({ _GradebookID: "2068302", _Measure: "Personal Narrative Final Draft", _Type: "Assessments", _Date: "1/6/2026", _DueDate: "1/7/2026", _Score: "88", _DisplayScore: "88 out of 100", _ScoreCalValue: "88", _ScoreMaxValue: "100", _Points: "88 / 100", _Point: "88", _PointPossible: "100", _TimeSincePost: "30d", _TotalSecondsSincePost: "2592000" }),
          ],
        },
      },
    },
  },
  {
    _Period: "4",
    _Title: "PRE-IB WORLD HISTORY (SS200A)",
    _CourseName: "PRE-IB WORLD HISTORY",
    _CourseID: "SS200A",
    _Room: "906",
    _Staff: "Mark Evans",
    _StaffEMail: "mevans@school.edu",
    _StaffGU: "C355A37B-0620-401D-A5FF-A62BEBB0C799",
    _ImageType: "social",
    _HighlightPercentageCutOffForProgressBar: "60",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "95",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: "",
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2073807", _Measure: "Haitian Revolution Background", _Type: "Classwork", _Date: "1/28/2026", _DueDate: "1/30/2026", _Score: "4.5", _DisplayScore: "4.5 out of 5", _ScoreCalValue: "4.5", _ScoreMaxValue: "5", _Points: "4.5 / 5", _Point: "4.5", _PointPossible: "5", _TimeSincePost: "10d", _TotalSecondsSincePost: "885943" }),
            a({ _GradebookID: "2073430", _Measure: "French Revolution Background & Source Analysis Part 2", _Type: "Classwork", _Date: "1/26/2026", _DueDate: "1/27/2026", _Score: "5", _DisplayScore: "5 out of 5", _ScoreCalValue: "5", _ScoreMaxValue: "5", _Points: "5 / 5", _Point: "5", _PointPossible: "5", _TimeSincePost: "10d", _TotalSecondsSincePost: "898157" }),
            a({ _GradebookID: "2073428", _Measure: "French Revolution Source Analysis Part 1", _Type: "Classwork", _Date: "1/22/2026", _DueDate: "1/23/2026", _Score: "5", _DisplayScore: "5 out of 5", _ScoreCalValue: "5", _ScoreMaxValue: "5", _Points: "5 / 5", _Point: "5", _PointPossible: "5", _TimeSincePost: "14d", _TotalSecondsSincePost: "1209600" }),
            a({ _GradebookID: "2073425", _Measure: "Enlightenment Thinkers Gallery Walk", _Type: "Classwork", _Date: "1/21/2026", _DueDate: "1/22/2026", _Score: "4", _DisplayScore: "4 out of 5", _ScoreCalValue: "4", _ScoreMaxValue: "5", _Points: "4 / 5", _Point: "4", _PointPossible: "5", _TimeSincePost: "15d", _TotalSecondsSincePost: "1296000" }),
            a({ _GradebookID: "2073420", _Measure: "Unit 3 Revolutions Test", _Type: "Assessments", _Date: "1/16/2026", _DueDate: "1/16/2026", _Score: "47", _DisplayScore: "47 out of 50", _ScoreCalValue: "47", _ScoreMaxValue: "50", _Points: "47 / 50", _Point: "47", _PointPossible: "50", _TimeSincePost: "20d", _TotalSecondsSincePost: "1728000" }),
            a({ _GradebookID: "2073418", _Measure: "Causes of the American Revolution DBQ", _Type: "Classwork", _Date: "1/13/2026", _DueDate: "1/14/2026", _Score: "9", _DisplayScore: "9 out of 10", _ScoreCalValue: "9", _ScoreMaxValue: "10", _Points: "9 / 10", _Point: "9", _PointPossible: "10", _TimeSincePost: "23d", _TotalSecondsSincePost: "1987200" }),
            a({ _GradebookID: "2073415", _Measure: "Boston Massacre Primary Source Activity", _Type: "Classwork", _Date: "1/9/2026", _DueDate: "1/12/2026", _Score: "5", _DisplayScore: "5 out of 5", _ScoreCalValue: "5", _ScoreMaxValue: "5", _Points: "5 / 5", _Point: "5", _PointPossible: "5", _TimeSincePost: "27d", _TotalSecondsSincePost: "2332800" }),
          ],
        },
      },
    },
  },
  {
    _Period: "5",
    _Title: "HEALTH (HEALTH)",
    _CourseName: "HEALTH",
    _CourseID: "HEALTH",
    _Room: "905",
    _Staff: "Steven Park",
    _StaffEMail: "spark@school.edu",
    _StaffGU: "A38117EA-C676-4D46-B7A7-4CA84E5588F7",
    _ImageType: "health",
    _HighlightPercentageCutOffForProgressBar: "50",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "95",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: {
          Assignment: {
            Resources: "",
            Standards: "",
            _GradebookID: "2080215",
            _Measure: "All about me Poster",
            _Type: "Projects",
            _Date: "4/3/2026",
            _DueDate: "4/3/2026",
            _DisplayScore: "Not Due",
            _TimeSincePost: "",
            _TotalSecondsSincePost: "2147483647",
            _ScoreType: "Raw Score",
            _Points: "10 Points Possible",
            _Notes: "",
            _TeacherID: "63184",
            _StudentID: "100001",
            _MeasureDescription: "",
            _HasDropBox: "false",
            _DropStartDate: "4/3/2026",
            _DropEndDate: "4/3/2026",
          },
        },
        StandardViews: "",
        GradeCalculationSummary: "",
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2080215", _Measure: "All about me Poster", _Type: "Projects", _Date: "4/3/2026", _DueDate: "4/3/2026", _DisplayScore: "Not Due", _TimeSincePost: "", _TotalSecondsSincePost: "2147483647", _Points: "10 Points Possible" }),
            a({ _GradebookID: "2080310", _Measure: "Nutrition Label Analysis", _Type: "Classwork", _Date: "2/5/2026", _DueDate: "2/5/2026", _Score: "18", _DisplayScore: "18 out of 20", _ScoreCalValue: "18", _ScoreMaxValue: "20", _Points: "18 / 20", _Point: "18", _PointPossible: "20", _TimeSincePost: "7d", _TotalSecondsSincePost: "604800" }),
            a({ _GradebookID: "2080311", _Measure: "Mental Health Reflection Journal", _Type: "Classwork", _Date: "2/3/2026", _DueDate: "2/3/2026", _Score: "25", _DisplayScore: "25 out of 25", _ScoreCalValue: "25", _ScoreMaxValue: "25", _Points: "25 / 25", _Point: "25", _PointPossible: "25", _TimeSincePost: "9d", _TotalSecondsSincePost: "777600" }),
            a({ _GradebookID: "2080312", _Measure: "Stress Management Strategies Worksheet", _Type: "Classwork", _Date: "1/30/2026", _DueDate: "1/30/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "13d", _TotalSecondsSincePost: "1123200" }),
            a({ _GradebookID: "2080313", _Measure: "Unit 1 Health & Wellness Quiz", _Type: "Assessments", _Date: "1/28/2026", _DueDate: "1/28/2026", _Score: "42", _DisplayScore: "42 out of 45", _ScoreCalValue: "42", _ScoreMaxValue: "45", _Points: "42 / 45", _Point: "42", _PointPossible: "45", _TimeSincePost: "15d", _TotalSecondsSincePost: "1296000" }),
          ],
        },
      },
    },
  },
  {
    _Period: "6",
    _Title: "BIOLOGY (BIOLOGY)",
    _CourseName: "BIOLOGY",
    _CourseID: "BIOLOGY",
    _Room: "732",
    _Staff: "Jane Goodall",
    _StaffEMail: "jgoodall@school.edu",
    _StaffGU: "D2FA71EB-078D-4727-9E09-DB6D116343BC",
    _ImageType: "science",
    _HighlightPercentageCutOffForProgressBar: "59",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A-",
        _CalculatedScoreRaw: "90",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: {
          AssignmentGradeCalc: [
            { _Type: "Quizzes, Tests, and Other Assessments", _Weight: "70%", _Points: "31.00", _PointsPossible: "36.00", _WeightedPct: "60.28%", _CalculatedMark: "B" },
            { _Type: "Work and Practice", _Weight: "30%", _Points: "5.00", _PointsPossible: "5.00", _WeightedPct: "30.00%", _CalculatedMark: "A" },
            { _Type: "TOTAL", _Weight: "100%", _Points: "36.00", _PointsPossible: "41.00", _WeightedPct: "90.00%", _CalculatedMark: "A-" },
          ],
        },
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2079989", _Measure: "Bio - Entry 22 - Pathogens (and the Immune System)", _Type: "Work and Practice", _Date: "2/24/2026", _DueDate: "2/24/2026", _DisplayScore: "Not Due", _TimeSincePost: "", _TotalSecondsSincePost: "2147483647", _Points: "5 Points Possible", _MeasureDescription: "Complete ALL components of the entry." }),
            a({ _GradebookID: "2079305", _Measure: "Biology Unit 2 Genetics Test", _Type: "Quizzes, Tests, and Other Assessments", _Date: "2/9/2026", _DueDate: "2/9/2026", _Score: "31", _DisplayScore: "34 out of 36", _ScoreCalValue: "31", _ScoreMaxValue: "36", _Points: "31 / 36", _Point: "31", _PointPossible: "36", _TimeSincePost: "3d", _TotalSecondsSincePost: "284821" }),
            a({ _GradebookID: "2079990", _Measure: "Bio - GATTACA Questions", _Type: "Work and Practice", _Date: "2/6/2026", _DueDate: "2/6/2026", _Score: "5", _DisplayScore: "5 out of 5", _ScoreCalValue: "5", _ScoreMaxValue: "5", _Points: "5 / 5", _Point: "5", _PointPossible: "5", _TimeSincePost: "2d", _TotalSecondsSincePost: "211316" }),
            a({ _GradebookID: "2079304", _Measure: "Bio - Entry 21 - Polygenic Inheritance", _Type: "Work and Practice", _Date: "1/30/2026", _DueDate: "1/30/2026", _DisplayScore: "Not Graded", _TimeSincePost: "13d", _TotalSecondsSincePost: "1160646", _Points: "5 Points Possible", _MeasureDescription: "Complete ALL components of the entry." }),
            a({ _GradebookID: "2079303", _Measure: "Bio - Entry 20 - Multiple Alleles & Codominance", _Type: "Work and Practice", _Date: "1/27/2026", _DueDate: "1/27/2026", _DisplayScore: "Not Graded", _TimeSincePost: "16d", _TotalSecondsSincePost: "1419846", _Points: "5 Points Possible", _MeasureDescription: "Complete ALL components of the entry." }),
          ],
        },
      },
    },
  },
  {
    _Period: "7",
    _Title: "GERMAN 100 (GER100)",
    _CourseName: "GERMAN 100",
    _CourseID: "GER100",
    _Room: "942",
    _Staff: "Albert Einstein",
    _StaffEMail: "aeinstein@school.edu",
    _StaffGU: "F9DE2A85-3D40-4DD2-9353-D916760A8865",
    _ImageType: "language",
    _HighlightPercentageCutOffForProgressBar: "50",
    _UsesRichContent: "false",
    Marks: {
      Mark: {
        _CalculatedScoreString: "A",
        _CalculatedScoreRaw: "95",
        _MarkName: "S2MT",
        _ShortMarkName: "S2MT",
        AssignmentsSinceLastAccess: "",
        StandardViews: "",
        GradeCalculationSummary: "",
        Assignments: {
          Assignment: [
            a({ _GradebookID: "2073851", _Measure: "Hobbys und Freizeit 1", _Type: "Reading and Listening", _Date: "2/10/2026", _DueDate: "2/10/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "7d", _TotalSecondsSincePost: "625052" }),
            a({ _GradebookID: "2080869", _Measure: "In Class 12 sentences with Modal Verbs+Activities", _Type: "Speaking and Writing", _Date: "2/10/2026", _DueDate: "2/10/2026", _Score: "24", _DisplayScore: "24 out of 24", _ScoreCalValue: "24", _ScoreMaxValue: "24", _Points: "24 / 24", _Point: "24", _PointPossible: "24", _TimeSincePost: "1d", _TotalSecondsSincePost: "126855" }),
            a({ _GradebookID: "2076635", _Measure: "Modal Verb Pixel Art", _Type: "Grammar and Conventions", _Date: "2/5/2026", _DueDate: "2/5/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "11 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "6d", _TotalSecondsSincePost: "560288" }),
            a({ _GradebookID: "2076634", _Measure: "Modal Verbs Fill in the blank 2", _Type: "Grammar and Conventions", _Date: "2/5/2026", _DueDate: "2/5/2026", _Score: "9", _DisplayScore: "9 out of 10", _ScoreCalValue: "9", _ScoreMaxValue: "10", _Points: "9 / 10", _Point: "9", _PointPossible: "10", _TimeSincePost: "7d", _TotalSecondsSincePost: "625052" }),
            a({ _GradebookID: "2076636", _Measure: "Modal Verbs Word Order", _Type: "Grammar and Conventions", _Date: "2/5/2026", _DueDate: "2/5/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "8 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "7d", _TotalSecondsSincePost: "625051" }),
            a({ _GradebookID: "2075381", _Measure: "Modal Verbs Fill-in-the-Blanks 1", _Type: "Grammar and Conventions", _Date: "2/3/2026", _DueDate: "2/3/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "10 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "8d", _TotalSecondsSincePost: "730146" }),
            a({ _GradebookID: "2075382", _Measure: "Modal Verbs Matching", _Type: "Grammar and Conventions", _Date: "2/3/2026", _DueDate: "2/3/2026", _Score: "10", _DisplayScore: "10 out of 10", _ScoreCalValue: "10", _ScoreMaxValue: "10", _Points: "9 / 10", _Point: "10", _PointPossible: "10", _TimeSincePost: "8d", _TotalSecondsSincePost: "730146" }),
            a({ _GradebookID: "2075383", _Measure: "Wie geht's Quiz", _Type: "Reading and Listening", _Date: "2/3/2026", _DueDate: "2/3/2026", _Score: "21", _DisplayScore: "21 out of 25", _ScoreCalValue: "21", _ScoreMaxValue: "25", _Points: "24 / 25", _Point: "21", _PointPossible: "25", _TimeSincePost: "8d", _TotalSecondsSincePost: "730146" }),
            a({ _GradebookID: "2068538", _Measure: "In class Weekly Chart", _Type: "Speaking and Writing", _Date: "2/2/2026", _DueDate: "2/2/2026", _Score: "12.75", _DisplayScore: "12.75 out of 14", _ScoreCalValue: "12.75", _ScoreMaxValue: "14", _Points: "12.75 / 14", _Point: "12.75", _PointPossible: "14", _TimeSincePost: "10d", _TotalSecondsSincePost: "883702" }),
            a({ _GradebookID: "2073852", _Measure: "Wie geht's Übung/exercise", _Type: "Speaking and Writing", _Date: "2/2/2026", _DueDate: "2/2/2026", _Score: "15", _DisplayScore: "15 out of 15", _ScoreCalValue: "15", _ScoreMaxValue: "15", _Points: "15 / 15", _Point: "15", _PointPossible: "15", _TimeSincePost: "10d", _TotalSecondsSincePost: "883702" }),
          ],
        },
      },
    },
  },
] as any) as Course[];

const MOCK_DATA = {
  data: {
    ReportingPeriods: {
      ReportPeriod: [
        { _Index: "0", _GradePeriod: "Semester 1 Mid-Term", _StartDate: "9/3/2025", _EndDate: "10/31/2025" },
        { _Index: "1", _GradePeriod: "Semester 1 Final Mark", _StartDate: "9/3/2025", _EndDate: "1/23/2026" },
        { _Index: "2", _GradePeriod: "Semester 2 Mid-Term", _StartDate: "11/3/2025", _EndDate: "4/3/2026" },
        { _Index: "3", _GradePeriod: "Semester 2 Final Mark", _StartDate: "1/27/2026", _EndDate: "6/17/2026" },
      ],
    },
    ReportingPeriod: { _Index: "2" },
    Courses: { Course: MOCK_COURSES },
    _Type: "Traditional",
    _ErrorMessage: "",
    _HideStandardGraphInd: "false",
    _HideMarksColumnElementary: "false",
    _HidePointsColumnElementary: "false",
    _HidePercentSecondary: "false",
    _DisplayStandardsData: "false",
    _GBStandardsTabDefault: "false",
  },
};

const MOCK_REPORTING_PERIODS = [
  { index: 0, label: "Semester 1 Mid-Term", start: "9/3/2025", end: "10/31/2025" },
  { index: 1, label: "Semester 1 Final Mark", start: "9/3/2025", end: "1/23/2026" },
  { index: 2, label: "Semester 2 Mid-Term", start: "11/3/2025", end: "4/3/2026" },
  { index: 3, label: "Semester 2 Final Mark", start: "1/27/2026", end: "6/17/2026" },
];

function MockGradebookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const initialCourseId = searchParams.get("course");
  const initialSticky = searchParams.get("sticky") === "1";

  const updateURL = useCallback(
    (params: { courseId?: string | null; sticky?: boolean }) => {
      const current = new URLSearchParams(searchParams.toString());
      if (params.courseId) {
        current.set("course", params.courseId);
      } else if (params.courseId === null) {
        current.delete("course");
      }
      if (params.sticky !== undefined) {
        if (params.sticky) {
          current.set("sticky", "1");
        } else {
          current.delete("sticky");
        }
      }
      const queryString = current.toString();
      const newURL = queryString
        ? `/gradebook/mock?${queryString}`
        : "/gradebook/mock";
      router.push(newURL, { scroll: false });
    },
    [searchParams, router],
  );

  if (initialCourseId && !selectedCourse) {
    const course = MOCK_COURSES.find((c) => c._CourseID === initialCourseId);
    if (course) setSelectedCourse(course);
  }

  const handleCourseSelect = useCallback(
    (course: Course) => {
      setSelectedCourse(course);
      updateURL({ courseId: course._CourseID });
    },
    [updateURL],
  );

  const handleBack = useCallback(() => {
    setSelectedCourse(null);
    updateURL({ courseId: null, sticky: false });
  }, [updateURL]);

  const handleStateChange = useCallback(
    (sticky: boolean) => {
      const currentSticky = searchParams.get("sticky") === "1";
      if (sticky !== currentSticky) {
        updateURL({ sticky });
      }
    },
    [searchParams, updateURL],
  );

  if (selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        onBack={handleBack}
        initialSticky={initialSticky}
        onStateChange={handleStateChange}
        hideGradeCalcWarning
      />
    );
  }

  return (
    <Dashboard
      gradebookData={MOCK_DATA}
      onCourseSelect={handleCourseSelect}
      onLogout={() => {
        router.push("/");
      }}
      reportingPeriods={MOCK_REPORTING_PERIODS}
      selectedReportingPeriod={2}
      onSelectReportingPeriod={() => {}}
      onRefresh={() => {}}
      lastRefreshed={new Date()}
      isLoading={false}
    />
  );
}

export default function MockGradebookPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading mock gradebook...</div>}>
    <p className="px-9 py-9 -pb-20" style={{ marginBottom: -90 }}>This is a mock webpage of the gradebook, there may be errors in the mock data that aren&#39;t shown on the actual page. This is provided to give you a general idea of what the app looks like, AI was used to provide mock data.</p>
      <MockGradebookContent />
    </Suspense>
  );
}
