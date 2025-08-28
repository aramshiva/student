'use client';

import { Course, Mark, AssignmentGradeCalc } from '@/types/gradebook';
import { formatDate, getGradeColor, getCourseIcon, calculatePercentage } from '@/utils/gradebook';

// Helper function to get the current mark from Mark or Mark[]
function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    // If it's an array, return the last mark (most recent)
    return marks[marks.length - 1] || null;
  }
  // If it's a single mark, return it
  return marks;
}

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

export default function CourseDetail({ course, onBack }: CourseDetailProps) {
  const marks = course.Marks.Mark;
  const currentMark = getCurrentMark(marks);
  const assignments = currentMark?.Assignments?.Assignment || [];
  const gradeColorClass = getGradeColor(currentMark?.["@CalculatedScoreString"] || "");
  const icon = getCourseIcon(course["@ImageType"]);

  // Sort assignments by date (newest first)
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(b["@Date"]).getTime() - new Date(a["@Date"]).getTime()
  );

  const getAssignmentTypeColor = (type: string) => {
    if (type.toLowerCase().includes('assessment') || type.toLowerCase().includes('test') || type.toLowerCase().includes('quiz')) {
      return 'bg-red-100 text-red-800';
    } else if (type.toLowerCase().includes('homework') || type.toLowerCase().includes('classwork')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.toLowerCase().includes('participation')) {
      return 'bg-green-100 text-green-800';
    } else if (type.toLowerCase().includes('fitness')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={onBack}
              className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {course["@CourseName"]}
                  </h1>
                  <p className="text-gray-600 font-mono">
                    {course["@CourseID"]} • Period {course["@Period"]} • Room {course["@Room"]}
                  </p>
                  <p className="text-gray-600">
                    {course["@Staff"]} • {course["@StaffEMail"]}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex px-4 py-2 rounded-lg text-lg font-bold ${gradeColorClass}`}>
                  {currentMark?.["@CalculatedScoreString"] || "N/A"}
                </div>
                <p className="text-sm text-gray-600 mt-1 font-mono">
                  {currentMark?.["@CalculatedScoreRaw"] || "N/A"}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grade Breakdown */}
        {currentMark?.GradeCalculationSummary?.AssignmentGradeCalc && (
          <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Grade Breakdown</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentMark.GradeCalculationSummary.AssignmentGradeCalc.map((calc: AssignmentGradeCalc, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{calc["@Type"]}</h3>
                      <span className="text-sm text-gray-600">{calc["@Weight"]}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Grade:</span>
                        <span className="font-mono font-medium">{calc["@CalculatedMark"]}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-mono">{calc["@Points"]}/{calc["@PointsPossible"]}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Weighted:</span>
                        <span className="font-mono font-medium">{calc["@WeightedPct"]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assignments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Assignments ({assignments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAssignments.map((assignment) => {
                  const percentage = calculatePercentage(assignment["@Score"], assignment["@ScoreMaxValue"]);
                  return (
                    <tr key={assignment["@GradebookID"]} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {assignment["@Measure"]}
                          </div>
                          {assignment["@MeasureDescription"] && (
                            <div className="text-sm text-gray-500 mt-1">
                              {assignment["@MeasureDescription"]}
                            </div>
                          )}
                          {assignment["@Notes"] && (
                            <div className="text-sm text-blue-600 mt-1 italic">
                              Note: {assignment["@Notes"]}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAssignmentTypeColor(assignment["@Type"])}`}>
                          {assignment["@Type"]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {formatDate(assignment["@Date"])}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono">
                          <div className="font-medium text-gray-900">
                            {assignment["@DisplayScore"]}
                          </div>
                          <div className="text-gray-500">
                            {assignment["@Points"]}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 90 ? 'bg-green-500' :
                                percentage >= 80 ? 'bg-blue-500' :
                                percentage >= 70 ? 'bg-yellow-500' :
                                percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono font-medium text-gray-900 min-w-[3rem]">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
