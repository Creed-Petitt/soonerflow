'use client'

import { EventCalendar } from '@/components/event-calendar/event-calendar'
import { Button } from '@/components/ui/button'
import { SemesterPicker } from '@/components/semester-picker'
import { ScrollArea } from '@/components/ui/scroll-area'
import CustomNavbar from '@/components/custom-navbar'
import { BookOpen, GraduationCap } from 'lucide-react'
import { ClassBrowserPanel } from '@/components/class-browser-panel'
import { ClassDetailDialog } from '@/components/class-detail-dialog'
import { EnrolledClassCard } from '@/components/scheduler/enrolled-class-card'
import { useSchedule } from '@/hooks/use-schedule'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerActions } from '@/hooks/useSchedulerActions'
import { SidebarCalendarButtons } from '@/components/scheduler/sidebar-calendar-buttons'
import { DemoBanner } from '@/components/demo-banner'

export default function SchedulerPage() {
  // const { isLoading } = useSchedule()

  const {
    calendarEvents,
    scheduledClasses,
    totalCredits,
    selectedDate,
    setSelectedDate,
    groupedClasses,
    isInteractiveSemester,
    isLoading,
    isDemoMode,
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
    openClassDetailModal,
  } = useSchedulerActions(scheduledClasses, useSchedule().currentSemester)


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <CustomNavbar />

      <div className="flex flex-1 min-h-0">
        <div className="w-[350px] bg-background flex flex-col overflow-y-auto">
          <div className="pt-6 px-4 pb-2 flex-shrink-0">
            <div className="flex justify-center mb-3">
              <SemesterPicker />
            </div>
          </div>

          <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
            {isDemoMode && (
              <DemoBanner onBrowseClasses={() => setIsClassBrowserOpen(true)} />
            )}
            <div className="relative flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                      <p className="text-sm font-medium">Loading classes...</p>
                    </div>
                  ) : scheduledClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium mb-1">
                        No classes scheduled
                      </p>
                      <p className="text-xs">
                        Use "Browse & Add Classes" below to get started
                      </p>
                    </div>
                  ) : (
                    scheduledClasses.map(cls => {
                      const groupedClass = groupedClasses.find(
                        g => g.subject === cls.subject && g.number === cls.number
                      )
                      return (
                        <EnrolledClassCard
                          key={cls.id}
                          classData={cls as any}
                          onRemove={() => handleRemoveFromSchedule(cls.id)}
                          onSwitchSection={newSection =>
                            handleSectionSwitch(cls, newSection)
                          }
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
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            <div className="pt-3 mt-3 space-y-2 flex-shrink-0">
              <SidebarCalendarButtons />
              {isInteractiveSemester ? (
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
                <>
                  <div className="text-center py-3 px-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">
                      📚 Historical View
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Past semester - read only
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
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
              isLoading={isLoading}
              groupedClasses={groupedClasses}
              onRemoveFromSchedule={handleRemoveFromSchedule}
              onLabSwitch={handleLabSwitch}
            />
          </div>
        </div>
      </div>

      {isInteractiveSemester && (
        <ClassBrowserPanel
          isOpen={isClassBrowserOpen}
          onClose={() => setIsClassBrowserOpen(false)}
        />
      )}

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
            if (classDetailData.isChangeMode && originalScheduledClass) {
              handleSectionSwitch(originalScheduledClass, newSection)
              if (newLabSection) {
                handleLabSwitch(originalScheduledClass, newLabSection)
              }
            } else {
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