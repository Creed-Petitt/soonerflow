"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
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

interface RatingDistributionBarChartProps {
  ratingDistribution: number[]
  professorName: string
  className?: string
}

const chartConfig = {
  ratings: {
    label: "Ratings",
    color: "#94a3b8",
  },
} satisfies ChartConfig

export function RatingDistributionBarChart({ 
  ratingDistribution, 
  professorName,
  className 
}: RatingDistributionBarChartProps) {
  // Convert rating distribution to chart data
  const chartData = [
    { star: "1★", ratings: ratingDistribution[0] || 0 },
    { star: "2★", ratings: ratingDistribution[1] || 0 },
    { star: "3★", ratings: ratingDistribution[2] || 0 },
    { star: "4★", ratings: ratingDistribution[3] || 0 },
    { star: "5★", ratings: ratingDistribution[4] || 0 },
  ]

  const totalRatings = ratingDistribution.reduce((sum, count) => sum + count, 0)

  // Don't render the chart if there are no ratings
  if (totalRatings === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="star"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Bar dataKey="ratings" fill="#94a3b8" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => value > 0 ? value : ''}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-0">
        <div className="flex gap-2 leading-none font-medium">
          Based on {totalRatings} student ratings <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Real RateMyProfessor data from student reviews
        </div>
      </CardFooter>
    </Card>
  )
}