"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { AnimatedNumber } from "@/components/ui/animated-number"
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart"

interface DegreeProgressChartProps {
  creditsCompleted: number
  totalCredits: number
}

export function DegreeProgressChart({ creditsCompleted, totalCredits }: DegreeProgressChartProps) {
  const creditsRemaining = totalCredits - creditsCompleted
  
  const chartData = [{ 
    credits: "progress", 
    completed: creditsCompleted, 
    remaining: creditsRemaining 
  }]

  const chartConfig = {
    completed: {
      label: "Completed",
      color: "hsl(var(--primary))",
    },
    remaining: {
      label: "Remaining",
      color: "hsl(var(--muted))",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square w-full"
    >
      <RadialBarChart
        data={chartData}
        endAngle={360}
        innerRadius={60}
        outerRadius={80}
      >
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 8}
                      className="fill-foreground text-2xl font-bold"
                    >
                      <AnimatedNumber value={creditsCompleted} />
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 12}
                      className="fill-muted-foreground text-sm"
                    >
                      / {totalCredits}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="completed"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-completed)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="remaining"
          fill="var(--color-remaining)"
          stackId="a"
          cornerRadius={5}
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  )
}