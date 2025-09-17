"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchWithAuth } from "@/lib/api-client";

interface Course {
  code: string;
  name?: string;
  title?: string;
  credits?: number;
  semester?: string;
  grade?: string;
  time?: string;
  location?: string;
  instructor?: string;
  status?: 'completed' | 'scheduled';
}

export function useCourseActions(
  setAllSemesterSchedules: (schedules: Map<string, Course[]>) => void
) {
  const { data: session } = useSession();

  useEffect(() => {
    const loadAllSemesterSchedules = async () => {
      if (!session?.user?.githubId) return;

      const semestersToLoad = [
        { code: '202510', name: 'Fall 2025' },
        { code: '202520', name: 'Spring 2026' },
        { code: '202530', name: 'Summer 2026' },
        { code: '202610', name: 'Fall 2026' },
        { code: '202620', name: 'Spring 2027' }
      ];

      const schedules = new Map<string, any[]>();

      for (const semester of semestersToLoad) {
        try {
          const response = await fetchWithAuth(`/api/users/${session.user.githubId}/schedule/${semester.code}`);
          if (response.ok) {
            const data = await response.json();
            if (data.classes && data.classes.length > 0) {
              const courses = data.classes.map((cls: any) => ({
                id: cls.id,
                code: `${cls.subject} ${cls.number}`,
                name: cls.title,
                title: cls.title,
                credits: cls.credits || 3,
                time: cls.time,
                location: cls.location,
                instructor: cls.instructor,
                status: 'scheduled' as const,
                semester: semester.name
              }));
              schedules.set(semester.name, courses);
            }
          }
        } catch (error) {
          console.error(`Error loading schedule for ${semester.name}:`, error);
        }
      }

      setAllSemesterSchedules(schedules);
    };

    loadAllSemesterSchedules();
  }, [session?.user?.githubId, setAllSemesterSchedules]);

  const loadActiveSchedule = async () => {
    if (session?.user?.githubId) {
      try {
        const response = await fetchWithAuth(`/api/users/${session.user.githubId}/active-schedule`);
        if (response.ok) {
          const data = await response.json();
        }
      } catch (error) {
        console.error('Error loading active schedule:', error);
      }
    }
  };

  useEffect(() => {
    loadActiveSchedule();
  }, [session?.user?.githubId]);

  return {
    loadActiveSchedule
  };
}