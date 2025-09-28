"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ClassCardSkeleton() {
  return (
    <Card className="p-2 relative">
      {/* Colored left border skeleton */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted rounded-l" />

      <div className="pl-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Subject and number */}
            <Skeleton className="h-4 w-24 mb-1" />
            {/* Title */}
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Remove button placeholder */}
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </Card>
  )
}

interface ClassCardSkeletonListProps {
  count?: number
}

export function ClassCardSkeletonList({ count = 3 }: ClassCardSkeletonListProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ClassCardSkeleton key={i} />
      ))}
    </div>
  )
}