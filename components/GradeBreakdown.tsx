"use client";
import { AssignmentGradeCalc, Assignment } from "@/types/gradebook";
import {
  parseSynergyAssignment,
  calculateGradePercentage,
} from "@/lib/gradeCalc";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface GradeBreakdownProps {
  calcs: AssignmentGradeCalc[];
  assignments?: Assignment[];
}

const weightedChartConfig = {
  currentGrade: { label: "Current Grade", color: "var(--chart-1)" },
  weight: { label: "Weight", color: "var(--chart-2)" },
  grade: { label: "Grade", color: "var(--chart-3)" },
} satisfies ChartConfig;

const radarChartConfig = {
  grade: { label: "Grade", color: "var(--chart-3)" },
} satisfies ChartConfig;

function fmtPts(n: number) {
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

function CategoryTick({
  x = 0,
  y = 0,
  payload,
  pointsMap,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  pointsMap: Record<string, { earned: number; possible: number }>;
}) {
  if (!payload) return null;
  const pts = pointsMap[payload.value];
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} dy={12} textAnchor="middle" fill="currentColor" fontSize={12}>
        {payload.value}
      </text>
    </g>
  );
}

export function GradeBreakdown({ calcs, assignments }: GradeBreakdownProps) {
  const hasWeightedData =
    calcs?.length > 0 &&
    calcs.some((c) => {
      const w = parseFloat(c._Weight);
      return Number.isFinite(w) && w > 0;
    });

  if (hasWeightedData) {
    const parsed = (assignments || []).map((a) => parseSynergyAssignment(a));
    const usable = parsed.filter(
      (p) =>
        !p.notForGrade &&
        p.pointsEarned !== undefined &&
        p.pointsPossible !== undefined,
    );
    const byType: Record<
      string,
      { earned: number; possible: number; count: number }
    > = {};
    for (const a of usable) {
      const key = a.category || "Other";
      const entry = byType[key] || { earned: 0, possible: 0, count: 0 };
      entry.earned += a.pointsEarned || 0;
      if (!a.extraCredit) entry.possible += a.pointsPossible || 0;
      entry.count += 1;
      byType[key] = entry;
    }

    const categoryData = calcs
      .filter((calc) => calc._Type.toUpperCase() !== "TOTAL")
      .map((calc) => {
        const weight = parseFloat(calc._Weight);
        const typeData = byType[calc._Type];
        const earned = typeData?.earned ?? 0;
        const possible = typeData?.possible ?? 0;
        const hasAssignments = possible > 0;
        const catGrade = hasAssignments ? (earned / possible) * 100 : 0;
        const currentGrade = hasAssignments ? (catGrade * weight) / 100 : 0;
        return { calc, weight, hasAssignments, catGrade, currentGrade };
      });

    const totalGrade = categoryData.reduce((sum, d) => sum + d.currentGrade, 0);

    const pointsMap: Record<string, { earned: number; possible: number }> =
      Object.fromEntries(
        categoryData
          .filter((d) => (byType[d.calc._Type]?.possible ?? 0) > 0)
          .map((d) => [
            d.calc._Type,
            {
              earned: byType[d.calc._Type]?.earned ?? 0,
              possible: byType[d.calc._Type]?.possible ?? 0,
            },
          ]),
      );

    const chartData = [
      ...categoryData.map((d) => ({
        category: d.calc._Type,
        currentGrade: parseFloat(d.currentGrade.toFixed(2)),
        weight: d.weight,
        grade: parseFloat(d.catGrade.toFixed(2)),
      })),
      {
        category: "Total",
        currentGrade: parseFloat(totalGrade.toFixed(2)),
        weight: 100,
        grade: parseFloat(totalGrade.toFixed(2)),
      },
    ];

    const radarData = categoryData.map((d) => ({
      category: d.calc._Type,
      grade: parseFloat(d.catGrade.toFixed(2)),
    }));

    return (
      <Card className="mb-4 pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle>Grade Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div
            className={
              categoryData.length > 2 ? "grid grid-cols-2 gap-6" : undefined
            }
          >
            <ChartContainer
              config={weightedChartConfig}
              className="h-52 w-full"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  height={48}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  tick={(props: any) => (
                    <CategoryTick {...props} pointsMap={pointsMap} />
                  )}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ChartLegend
                  content={(props: any) => <ChartLegendContent {...props} />}
                />
                <Bar
                  dataKey="currentGrade"
                  fill="var(--color-currentGrade)"
                  radius={4}
                />
                <Bar dataKey="weight" fill="var(--color-weight)" radius={4} />
                <Bar dataKey="grade" fill="var(--color-grade)" radius={4} />
              </BarChart>
            </ChartContainer>
            {categoryData.length > 2 && (
              <ChartContainer
                config={radarChartConfig}
                className="mx-auto aspect-square max-h-52 w-full"
              >
                <RadarChart data={radarData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarAngleAxis dataKey="category" />
                  <PolarGrid />
                  <Radar
                    dataKey="grade"
                    fill="var(--color-grade)"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
        <CardContent className="pt-0 pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Current Grade</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((d, i) => {
                  const pts = byType[d.calc._Type];
                  return (
                    <TableRow key={d.calc._Type}>
                      <TableCell className="font-medium text-black dark:text-white">
                        {d.calc._Type}
                      </TableCell>
                      <TableCell>{d.weight}%</TableCell>
                      <TableCell>{d.catGrade.toFixed(2)}%</TableCell>
                      <TableCell>{d.currentGrade.toFixed(2)}%</TableCell>
                      <TableCell>
                        {pts
                          ? `${fmtPts(pts.earned)}/${fmtPts(pts.possible)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-semibold">
                  <TableCell className="text-black dark:text-white">
                    Total
                  </TableCell>
                  <TableCell>100%</TableCell>
                  <TableCell>{totalGrade.toFixed(2)}%</TableCell>
                  <TableCell>{totalGrade.toFixed(2)}%</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parsed = (assignments || []).map((a) => parseSynergyAssignment(a));
  const usable = parsed.filter(
    (p) =>
      !p.notForGrade &&
      p.pointsEarned !== undefined &&
      p.pointsPossible !== undefined,
  );
  const byType: Record<
    string,
    { earned: number; possible: number; count: number }
  > = {};
  for (const a of usable) {
    const key = a.category || "Other";
    const entry = byType[key] || { earned: 0, possible: 0, count: 0 };
    entry.earned += a.pointsEarned || 0;
    if (!a.extraCredit) entry.possible += a.pointsPossible || 0;
    entry.count += 1;
    byType[key] = entry;
  }
  const typeKeys = Object.keys(byType).filter(
    (k) => byType[k].possible > 0 && k.toUpperCase() !== "TOTAL",
  );

  if (typeKeys.length > 1) {
    const radarData = typeKeys.map((type) => ({
      category: type,
      grade: parseFloat(
        ((byType[type].earned / byType[type].possible) * 100).toFixed(2),
      ),
    }));
    return (
      <Card className="mb-4 pt-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        {typeKeys.length > 2 && (
          <CardContent className="pt-6 pb-0">
            <ChartContainer
              config={radarChartConfig}
              className="mx-auto aspect-square max-h-52 w-full"
            >
              <RadarChart data={radarData}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <PolarAngleAxis dataKey="category" />
                <PolarGrid />
                <Radar
                  dataKey="grade"
                  fill="var(--color-grade)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        )}
        <CardContent className={typeKeys.length > 2 ? "pt-4" : undefined}>
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
                {typeKeys.map((type, i) => {
                  const data = byType[type];
                  const pct = calculateGradePercentage(
                    data.earned,
                    data.possible,
                  );
                  return (
                    <TableRow key={type}>
                      <TableCell className="font-medium text-black dark:text-white">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle"
                          style={{ background: `var(--chart-${(i % 5) + 1})` }}
                        />
                        {type}
                      </TableCell>
                      <TableCell>
                        {Number.isFinite(pct) ? `${pct.toFixed(2)}%` : "N/A"}
                      </TableCell>
                      <TableCell>{`${Math.round(data.earned * 100) / 100}/${Math.round(data.possible * 100) / 100}`}</TableCell>
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

  const totals =
    typeKeys.length === 1
      ? byType[typeKeys[0]]
      : {
          earned: usable.reduce((a, b) => a + (b.pointsEarned || 0), 0),
          possible: usable.reduce(
            (a, b) => a + (b.extraCredit ? 0 : b.pointsPossible || 0),
            0,
          ),
        };
  const pct = calculateGradePercentage(totals.earned, totals.possible);
  return (
    <Card className="mb-8 pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Points Summary</CardTitle>
        <CardDescription>Weights unavailable</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start sm:items-center gap-2 py-4">
          <div className="text-3xl font-semibold tracking-tight">
            {Math.round(totals.earned * 100) / 100}/
            {Math.round(totals.possible * 100) / 100}
          </div>
          <div className="text-sm text-zinc-500">
            {Number.isFinite(pct) ? `${Math.round(pct)}%` : "N/A"} overall
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
