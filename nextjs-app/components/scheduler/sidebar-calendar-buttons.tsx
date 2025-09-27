import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { AcademicCalendarModal } from "@/components/modals/academic-calendar-modal"
import { FinalsScheduleModal } from "@/components/modals/finals-schedule-modal"

// Custom Academic Calendar Icon
const AcademicCalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
    <path d="M300-80q-59 0-99.5-40.5T160-220v-520q0-58 40.5-99t99.5-41h500v600q-26 0-43 17.5T740-220q0 26 17 43t43 17v80H300Zm0-80h373q-6-14-9.5-28.5T660-220q0-16 3-31t10-29H300q-26 0-43 17.5T240-220q0 26 17 43t43 17Zm-60-187q14-7 28.5-10t31.5-3h420v-440H300q-26 0-43 17.5T240-740v393Zm109-93h49l25-71h113l25 71h49L504-720h-50L349-440Zm88-112 41-116h3l41 116h-85ZM240-347v-453 453Z"/>
  </svg>
)

export function SidebarCalendarButtons() {
  const [showAcademicCalendar, setShowAcademicCalendar] = useState(false)
  const [showFinalsSchedule, setShowFinalsSchedule] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs justify-start"
          onClick={() => setShowAcademicCalendar(true)}
        >
          <AcademicCalendarIcon className="h-3 w-3 mr-1.5" />
          Academic
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs justify-start"
          onClick={() => setShowFinalsSchedule(true)}
        >
          <Clock className="h-3 w-3 mr-1.5" />
          Finals
        </Button>
      </div>

      <AcademicCalendarModal
        isOpen={showAcademicCalendar}
        onClose={() => setShowAcademicCalendar(false)}
      />

      <FinalsScheduleModal
        isOpen={showFinalsSchedule}
        onClose={() => setShowFinalsSchedule(false)}
      />
    </>
  )
}