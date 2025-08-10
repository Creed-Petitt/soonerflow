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

const chartConfig = {
  count: {
    label: "Students",
  },
  "5": {
    label: "5★",
    color: "hsl(220, 70%, 50%)", // darkest blue
  },
  "4": {
    label: "4★", 
    color: "hsl(220, 70%, 60%)", // dark blue
  },
  "3": {
    label: "3★",
    color: "hsl(220, 70%, 70%)", // medium blue
  },
  "2": {
    label: "2★",
    color: "hsl(220, 70%, 80%)", // light blue
  },
  "1": {
    label: "1★",
    color: "hsl(220, 70%, 90%)", // lightest blue
  },
} satisfies ChartConfig

export function ProfessorRatingBarChart({ ratingDistribution }: ProfessorRatingBarChartProps) {
  // Fix the rating order: [1★, 2★, 3★, 4★, 5★] -> display as [5★, 4★, 3★, 2★, 1★]
  // Handle undefined or empty ratingDistribution
  const safeDistribution = ratingDistribution || [0, 0, 0, 0, 0];
  
  const chartData = [
    { rating: "5", count: safeDistribution[4] || 0, fill: "hsl(220, 70%, 50%)" },
    { rating: "4", count: safeDistribution[3] || 0, fill: "hsl(220, 70%, 60%)" },
    { rating: "3", count: safeDistribution[2] || 0, fill: "hsl(220, 70%, 70%)" },
    { rating: "2", count: safeDistribution[1] || 0, fill: "hsl(220, 70%, 80%)" },
    { rating: "1", count: safeDistribution[0] || 0, fill: "hsl(220, 70%, 90%)" },
  ]

  return (
    <ChartContainer config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{
          left: -20,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <YAxis
          dataKey="rating"
          type="category"
          tickLine={false}
          tickMargin={5}
          axisLine={false}
          tick={{ fontSize: 16, fontWeight: 'bold', fill: 'black' }}
          tickFormatter={(value) =>
            chartConfig[value as keyof typeof chartConfig]?.label
          }
        />
        <XAxis dataKey="count" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" layout="vertical" radius={5} />
      </BarChart>
    </ChartContainer>
  )
}