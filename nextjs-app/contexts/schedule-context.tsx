"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useScheduleData } from '@/hooks/useScheduleData';
import { useSemesterManagement } from '@/hooks/useSemesterManagement';
import { useAuth } from '@/contexts/auth-context';
import type { ScheduledClass, Schedule } from '@/types/course';

interface Semester {
  code: string;
  name: string;
  class_count: number;
  is_summer: boolean;
}

interface ScheduleContextType {
  scheduledClasses: ScheduledClass[];
  schedule: Schedule | null;
  isLoading: boolean;
  error: string | null;
  currentSemester: string;
  availableSemesters: Semester[];
  includeSummerSemesters: boolean;
  includeHistoricalSemesters: boolean;
  setCurrentSemester: (semester: string) => void;
  setIncludeSummerSemesters: (include: boolean) => void;
  setIncludeHistoricalSemesters: (include: boolean) => void;
  addClass: (classData: ScheduledClass) => void;
  removeClass: (classId: string) => void;
  updateClass: (classId: string, updates: Partial<ScheduledClass>) => void;
  clearSchedule: () => void;
  isClassScheduled: (classId: string) => boolean;
  refreshSchedule: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const scheduleData = useScheduleData();
  const semesterData = useSemesterManagement();

  // Initialize data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const actualCurrentSemester = semesterData.getCurrentSemester();
      semesterData.setCurrentSemester(actualCurrentSemester);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load semesters and trigger migration
  useEffect(() => {
    semesterData.loadSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterData.includeSummerSemesters, semesterData.includeHistoricalSemesters]);

  // Load schedule when semester changes
  useEffect(() => {
    scheduleData.loadSchedule(semesterData.currentSemester, semesterData.currentSemester);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterData.currentSemester]);

  // Clear schedule data when user signs out
  useEffect(() => {
    if (currentUser === null) {
      // User signed out, clear all schedule data
      scheduleData.setLocalClasses([]);
    }
  }, [currentUser, scheduleData.setLocalClasses]);

  const addClass = (classData: ScheduledClass) => {
    scheduleData.setLocalClasses(prev => {
      const existingIndex = prev.findIndex(c => c.id === classData.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...classData };
        return updated;
      }
      return [...prev, classData];
    });
  };

  const removeClass = (classId: string) => {
    scheduleData.setLocalClasses(prev => prev.filter(c => c.id !== classId));
  };

  const updateClass = (classId: string, updates: Partial<ScheduledClass>) => {
    scheduleData.setLocalClasses(prev =>
      prev.map(c => c.id === classId ? { ...c, ...updates } : c)
    );
  };

  const clearSchedule = () => {
    scheduleData.setLocalClasses([]);
  };

  const isClassScheduled = (classId: string) => {
    return scheduleData.localClasses.some(c => c.id === classId);
  };

  const value: ScheduleContextType = {
    scheduledClasses: scheduleData.localClasses,
    schedule: scheduleData.schedule,
    isLoading: scheduleData.isLoading,
    error: scheduleData.error,
    currentSemester: semesterData.currentSemester,
    availableSemesters: semesterData.availableSemesters,
    includeSummerSemesters: semesterData.includeSummerSemesters,
    includeHistoricalSemesters: semesterData.includeHistoricalSemesters,
    setCurrentSemester: semesterData.setCurrentSemester,
    setIncludeSummerSemesters: semesterData.setIncludeSummerSemesters,
    setIncludeHistoricalSemesters: semesterData.setIncludeHistoricalSemesters,
    addClass,
    removeClass,
    updateClass,
    clearSchedule,
    isClassScheduled,
    refreshSchedule: () => scheduleData.loadSchedule(),
  };

  // Auto-save when classes change (immediate)
  useEffect(() => {
    if (!scheduleData.hasLoadedSchedule || !scheduleData.schedule || scheduleData.isLoading) return;

    // Skip if both are empty
    if (scheduleData.localClasses.length === 0 && (!scheduleData.schedule.classes || scheduleData.schedule.classes.length === 0)) {
      return;
    }

    // Deduplicate local classes before comparison
    const uniqueLocalClasses = scheduleData.localClasses.filter((cls, index, arr) =>
      arr.findIndex(c => c.id === cls.id) === index
    );

    // Compare class IDs to see if there's an actual change
    const currentClassIds = uniqueLocalClasses.map(c => c.id).sort().join(',');
    const savedClassIds = (scheduleData.schedule.classes || []).map(c => c.id).sort().join(',');

    if (currentClassIds !== savedClassIds) {
      if (uniqueLocalClasses.length !== scheduleData.localClasses.length) {
        scheduleData.setLocalClasses(uniqueLocalClasses);
      } else {
        scheduleData.saveSchedule();
      }
    }
  }, [scheduleData.localClasses, scheduleData.hasLoadedSchedule, scheduleData.schedule, scheduleData.isLoading]);

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}