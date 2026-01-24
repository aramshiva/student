"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PeriodTotal {
  number: number;
  total: number;
}

interface Period {
  number: number;
}

interface AbsenceDay {
  periods: Period[];
}

interface AttendanceDataShape {
  schoolName?: string;
  type?: string;
  startPeriod?: number;
  endPeriod?: number;
  absenceDays: AbsenceDay[];
  totals: {
    activities?: PeriodTotal[];
    excused?: PeriodTotal[];
    tardies?: PeriodTotal[];
    unexcused?: PeriodTotal[];
    unexcusedTardies?: PeriodTotal[];
  };
}

interface AttendanceGraphProps {
  dataShape: AttendanceDataShape | null;
  isLoading: boolean;
  periodNameMap: Record<number, string>;
}

const chartConfig = {
  activities: {
    label: "Activities",
    color: "hsl(var(--chart-1))",
  },
  excused: {
    label: "Excused",
    color: "hsl(var(--chart-2))",
  },
  tardies: {
    label: "Tardies",
    color: "hsl(var(--chart-3))",
  },
  unexcused: {
    label: "Unexcused",
    color: "hsl(var(--chart-4))",
  },
  unexcusedTardies: {
    label: "Unexcused Tardies ",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function AttendanceGraph({
  dataShape,
  isLoading,
  periodNameMap,
}: AttendanceGraphProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[200px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!dataShape) return null;

  const nums = new Set<number>();
  const pushNums = (list?: PeriodTotal[]) =>
    list?.forEach((l) => nums.add(l.number));
  pushNums(dataShape.totals.activities);
  pushNums(dataShape.totals.excused);
  pushNums(dataShape.totals.tardies);
  pushNums(dataShape.totals.unexcused);
  pushNums(dataShape.totals.unexcusedTardies);
  Object.keys(periodNameMap).forEach((k) => nums.add(Number(k)));
  dataShape.absenceDays.forEach((day) =>
    day.periods.forEach((p: Period) => nums.add(p.number)),
  );

  const sortedPeriods = Array.from(nums).sort((a, b) => a - b);

  const chartData = sortedPeriods
    .map((n) => {
      const find = (list?: PeriodTotal[]) =>
        list?.find((l) => l.number === n)?.total ?? 0;
      const activities = find(dataShape.totals.activities);
      const excused = find(dataShape.totals.excused);
      const tardies = find(dataShape.totals.tardies);
      const unexcused = find(dataShape.totals.unexcused);
      const unexcusedTardies = find(dataShape.totals.unexcusedTardies);

      const hasAbsences = dataShape.absenceDays.some((day) =>
        day.periods.some((p: Period) => p.number === n),
      );

      if (
        !periodNameMap[n] &&
        activities + excused + tardies + unexcused + unexcusedTardies === 0 &&
        !hasAbsences
      ) {
        return null;
      }

      const label = periodNameMap[n] ? `Period ${n}` : `Period ${n}`;

      return {
        period: label,
        activities,
        excused,
        tardies,
        unexcused,
        unexcusedTardies,
      };
    })
    .filter(Boolean);

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="activities"
              stackId="a"
              fill="var(--chart-1)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="excused"
              stackId="a"
              fill="var(--chart-2)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="tardies"
              stackId="a"
              fill="var(--chart-3)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="unexcused"
              stackId="a"
              fill="var(--chart-4)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="unexcusedTardies"
              stackId="a"
              fill="var(--chart-5)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
