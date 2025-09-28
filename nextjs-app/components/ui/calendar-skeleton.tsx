"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function CalendarSkeleton() {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 9 PM

  return (
    <div className="flex h-full flex-col">
      <div className="bg-background/80 border-border/70 sticky top-0 z-30 grid border-b backdrop-blur-md" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
        <div className="py-2 text-center">
          <Skeleton className="h-4 w-8 mx-auto" />
        </div>
        {dayNames.map((dayName, index) => (
          <div key={index} className="py-2 text-center">
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="relative h-full overflow-auto">
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
            {timeSlots.map((hour) => (
              <React.Fragment key={hour}>
                <div className="border-b border-border/30 py-3 pr-2 text-right">
                  <Skeleton className="h-3 w-10 ml-auto" />
                </div>

                {dayNames.map((_, dayIndex) => (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className="border-b border-r border-border/30 relative min-h-[60px] p-1"
                  >
                    {Math.random() > 0.7 && (
                      <Skeleton className="h-12 w-full rounded-sm" />
                    )}
                    {Math.random() > 0.8 && (
                      <Skeleton className="h-8 w-3/4 rounded-sm mt-1" />
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}