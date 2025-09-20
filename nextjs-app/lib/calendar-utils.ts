import { parseClassTime } from '@/lib/time-utils';
import type { CalendarEvent } from '@/components/event-calendar/types';
import type { ScheduledClass } from '@/lib/schedule-api';

function createTimeDate(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function processCalendarEvents(classes: ScheduledClass[]): CalendarEvent[] {
  return classes
    .map(classData => {
      const parsedTime = parseClassTime(classData.time);

      if (!parsedTime) return [];

      return parsedTime.days.map(day => ({
        id: `${classData.id}-${day}`,
        title: `${classData.subject} ${classData.number}`,
        description: `${classData.title}\n${classData.instructor}\n${classData.location}`,
        start: createTimeDate(parsedTime.startTime.hour, parsedTime.startTime.min),
        end: createTimeDate(parsedTime.endTime.hour, parsedTime.endTime.min),
        color: 'sky' as const
      }));
    })
    .flat();
}

export function groupClassesBySubject(classes: ScheduledClass[]) {
  const subjects = Array.from(new Set(classes.map(cls => cls.subject)));
  return subjects;
}

export function getSemesterDates() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  let semesterStart: Date;
  let semesterEnd: Date;

  if (currentMonth >= 8) {
    semesterStart = new Date(currentYear, 7, 15);
    semesterEnd = new Date(currentYear, 11, 15);
  } else if (currentMonth >= 1 && currentMonth <= 5) {
    semesterStart = new Date(currentYear, 0, 15);
    semesterEnd = new Date(currentYear, 4, 15);
  } else {
    semesterStart = new Date(currentYear, 5, 1);
    semesterEnd = new Date(currentYear, 6, 31);
  }

  return { semesterStart, semesterEnd };
}