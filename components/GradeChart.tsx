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

interface GradeChartProps {
  assignments: Assignment[];
}

const chartConfig = {
  grade: {
    label: "Grade %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function GradeChart({
  assignments,
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
        const pts = a._Score ? parseFloat(a._Score) : (a._Point ? parseFloat(a._Point) : NaN);
        const ptsPossible = a._ScoreMaxValue
          ? parseFloat(a._ScoreMaxValue)
          : (a._PointPossible ? parseFloat(a._PointPossible) : NaN);
        if (Number.isFinite(pts) && Number.isFinite(ptsPossible) && ptsPossible > 0) {
          total += pts;
          possible += ptsPossible;
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

  if (!assignments.length) return null;

  return (
    <Card className="mb-8 pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Grade Progression</CardTitle>
          <CardDescription>Cumulative % over time</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
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
              tickMargin={8}
              minTickGap={32}
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
      </CardContent>
    </Card>
  );
}
