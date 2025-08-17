"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { useSchedule } from "@/hooks/use-schedule"
import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function TodaysScheduleWidget() {
  const { scheduledClasses } = useSchedule()
  
  // Get today's classes from scheduled classes
  const todaysClasses = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    // Map day number to day letter
    const dayMap: { [key: number]: string[] } = {
      1: ['M'],
      2: ['T'],
      3: ['W'],
      4: ['R', 'Th'],
      5: ['F']
    }
    
    const todayLetters = dayMap[dayOfWeek] || []
    
    const classes = scheduledClasses.filter(cls => {
      if (!cls.time || cls.time === 'TBA') return false
      
      // Parse "MWF 10:00 am-10:50 am" format
      const parts = cls.time.split(' ')
      if (parts.length < 3) return false
      
      const days = parts[0]
      
      // Check if class meets today
      return todayLetters.some(letter => {
        if (letter === 'Th') {
          return days.includes('Th')
        }
        return days.includes(letter)
      })
    })
    
    // Sort by time
    return classes.sort((a, b) => {
      const getStartTime = (timeStr: string) => {
        const parts = timeStr.split(' ')
        if (parts.length < 2) return 0
        const timeRange = parts.slice(1).join(' ')
        const startTime = timeRange.split('-')[0]
        const cleanTime = startTime.trim()
        const isPM = cleanTime.includes('pm')
        const isAM = cleanTime.includes('am')
        const timeOnly = cleanTime.replace(/[ap]m/g, '').trim()
        const [hourStr, minStr] = timeOnly.split(':')
        let hour = parseInt(hourStr)
        const min = parseInt(minStr) || 0
        
        if (isPM && hour !== 12) hour += 12
        if (isAM && hour === 12) hour = 0
        
        return hour * 60 + min
      }
      
      return getStartTime(a.time || '') - getStartTime(b.time || '')
    })
  }, [scheduledClasses])
  
  // Get next class if no classes today
  const nextClass = useMemo(() => {
    if (todaysClasses.length > 0) return null
    
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    
    // Find next class in the week
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const targetDay = (currentDayOfWeek + daysAhead) % 7
      
      const dayMap: { [key: number]: string[] } = {
        1: ['M'],
        2: ['T'],
        3: ['W'],
        4: ['R', 'Th'],
        5: ['F']
      }
      
      const targetLetters = dayMap[targetDay] || []
      
      const nextDayClasses = scheduledClasses.filter(cls => {
        if (!cls.time || cls.time === 'TBA') return false
        
        const parts = cls.time.split(' ')
        if (parts.length < 3) return false
        
        const days = parts[0]
        
        return targetLetters.some(letter => {
          if (letter === 'Th') {
            return days.includes('Th')
          }
          return days.includes(letter)
        })
      })
      
      if (nextDayClasses.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return {
          day: dayNames[targetDay],
          daysAway: daysAhead,
          class: nextDayClasses[0]
        }
      }
    }
    
    return null
  }, [scheduledClasses, todaysClasses])
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Today's Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaysClasses.length > 0 ? (
          <div className="space-y-3">
            {todaysClasses.map((cls, index) => {
              // Parse time for display
              const timeParts = cls.time?.split(' ') || []
              const timeRange = timeParts.slice(1).join(' ')
              
              return (
                <div key={index} className="border-l-2 border-primary pl-3 py-1">
                  <div className="font-medium text-sm">
                    {cls.subject} {cls.number}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeRange || 'Time TBA'}
                    </div>
                    {cls.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {cls.location}
                      </div>
                    )}
                    {cls.instructor && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {cls.instructor}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No classes scheduled for today
            </p>
            {nextClass && (
              <div className="text-xs text-muted-foreground">
                <p className="mb-1">Next class: {nextClass.day}</p>
                <p className="font-medium">
                  {nextClass.class.subject} {nextClass.class.number}
                </p>
              </div>
            )}
            <Link href="/scheduler">
              <Button variant="outline" size="sm" className="mt-3">
                View Full Schedule
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}