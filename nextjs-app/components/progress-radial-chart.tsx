"use client"

import { useState, useEffect } from "react"
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
  // Animate credits from 0 to actual value
  const [animatedCredits, setAnimatedCredits] = useState(0)
  
  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setAnimatedCredits(creditsCompleted)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [creditsCompleted])
  
  const creditsRemaining = totalCredits - animatedCredits
  
  const chartData = [{ 
    credits: "progress", 
    completed: animatedCredits, 
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
        startAngle={0}
        endAngle={180}
        innerRadius={120}
        outerRadius={180}
        margin={{ top: 100, right: 20, bottom: 0, left: 20 }}
        key={`radial-${creditsCompleted}`} // Force re-render for animation
      >
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={(viewBox.cy || 0) - 30} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 45}
                      className="fill-foreground text-2xl font-bold transition-all duration-1000"
                    >
                      {animatedCredits}/{totalCredits}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 18}
                      className="fill-muted-foreground text-xl"
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
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </RadialBarChart>
    </ChartContainer>
  )
}