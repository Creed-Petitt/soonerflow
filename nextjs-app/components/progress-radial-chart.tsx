"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

export interface ProgressRadialChartProps {
  creditsCompleted: number
  totalCredits: number
}

export function ProgressRadialChart({ creditsCompleted, totalCredits }: ProgressRadialChartProps) {
  const creditsRemaining = totalCredits - creditsCompleted
  
  const chartData = [{ 
    credits: "progress", 
    completed: creditsCompleted, 
    remaining: creditsRemaining 
  }]

  const chartConfig = {
    completed: {
      label: "Completed",
      color: "rgb(220, 38, 38)",  // red-600
    },
    remaining: {
      label: "Remaining",
      color: "rgb(254, 202, 202)",  // red-200
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full h-full"
      style={{ margin: 0, padding: 0 }}
    >
      <RadialBarChart
        data={chartData}
        endAngle={180}
        innerRadius={80}
        outerRadius={120}
        margin={{ top: 48, right: 0, bottom: 0, left: 0 }}
      >
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={(viewBox.cy || 0) - 19} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 27}
                      className="fill-foreground text-lg font-bold"
                    >
                      {creditsCompleted}/{totalCredits}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 11}
                      className="fill-muted-foreground text-base"
                    >
                      Credits
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="remaining"
          stackId="a"
          cornerRadius={5}
          fill="rgb(254, 202, 202)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="completed"
          fill="rgb(220, 38, 38)"
          stackId="a"
          cornerRadius={5}
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  )
}