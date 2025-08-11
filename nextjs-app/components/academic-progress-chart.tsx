"use client"

import { useState, useEffect } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  progress: {
    label: "Progress",
    color: "rgb(220, 38, 38)",
  },
} satisfies ChartConfig

interface AcademicProgressChartProps {
  currentYear: number // 1 = Freshman, 2 = Sophomore, etc.
  graduationDate: string
  enrollmentYear?: number
  graduationYear?: number
}

export function AcademicProgressChart({ 
  currentYear, 
  graduationDate, 
  enrollmentYear, 
  graduationYear 
}: AcademicProgressChartProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => {
      setIsAnimating(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [enrollmentYear, graduationYear])
  
  // Generate dynamic chart data with realistic plateaus
  const generateChartData = () => {
    if (!enrollmentYear || !graduationYear) {
      // Return empty data instead of hardcoded values
      return [];
    }
    
    const totalYears = graduationYear - enrollmentYear;
    const data = [];
    const currentDate = new Date();
    const currentYearNum = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    for (let i = 0; i <= totalYears; i++) {
      const year = enrollmentYear + i;
      let progress;
      
      if (i === 0) {
        progress = 5; // Start of freshman year
      } else if (i === totalYears) {
        progress = 100; // Graduation
      } else {
        // Create realistic progress with plateaus
        // Slower progress in summer (months 5-7), faster in semesters
        const baseProgress = (i / totalYears) * 100;
        
        // Add variations for more realistic progression
        if (i === 1) progress = 25; // End of freshman
        else if (i === 2) progress = 50; // End of sophomore  
        else if (i === 3) progress = 75; // End of junior
        else progress = baseProgress;
        
        // If this is the current year, calculate based on month
        if (year === currentYearNum) {
          const yearProgress = currentMonth / 12;
          const prevProgress = i === 1 ? 5 : (i - 1) * 25;
          const nextProgress = i * 25;
          progress = prevProgress + (nextProgress - prevProgress) * yearProgress;
        }
      }
      
      data.push({
        year: year.toString(),
        progress: Math.round(progress)
      });
    }
    
    return data;
  };
  
  const chartData = generateChartData();
  
  // Calculate the gradient stop position based on current progress
  const calculateGradientStop = () => {
    if (!enrollmentYear || !graduationYear) return "50%";
    
    const currentDate = new Date();
    const enrollDate = new Date(enrollmentYear, 8, 1); // September 1st
    const gradDate = new Date(graduationYear, 4, 15); // May 15th
    
    const totalTime = gradDate.getTime() - enrollDate.getTime();
    const elapsedTime = currentDate.getTime() - enrollDate.getTime();
    const progressPercent = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    
    return `${progressPercent}%`;
  };
  
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
        className="animate-[scale_0.5s_ease-out]"
      />
    );
  };
  
  // Don't render chart if no data
  if (chartData.length === 0) {
    return <div className="w-full h-full" />
  }
  
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
          key={`line-${enrollmentYear}-${graduationYear}`} // Force re-render for animation
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop key="stop-1" offset="0%" stopColor="rgb(220, 38, 38)" />
              <stop key="stop-2" offset={calculateGradientStop()} stopColor="rgb(220, 38, 38)" />
              <stop key="stop-3" offset={calculateGradientStop()} stopColor="rgb(254, 202, 202)" />
              <stop key="stop-4" offset="100%" stopColor="rgb(254, 202, 202)" />
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
            isAnimationActive={isAnimating}
            animationBegin={0}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}