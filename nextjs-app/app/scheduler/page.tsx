"use client"

import { EventCalendar } from "@/components/event-calendar/event-calendar"
import { Button } from "@/components/ui/button"
import { SemesterPicker } from "@/components/semester-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import CustomNavbar from "@/components/custom-navbar"
import { BookOpen, GraduationCap } from "lucide-react"
import { ClassBrowserPanel } from "@/components/class-browser-panel"
import { ClassDetailDialog } from "@/components/class-detail-dialog"
import { EnrolledClassCard } from "@/components/scheduler/enrolled-class-card"
import { useSchedule } from "@/hooks/use-schedule"
import { useSchedulerData } from "@/hooks/useSchedulerData"
import { useSchedulerActions } from "@/hooks/useSchedulerActions"
import Link from "next/link"

export default function SchedulerPage() {
  const { isSaving } = useSchedule()

  const {
    calendarEvents,
    scheduledClasses,
    totalCredits,
    selectedDate,
    setSelectedDate,
    groupedClasses,
    isInteractiveSemester,
    semesterDates
  } = useSchedulerData()

  const {
    isClassBrowserOpen,
    setIsClassBrowserOpen,
    showClassDetailModal,
    setShowClassDetailModal,
    classDetailData,
    setClassDetailData,
    originalScheduledClass,
    setOriginalScheduledClass,
    handleRemoveFromSchedule,
    handleSectionSwitch,
    handleLabSwitch,
    handleEventSelect,
    openClassDetailModal
  } = useSchedulerActions(scheduledClasses, useSchedule().currentSemester)

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <CustomNavbar />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Expanded for Date Picker and Course Ledger */}
        <div className="w-[350px] bg-background flex flex-col overflow-y-auto">
          {/* Semester Picker */}
          <div className="pt-6 px-4 pb-2 flex-shrink-0">
            <div className="flex justify-center mb-3">
              <SemesterPicker />
            </div>
            
          </div>

          {/* Enrolled Classes Ledger */}
          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
            <div className="relative flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                {scheduledClasses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">No classes scheduled</p>
                    <p className="text-xs">
                      Add classes from your{" "}
                      <Link href="/dashboard" className="text-primary underline">
                        degree tracker
                      </Link>
                    </p>
                  </div>
                ) : (
                  scheduledClasses.map((cls) => {
                    const groupedClass = groupedClasses.find(g => 
                      g.subject === cls.subject && g.number === cls.number
                    )
                    return (
                      <EnrolledClassCard
                        key={cls.id}
                        classData={cls}
                        onRemove={() => handleRemoveFromSchedule(cls.id)}
                        onSwitchSection={(newSection) => handleSectionSwitch(cls, newSection)}
                        availableSections={groupedClass?.sections}
                        availableLabSections={groupedClass?.labSections}
                        showRemoveButton={isInteractiveSemester}
                        onClick={() => openClassDetailModal(cls)}
                        isCurrentSemester={isInteractiveSemester}
                      />
                    )
                  })
                )}
                </div>
              </ScrollArea>
              {/* Subtle gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            {/* Actions */}
            <div className="pt-3 mt-3 space-y-2 flex-shrink-0">
              {isInteractiveSemester ? (
                // Current or future semester: Show interactive controls
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsClassBrowserOpen(true)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse & Add Classes
                  </Button>
                  
                </>
              ) : (
                // Past semester: Show read-only message and export only
                <>
                  <div className="text-center py-3 px-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">📚 Historical View</p>
                    <p className="text-xs text-muted-foreground">
                      Past semester - read only
                    </p>
                  </div>
                  
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar - EventCalendar already has the pills */}
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
            <EventCalendar
              events={calendarEvents}
              onEventSelect={handleEventSelect}
              initialView="week"
              currentDate={selectedDate}
              onDateChange={setSelectedDate}
              className="h-full"
              scheduledClasses={scheduledClasses}
              totalCredits={totalCredits}
              isSaving={isSaving}
              groupedClasses={groupedClasses}
              onRemoveFromSchedule={handleRemoveFromSchedule}
              onLabSwitch={handleLabSwitch}
            />
          </div>
        </div>
      </div>
      
      {/* Class Browser Panel - only for current and future semesters */}
      {isInteractiveSemester && (
        <ClassBrowserPanel
          isOpen={isClassBrowserOpen}
          onClose={() => setIsClassBrowserOpen(false)}
        />
      )}
      
      {/* Class Detail Modal */}
      {showClassDetailModal && classDetailData && (
        <ClassDetailDialog
          isOpen={showClassDetailModal}
          onClose={() => {
            setShowClassDetailModal(false)
            setClassDetailData(null)
            setOriginalScheduledClass(null)
          }}
          groupedClass={classDetailData.groupedClass}
          selectedSection={classDetailData.selectedSection}
          isChangeMode={classDetailData.isChangeMode}
          onAddToSchedule={(newSection, newLabSection) => {
            // This will be handled by the enhanced ClassDetailDialog
            // which will determine if this is an add or change operation
            if (classDetailData.isChangeMode && originalScheduledClass) {
              // Change mode - replace the existing class
              handleSectionSwitch(originalScheduledClass, newSection)
              if (newLabSection) {
                // Handle lab switching if needed
                handleLabSwitch(originalScheduledClass, newLabSection)
              }
            } else {
              // Add mode - add new class (shouldn't happen from calendar)
            }
            
            setShowClassDetailModal(false)
            setClassDetailData(null)
            setOriginalScheduledClass(null)
          }}
        />
      )}
    </div>
  )
}