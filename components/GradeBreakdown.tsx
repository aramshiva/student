"use client";
import { AssignmentGradeCalc, Assignment } from "@/types/gradebook";
import { parseSynergyAssignment, calculateGradePercentage } from "@/lib/gradeCalc";
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
  assignments?: Assignment[];
}

export function GradeBreakdown({ calcs, assignments }: GradeBreakdownProps) {
  const hasWeightedData = calcs?.length > 0 && calcs.some(c => {
    const w = parseFloat(c._Weight);
    return Number.isFinite(w) && w > 0;
  });

  if (hasWeightedData) {
    return (
      <Card className="mb-8 pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle>Grade Breakdown</CardTitle>
          <CardDescription>Weighted by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Type</TableHead>
                  <TableHead className="w-1/6">Grade</TableHead>
                  <TableHead className="w-1/6">Weight</TableHead>
                  <TableHead className="w-1/4">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calcs.map((calc, idx) => {
                  const fraction = `${calc._Points}/${calc._PointsPossible}`;
                  const hasAssignments = parseFloat(calc._PointsPossible) > 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-black dark:text-white">{calc._Type}</TableCell>
                      <TableCell>{hasAssignments ? calc._CalculatedMark : "N/A"}</TableCell>
                      <TableCell>{calc._Weight}</TableCell>
                      <TableCell>{hasAssignments ? fraction : "N/A"}</TableCell>
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

  const parsed = (assignments || []).map(a => parseSynergyAssignment(a));
  const usable = parsed.filter(p => !p.notForGrade && p.pointsEarned !== undefined && p.pointsPossible !== undefined);
  const byType: Record<string, { earned: number; possible: number; count: number }> = {};
  for (const a of usable) {
    const key = a.category || "Other";
    const entry = byType[key] || { earned: 0, possible: 0, count: 0 };
    entry.earned += a.pointsEarned || 0;
    if (!a.extraCredit) entry.possible += a.pointsPossible || 0;
    entry.count += 1;
    byType[key] = entry;
  }
  const typeKeys = Object.keys(byType).filter(k => byType[k].possible > 0);

  if (typeKeys.length > 1) {
    return (
      <Card className="mb-8 pt-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Not weighted by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Type</TableHead>
                  <TableHead className="w-1/6">Grade</TableHead>
                  <TableHead className="w-1/4">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeKeys.map(type => {
                  const data = byType[type];
                  const pct = calculateGradePercentage(data.earned, data.possible);
                  return (
                    <TableRow key={type}>
                      <TableCell className="font-medium text-black dark:text-white">{type}</TableCell>
                      <TableCell>{Number.isFinite(pct) ? `${Math.round(pct)}%` : "N/A"}</TableCell>
                      <TableCell>{`${data.earned}/${data.possible}`}</TableCell>
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

  const totals = typeKeys.length === 1 ? byType[typeKeys[0]] : { earned: usable.reduce((a,b)=>a + (b.pointsEarned||0),0), possible: usable.reduce((a,b)=> a + (b.extraCredit ? 0 : (b.pointsPossible||0)),0) };
  const pct = calculateGradePercentage(totals.earned, totals.possible);
  return (
    <Card className="mb-8 pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Points Summary</CardTitle>
        <CardDescription>Weights unavailable</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start sm:items-center gap-2 py-4">
          <div className="text-3xl font-semibold tracking-tight">{totals.earned}/{totals.possible}</div>
          <div className="text-sm text-gray-500">{Number.isFinite(pct) ? `${Math.round(pct)}%` : "N/A"} overall</div>
        </div>
      </CardContent>
    </Card>
  );
}
