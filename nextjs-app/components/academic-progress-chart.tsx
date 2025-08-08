"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { year: "2024", progress: 10 },   // Start low (freshman)
  { year: "2025", progress: 35 },   // Go up (sophomore)
  { year: "2026", progress: 37 },   // Plateau (junior)
  { year: "2027", progress: 100 },  // Finish at top (senior/graduation)
]

const chartConfig = {
  progress: {
    label: "Progress",
    color: "rgb(220, 38, 38)",
  },
} satisfies ChartConfig

interface AcademicProgressChartProps {
  currentYear: number // 1 = Freshman, 2 = Sophomore, etc.
  graduationDate: string
}

export function AcademicProgressChart({ currentYear, graduationDate }: AcademicProgressChartProps) {
  // Custom dot to show completed vs future
  const customDot = (props: any) => {
    const { cx, cy, index } = props;
    const isCompleted = index < currentYear;
    const fillColor = isCompleted ? "rgb(220, 38, 38)" : "rgb(254, 202, 202)";
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={fillColor}
      />
    );
  };
  
  return (
    <div className="w-full h-full flex flex-col justify-between p-4">
      <p className="text-sm text-muted-foreground text-left">{graduationDate}</p>
      
      <ChartContainer config={chartConfig} className="w-full h-[110px] -mt-[10px]">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 35,
            left: 12,
            right: 12,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(220, 38, 38)" />
              <stop offset="50%" stopColor="rgb(220, 38, 38)" />
              <stop offset="50%" stopColor="rgb(254, 202, 202)" />
              <stop offset="100%" stopColor="rgb(254, 202, 202)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Line
            dataKey="progress"
            type="natural"
            stroke="url(#lineGradient)"
            strokeWidth={2}
            dot={customDot}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}