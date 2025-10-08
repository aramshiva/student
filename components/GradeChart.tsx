"use client";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { Checkbox } from "@/components/ui/checkbox";

interface GradeChartProps {
  assignments: Assignment[];
  onStickyChange?: (val: boolean) => void;
  forceStickyInHeader?: boolean;
  sticky?: boolean;
  minimal?: boolean;
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

  const chartData = React.useMemo(() => {
    return assignmentDates.map((date) => {
      const upTo = sortedAssignments.filter(
        (a) => new Date(a["_Date"]).getTime() <= new Date(date).getTime(),
      );
      let total = 0;
      let possible = 0;
      upTo.forEach((a) => {
        let pts: number | null = null;
        let ptsPossible: number | null = null;
        if (typeof a._Points === "string" && a._Points.includes("/")) {
          const cleaned = a._Points.replace(/of/i, "/");
          const m = cleaned.match(
            /([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/,
          );
          if (m) {
            pts = parseFloat(m[1]);
            ptsPossible = parseFloat(m[2]);
          }
        }
        if (pts === null || ptsPossible === null) {
          const scoreVal = a._Score
            ? parseFloat(a._Score)
            : a._Point
              ? parseFloat(a._Point)
              : NaN;
          const maxVal = a._ScoreMaxValue
            ? parseFloat(a._ScoreMaxValue)
            : a._PointPossible
              ? parseFloat(a._PointPossible)
              : NaN;
          if (Number.isFinite(scoreVal) && Number.isFinite(maxVal)) {
            pts = scoreVal;
            ptsPossible = maxVal;
          }
        }
        if (
          pts !== null &&
          ptsPossible !== null &&
          Number.isFinite(pts) &&
          Number.isFinite(ptsPossible) &&
          (ptsPossible as number) > 0
        ) {
          total += pts as number;
          possible += ptsPossible as number;
        }
      });
      const grade = possible > 0 ? Math.round((total / possible) * 100) : 0;
      return { date, grade };
    });
  }, [assignmentDates, sortedAssignments]);

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
        className={`${forceStickyInHeader ? "mb-0 shadow-none border-0 bg-transparent" : "mb-2"} `}
      >
        <CardContent className="p-1 pb-1">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[150px] w-full"
          >
            <AreaChart data={filteredData}>
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
      className={`${forceStickyInHeader ? "mb-0 shadow-none border-0 bg-transparent" : "mb-8 pt-0"} ${!forceStickyInHeader && effectiveSticky ? "sticky top-0 z-30 shadow-md border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70" : ""}`}
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
      <CardContent className="px-2 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full"
        >
          <AreaChart data={filteredData}>
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
