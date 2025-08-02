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
    color: "var(--chart-1)",
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Rating Distribution</CardTitle>
        <CardDescription>{professorName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="star"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="ratings" fill="var(--color-ratings)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
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