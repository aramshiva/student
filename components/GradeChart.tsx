"use client";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Assignment } from "@/types/gradebook";
import {
  type Category,
  parseSynergyAssignment,
  getCalculableAssignments,
  getPointsByCategory,
  calculateCourseGradePercentageFromCategories,
  calculateCourseGradePercentageFromTotals,
} from "@/lib/gradeCalc";
import { Checkbox } from "@/components/ui/checkbox";

interface GradeChartProps {
  assignments: Assignment[];
  onStickyChange?: (val: boolean) => void;
  forceStickyInHeader?: boolean;
  sticky?: boolean;
  minimal?: boolean;
  categories?: Category[];
}

const chartConfig = {
  grade: {
    label: "Grade %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function GradeChart({
  assignments,
  onStickyChange,
  forceStickyInHeader = false,
  sticky,
  minimal = false,
  categories,
}: GradeChartProps) {
  const sortedAssignments = React.useMemo(
    () =>
      [...assignments].sort(
        (a, b) =>
          new Date(a["_Date"]).getTime() - new Date(b["_Date"]).getTime(),
      ),
    [assignments],
  );
  const assignmentDates = React.useMemo(
    () =>
      Array.from(new Set(sortedAssignments.map((a) => a["_Date"]))).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      ),
    [sortedAssignments],
  );

  const parsedAssignments = React.useMemo(
    () => assignments.map((a) => parseSynergyAssignment(a)),
    [assignments],
  );

  const chartData = React.useMemo(() => {
    return assignmentDates.map((date) => {
      const cutoff = new Date(date).getTime();
      const upTo = parsedAssignments.filter((a) => a.date.getTime() <= cutoff);
      const calculable = getCalculableAssignments(upTo);
      let pct: number = 0;
      if (categories && categories.length > 0) {
        const byCat = getPointsByCategory(calculable);
        pct = calculateCourseGradePercentageFromCategories(byCat, categories);
      } else {
        pct = calculateCourseGradePercentageFromTotals(calculable);
      }
      const grade = Number.isFinite(pct) ? Math.round(pct) : 0;
      return { date, grade };
    });
  }, [assignmentDates, parsedAssignments, categories]);

  const [timeRange, setTimeRange] = React.useState("all");

  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return chartData;
    const referenceDate = chartData.length
      ? new Date(chartData[chartData.length - 1].date)
      : new Date();
    let days = 90;
    if (timeRange === "30d") days = 30;
    else if (timeRange === "7d") days = 7;
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - days);
    return chartData.filter((d) => new Date(d.date) >= start);
  }, [chartData, timeRange]);

  const isControlled = typeof sticky === "boolean";
  const [uncontrolledSticky, setUncontrolledSticky] = React.useState(false);
  const effectiveSticky = isControlled
    ? (sticky as boolean)
    : uncontrolledSticky;
  const handleSetSticky = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolledSticky(v);
      onStickyChange?.(v);
    },
    [isControlled, onStickyChange],
  );

  if (!assignments.length) return null;

  if (minimal) {
    return (
      <Card
        className={`${
          forceStickyInHeader
            ? "mb-0 shadow-none border-0 bg-transparent"
            : "mb-2"
        } `}
      >
        <CardContent className="p-1 pb-1">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[150px] w-full"
          >
            <AreaChart
              data={filteredData}
              margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="fillGrade" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-grade)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-grade)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <YAxis hide domain={[0, "dataMax + 1"]} allowDecimals={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                minTickGap={24}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  if (isNaN(d.getTime())) return value;
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="grade"
                type="linear"
                fill="url(#fillGrade)"
                stroke="var(--color-grade)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
          <div className="flex items-center justify-end gap-1 mt-1 pr-0">
            <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500 select-none">
              <Checkbox
                checked={effectiveSticky}
                onCheckedChange={(val) => handleSetSticky(val === true)}
                className="h-3.5 w-3.5"
              />
              Sticky
            </label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${
        forceStickyInHeader
          ? "mb-0 shadow-none border-0 bg-transparent"
          : "mb-8 pt-0"
      } ${
        !forceStickyInHeader && effectiveSticky
          ? "sticky z-30 shadow-md border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
          : ""
      }`}
    >
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-3 sm:flex-row">
        <div className="grid flex-1 gap-0.5">
          <CardTitle className="leading-tight">Grade Progression</CardTitle>
          <CardDescription className="text-xs">
            Cumulative % over time
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-36 h-8 rounded-md sm:ml-auto sm:flex text-xs"
              aria-label="Select a value"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="rounded-md text-xs">
              <SelectItem value="all" className="rounded-md text-xs">
                All
              </SelectItem>
              <SelectItem value="90d" className="rounded-md text-xs">
                3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-md text-xs">
                30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-md text-xs">
                7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-1 pb-1 sm:px-4 sm:pt-2 sm:pb-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="fillGrade" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-grade)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-grade)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis hide domain={[0, "dataMax + 1"]} allowDecimals={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              minTickGap={28}
              tickFormatter={(value) => {
                const d = new Date(value);
                if (isNaN(d.getTime())) return value;
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    const d = new Date(value);
                    if (isNaN(d.getTime())) return value;
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
              }
            />
            <Area
              dataKey="grade"
              type="linear"
              fill="url(#fillGrade)"
              stroke="var(--color-grade)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-end gap-2 mt-2 pr-1">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 select-none">
            <Checkbox
              checked={effectiveSticky}
              onCheckedChange={(val) => handleSetSticky(val === true)}
              className="h-3.5 w-3.5"
            />
            Sticky
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
