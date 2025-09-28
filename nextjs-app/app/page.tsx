"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassCardSkeletonList } from "@/components/ui/class-card-skeleton";
import { CalendarSkeleton } from "@/components/ui/calendar-skeleton";
import CustomNavbar from "@/components/custom-navbar";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to scheduler since that's the only page now
    router.push("/scheduler");
  }, [router]);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <CustomNavbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar skeleton */}
        <div className="w-[350px] bg-background flex flex-col overflow-y-auto">
          <div className="pt-6 px-4 pb-2 flex-shrink-0">
            <div className="flex justify-center mb-3">
              {/* Semester picker skeleton */}
              <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
            </div>
          </div>

          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
            <div className="relative flex-1 min-h-0">
              <ScrollArea className="h-full">
                <ClassCardSkeletonList count={4} />
              </ScrollArea>
            </div>

            <div className="pt-3 mt-3 space-y-2 flex-shrink-0">
              {/* Browse classes button skeleton */}
              <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <CalendarSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}