"use client"

import React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { GradebookData, Mark, Course } from "@/types/gradebook"

function getCurrentMark(marks: Mark | Mark[]): Mark | null {
  if (Array.isArray(marks)) {
    return marks[marks.length - 1] || null;
  }
  return marks;
}

interface GradeChartProps {
  gradebookData: GradebookData;
}

const chartConfig = {
  grade: {
    label: "Grade",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface GradebookRootLike {
  Gradebook?: { Courses?: { Course?: Course[] } };
  Courses?: { Course?: Course[] };
  [k: string]: unknown;
}

export function GradeChart({ gradebookData }: GradeChartProps) {
  const root: GradebookRootLike = (gradebookData.data as unknown as GradebookRootLike).Gradebook
    ? (gradebookData.data as unknown as GradebookRootLike).Gradebook as GradebookRootLike
    : (gradebookData.data as unknown as GradebookRootLike);

  const chartData = React.useMemo(() => {
    const coursesLocal: Course[] = root?.Courses?.Course || [];
    const allAssignments: Array<{
      date: string;
      grade: number;
      assignment: string;
      course: string;
    }> = [];
    coursesLocal.forEach((course: Course) => {
      const marks = course.Marks.Mark;
      const currentMark = getCurrentMark(marks);
      const assignments = currentMark?.Assignments?.Assignment || [];
      
      assignments.forEach((assignment: import("@/types/gradebook").Assignment) => {
        const score = assignment._Score ? parseFloat(assignment._Score) : -1;
        const possible = assignment._PointPossible ? parseFloat(assignment._PointPossible) : -1;
        if (score >= 0 && possible > 0) {
          const gradePercentage = (score / possible) * 100;
          allAssignments.push({
            date: assignment._Date,
            grade: Math.round(gradePercentage * 10) / 10,
            assignment: assignment._Measure,
            course: course._Title,
          });
        }
      });
    });

    allAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const weeklyData: Record<string, { grades: number[], date: string }> = {};
    
    allAssignments.forEach((assignment) => {
      const date = new Date(assignment.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { grades: [], date: weekKey };
      }
      weeklyData[weekKey].grades.push(assignment.grade);
    });

    const result = Object.values(weeklyData)
      .map((week) => ({
        date: new Date(week.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        grade: Math.round((week.grades.reduce((sum, grade) => sum + grade, 0) / week.grades.length) * 10) / 10,
        fullDate: week.date,
      }))

    return result;
  }, [root]);

  const trend = React.useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const firstGrade = chartData[0].grade;
    const lastGrade = chartData[chartData.length - 1].grade;
    const change = lastGrade - firstGrade;
    const percentage = Math.abs(change);
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.round(percentage * 10) / 10,
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Grade Progress</CardTitle>
          <CardDescription>No assignment data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No grades to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Grade Progress</CardTitle>
        <CardDescription>
          Weekly average over the last {chartData.length} weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              domain={[60, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="grade"
              type="monotone"
              stroke="var(--color-grade)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-grade)",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {trend.direction === 'up' && (
            <>
              Trending up by {trend.percentage}% <TrendingUp className="h-4 w-4" />
            </>
          )}
          {trend.direction === 'down' && (
            <>
              Trending down by {trend.percentage}% <TrendingDown className="h-4 w-4" />
            </>
          )}
          {trend.direction === 'neutral' && (
            <>Grade performance is stable</>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Based on weekly assignment averages
        </div>
      </CardFooter>
    </Card>
  )
}
