"use client"

import { useState } from "react"
import type { CalendarEvent } from "@/components/event-calendar/types"
import type { ClassData, ScheduledClass } from "@/types/course"
import { useSchedule } from "@/hooks/use-schedule"

const classColors = [
  { bg: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-green-500', hex: '#10b981' },
  { bg: 'bg-purple-500', hex: '#8b5cf6' },
  { bg: 'bg-orange-500', hex: '#f97316' },
  { bg: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-teal-500', hex: '#14b8a6' },
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-red-500', hex: '#ef4444' }
]

export function useSchedulerActions(
  scheduledClasses: ScheduledClass[],
  currentSemester: string
) {
  const {
    addClass: addToPersistedSchedule,
    removeClass: removeFromPersistedSchedule,
  } = useSchedule()

  const [isClassBrowserOpen, setIsClassBrowserOpen] = useState(false)
  const [showClassDetailModal, setShowClassDetailModal] = useState(false)
  const [classDetailData, setClassDetailData] = useState<any>(null)
  const [originalScheduledClass, setOriginalScheduledClass] = useState<any>(null)

  const handleRemoveFromSchedule = (classId: string) => {
    const classToRemove = scheduledClasses.find(cls => cls.id === classId)
    if (!classToRemove) return

    const classesToRemove = [classId]

    if (classToRemove.type !== 'Lab with No Credit') {
      const associatedLabs = scheduledClasses.filter(cls =>
        cls.subject === classToRemove.subject &&
        cls.number === classToRemove.number &&
        cls.type === 'Lab with No Credit'
      )
      classesToRemove.push(...associatedLabs.map(lab => lab.id))
    }

    classesToRemove.forEach(id => removeFromPersistedSchedule(id))
  }

  const handleSectionSwitch = (currentClass: ClassData, newSection: ClassData) => {
    removeFromPersistedSchedule(currentClass.id)

    addToPersistedSchedule({
      ...newSection,
      color: scheduledClasses.find(cls => cls.id === currentClass.id)?.colorHex || classColors[0].hex,
      number: newSection.number || '',
    } as any)
  }

  const handleLabSwitch = (currentLabClass: ClassData, newLabSection: ClassData) => {
    handleSectionSwitch(currentLabClass, newLabSection)
  }

  const handleEventSelect = async (event: CalendarEvent) => {
    const classId = event.id.split('-')[0]
    const scheduledClass = scheduledClasses.find(cls => cls.id === classId)

    if (!scheduledClass) {
      return
    }

    await openClassDetailModal(scheduledClass)
  }

  const openClassDetailModal = async (scheduledClass: ScheduledClass) => {
    try {
      setOriginalScheduledClass(scheduledClass)
      setShowClassDetailModal(true)
      setClassDetailData(null)

      const apiUrl = `/api/classes?subject=${scheduledClass.subject}&search=${scheduledClass.number}&semester=${currentSemester}&limit=50`

      const response = await fetch(apiUrl)

      if (response.ok) {
        const data = await response.json()
        const allClasses = data.classes || []

        const classes = allClasses.filter((c: any) =>
          c.subject === scheduledClass.subject && c.number === scheduledClass.number
        )

        if (classes.length > 0) {
          const groupedClass = {
            subject: scheduledClass.subject,
            number: scheduledClass.number,
            title: classes[0].title || scheduledClass.title,
            credits: classes[0].credits || scheduledClass.credits,
            sections: classes.filter((c: any) => c.type !== 'Lab with No Credit'),
            labSections: classes.filter((c: any) => c.type === 'Lab with No Credit')
          }

          const currentSection = classes.find((c: any) => c.id === scheduledClass.id) || classes[0]

          setClassDetailData({
            groupedClass,
            selectedSection: currentSection,
            isChangeMode: true
          })
        } else {
          setShowClassDetailModal(false)
        }
      } else {
        setShowClassDetailModal(false)
      }
    } catch (error) {
      console.error('Error opening class detail modal:', error)
      setShowClassDetailModal(false)
    }
  }

  return {
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
  }
}