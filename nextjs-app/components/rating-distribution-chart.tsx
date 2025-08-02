"use client"

import * as React from "react"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface RatingDistributionChartProps {
  ratingDistribution: number[] // [1★, 2★, 3★, 4★, 5★] counts
  className?: string
}

export function RatingDistributionChart({ 
  ratingDistribution, 
  className 
}: RatingDistributionChartProps) {
  const data = [
    { name: "1★", value: ratingDistribution[0] || 0, fill: "#ef4444" },
    { name: "2★", value: ratingDistribution[1] || 0, fill: "#f97316" },
    { name: "3★", value: ratingDistribution[2] || 0, fill: "#eab308" },
    { name: "4★", value: ratingDistribution[3] || 0, fill: "#84cc16" },
    { name: "5★", value: ratingDistribution[4] || 0, fill: "#10b981" },
  ].filter(item => item.value > 0) // Only show segments with data

  const total = ratingDistribution.reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground text-sm ${className}`}>
        No rating data available
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = Math.round((data.value / total) * 100)
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-md">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} reviews ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0 w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={65}
                strokeWidth={2}
                stroke="hsl(var(--border))"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 py-2">
          {data.map((item) => {
            const percentage = Math.round((item.value / total) * 100)
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <div className="text-muted-foreground text-sm font-medium">
                  {item.value} ({percentage}%)
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}