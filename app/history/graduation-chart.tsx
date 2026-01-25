"use client";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface GraduationRequirement {
  subject: string;
  required: string;
  completed: string;
  inProgress: string;
  remaining: string;
  guid: string;
}

interface GraduationChartProps {
  data: GraduationRequirement[];
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "oklch(72.3% 0.219 149.579)",
  },
  inProgress: {
    label: "In Progress",
    color: "oklch(82.8% 0.189 84.429)",
  },
  remaining: {
    label: "Remaining",
    color: "oklch(70.5% 0.015 286.067)",
  },
} satisfies ChartConfig;

export function GraduationChart({ data }: GraduationChartProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((req) => {
          const completed = parseFloat(req.completed) || 0;
          const inProgress = parseFloat(req.inProgress) || 0;
          const remaining = parseFloat(req.remaining) || 0;

          const chartData = [
            {
              name: req.subject,
              completed,
              inProgress,
              remaining,
            },
          ];
          const total = parseFloat(req.required) || 0;

          const segments = [
            { key: "completed", value: completed },
            { key: "inProgress", value: inProgress },
            { key: "remaining", value: remaining },
          ];
          const activeSegments = segments.filter((s) => s.value > 0);
          const firstKey = activeSegments[0]?.key;
          const lastKey = activeSegments[activeSegments.length - 1]?.key;

          const getRadius = (key: string): number | [number, number, number, number] => {
            if (key === firstKey && key === lastKey) return [4, 4, 4, 4];
            if (key === firstKey) return [4, 0, 0, 4];
            if (key === lastKey) return [0, 4, 4, 0];
            return 0;
          };

          return (
            <TableRow key={req.guid}>
              <TableCell>
                {req.subject}
              </TableCell>
              <TableCell className="">
                {req.completed} / {req.required}
              </TableCell>
              <TableCell className="w-full min-w-[220px]">
                <ChartContainer
                  config={chartConfig}
                  className="h-8 w-full relative overflow-visible"
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" domain={[0, total]} hide />
                    <YAxis dataKey="name" type="category" hide />
                    <ChartTooltip
                      cursor={false}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 50 }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="var(--color-completed)"
                      radius={getRadius("completed")}
                    />
                    <Bar
                      dataKey="inProgress"
                      stackId="a"
                      fill="var(--color-inProgress)"
                      radius={getRadius("inProgress")}
                    />
                    <Bar
                      dataKey="remaining"
                      stackId="a"
                      fill="var(--color-remaining)"
                      radius={getRadius("remaining")}
                    />
                  </BarChart>
                </ChartContainer>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
