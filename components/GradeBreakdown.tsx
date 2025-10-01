"use client";
import { AssignmentGradeCalc } from "@/types/gradebook";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Type</TableHead>
                <TableHead className="w-1/6">Grade</TableHead>
                <TableHead className="w-1/6">Weight</TableHead>
                <TableHead className="w-1/4">Points</TableHead>{" "}
              </TableRow>
            </TableHeader>
            <TableBody>
              {calcs.map((calc, idx) => {
                const fraction = `${calc._Points}/${calc._PointsPossible}`;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-black">
                      {calc._Type}
                    </TableCell>
                    <TableCell>{calc._CalculatedMark}</TableCell>
                    <TableCell>{calc._Weight}</TableCell>
                    <TableCell>{fraction}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
