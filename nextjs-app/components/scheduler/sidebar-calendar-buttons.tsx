import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { AcademicCalendarModal } from "@/components/modals/academic-calendar-modal"
import { FinalsScheduleModal } from "@/components/modals/finals-schedule-modal"

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
          <Calendar className="h-3 w-3 mr-1.5" />
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