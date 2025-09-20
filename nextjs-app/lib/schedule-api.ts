import { fetchWithAuth } from "@/lib/api-client";

export interface ScheduledClass {
  id: string;
  subject: string;
  number: string;
  title: string;
  instructor: string;
  time: string;
  location: string;
  credits: number;
  type?: string;
  color: string;
  available_seats?: number;
  total_seats?: number;
  rating?: number;
  difficulty?: number;
  wouldTakeAgain?: number;
}

export interface Schedule {
  schedule_id: number;
  schedule_name: string;
  semester: string;
  classes: ScheduledClass[];
}

export async function fetchUserActiveSchedule(githubId: string): Promise<Schedule> {
  const response = await fetchWithAuth(`/api/users/${githubId}/active-schedule`);

  if (!response.ok) {
    throw new Error('Failed to load schedule');
  }

  const data = await response.json();

  // Remove duplicates by ID
  const classMap = new Map<string, ScheduledClass>();
  (data.classes || []).forEach((cls: ScheduledClass) => {
    if (!classMap.has(cls.id)) {
      classMap.set(cls.id, cls);
    }
  });
  const uniqueClasses = Array.from(classMap.values());

  return { ...data, classes: uniqueClasses };
}

export async function saveScheduleClasses(
  scheduleId: number,
  classIds: string[],
  colors: Record<string, string>
): Promise<void> {
  const response = await fetch(`/api/schedules/${scheduleId}/classes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_ids: classIds, colors }),
  });

  if (!response.ok) {
    throw new Error('Failed to save schedule');
  }
}