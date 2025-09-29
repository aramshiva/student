"use client";
import { AssignmentGradeCalc } from "@/types/gradebook";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GradeBreakdownProps {
  calcs: AssignmentGradeCalc[];
}

export function GradeBreakdown({ calcs }: GradeBreakdownProps) {
  if (!calcs?.length) return null;
  return (
    <Card className="mb-8 pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Grade Breakdown</CardTitle>
        <CardDescription>Based on assignment categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {calcs.map((calc, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{calc["@Type"]}</h3>
                <span className="text-sm text-gray-600">{calc["@Weight"]}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Grade:</span>
                  <span className="font-medium">{calc["@CalculatedMark"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points:</span>
                  <span>{calc["@Points"]}/{calc["@PointsPossible"]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weighted:</span>
                  <span className="font-medium">{calc["@WeightedPct"]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
