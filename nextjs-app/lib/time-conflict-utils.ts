import { parseClassTime, ParsedTime } from './time-utils';
import type { ScheduledClass } from '@/types/course';

export interface TimeConflict {
  conflictingClass: ScheduledClass;
  conflictingDays: string[];
}

function timeToMinutes(time: ParsedTime): number {
  return time.hour * 60 + time.min;
}

function timesOverlap(start1: ParsedTime, end1: ParsedTime, start2: ParsedTime, end2: ParsedTime): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // Check if time ranges overlap
  return start1Min < end2Min && start2Min < end1Min;
}

function findConflictingDays(days1: string[], days2: string[]): string[] {
  return days1.filter(day => days2.includes(day));
}

export function checkTimeConflict(
  newClass: ScheduledClass,
  existingClasses: ScheduledClass[]
): TimeConflict | null {
  const newClassTime = parseClassTime(newClass.time);

  if (!newClassTime) {
    return null; // Can't check conflict if time can't be parsed
  }

  for (const existingClass of existingClasses) {
    const existingClassTime = parseClassTime(existingClass.time);

    if (!existingClassTime) {
      continue; // Skip if existing class time can't be parsed
    }

    // Find overlapping days
    const conflictingDays = findConflictingDays(newClassTime.days, existingClassTime.days);

    if (conflictingDays.length > 0) {
      // Check if times overlap on those days
      const hasTimeOverlap = timesOverlap(
        newClassTime.startTime,
        newClassTime.endTime,
        existingClassTime.startTime,
        existingClassTime.endTime
      );

      if (hasTimeOverlap) {
        return {
          conflictingClass: existingClass,
          conflictingDays
        };
      }
    }
  }

  return null; // No conflicts found
}

export function hasTimeConflict(
  newClass: ScheduledClass,
  existingClasses: ScheduledClass[]
): boolean {
  return checkTimeConflict(newClass, existingClasses) !== null;
}

export function formatConflictMessage(conflict: TimeConflict): string {
  const daysStr = conflict.conflictingDays.join('');
  return `Time conflict with ${conflict.conflictingClass.subject} ${conflict.conflictingClass.number} on ${daysStr}`;
}