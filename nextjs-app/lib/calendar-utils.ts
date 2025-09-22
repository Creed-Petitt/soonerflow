import { parseClassTime } from '@/lib/time-utils';
import type { CalendarEvent } from '@/components/event-calendar/types';
import type { ScheduledClass } from '@/types/course';

// Helper to get a date for a specific day of the week in a template week
function getTemplateDateForDay(dayChar: string, hour: number, minute: number): Date {
    const templateMonday = new Date(2025, 0, 6); // A fixed Monday: Jan 6, 2025
    let dayOffset = 0;
    switch (dayChar) {
        case 'M': dayOffset = 0; break;
        case 'T': dayOffset = 1; break;
        case 'W': dayOffset = 2; break;
        case 'R': dayOffset = 3; break; // 'R' for Thursday
        case 'F': dayOffset = 4; break;
        default: dayOffset = 0; // Default to Monday
    }
    const date = new Date(templateMonday);
    date.setDate(templateMonday.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
}

export function processCalendarEvents(classes: ScheduledClass[]): CalendarEvent[] {
  return classes
    .map(classData => {
      const parsedTime = parseClassTime(classData.time);

      if (!parsedTime) return [];

      // The 'days' from parseClassTime is an array of characters like ['M', 'W', 'F']
      return parsedTime.days.map(dayChar => ({
        id: `${classData.id}-${dayChar}`,
        title: `${classData.subject} ${classData.number}`,
        description: `${classData.title}\n${classData.instructor}\n${classData.location}`,
        start: getTemplateDateForDay(dayChar, parsedTime.startTime.hour, parsedTime.startTime.min),
        end: getTemplateDateForDay(dayChar, parsedTime.endTime.hour, parsedTime.endTime.min),
        color: classData.colorHex
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