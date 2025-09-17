"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProfessorRatingBarChartProps {
  ratingDistribution: number[]
}

export function ProfessorRatingBarChart({ ratingDistribution }: ProfessorRatingBarChartProps) {
  const chartData = [
    { stars: "5★", count: ratingDistribution[4] || 0, fill: "hsl(142, 76%, 36%)" }, // Green
    { stars: "4★", count: ratingDistribution[3] || 0, fill: "hsl(141, 50%, 48%)" }, // Light green
    { stars: "3★", count: ratingDistribution[2] || 0, fill: "hsl(47, 96%, 53%)" },  // Yellow
    { stars: "2★", count: ratingDistribution[1] || 0, fill: "hsl(25, 95%, 53%)" },  // Orange
    { stars: "1★", count: ratingDistribution[0] || 0, fill: "hsl(0, 84%, 60%)" },   // Red
  ]

  const chartConfig = {
    count: {
      label: "Ratings",
    },
  } satisfies ChartConfig

  // Calculate total for percentage display
  const total = ratingDistribution.reduce((sum, count) => sum + count, 0)

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-28 w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <YAxis
            dataKey="stars"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={2}
            width={30}
            interval={0}
            className="text-xs"
          />
          <XAxis 
            dataKey="count" 
            type="number" 
            hide 
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent 
                hideLabel 
                formatter={(value) => {
                  const percentage = total > 0 ? ((value as number / total) * 100).toFixed(1) : 0
                  return `${value} ratings (${percentage}%)`
                }}
              />
            }
          />
          <Bar 
            dataKey="count" 
            layout="vertical" 
            radius={[0, 4, 4, 0]}
            minPointSize={2}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}