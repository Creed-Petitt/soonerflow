"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useDebounce } from '@/hooks/use-debounce';

// Types
interface ScheduledClass {
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

interface Schedule {
  schedule_id: number;
  schedule_name: string;
  classes: ScheduledClass[];
}

interface ScheduleContextType {
  scheduledClasses: ScheduledClass[];
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  isAuthenticated: boolean;
  addClass: (classData: ScheduledClass) => void;
  removeClass: (classId: string) => void;
  updateClass: (classId: string, updates: Partial<ScheduledClass>) => void;
  clearSchedule: () => void;
  isClassScheduled: (classId: string) => boolean;
  refreshSchedule: () => Promise<void>;
}

// Create context
const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Provider component
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localClasses, setLocalClasses] = useState<ScheduledClass[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedSchedule, setHasLoadedSchedule] = useState(false);
  
  // Debounce the class list to avoid too many API calls
  const debouncedClasses = useDebounce(localClasses, 1000);

  // Load user's active schedule
  const loadSchedule = useCallback(async () => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      setSchedule(null);
      setLocalClasses([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!session?.user?.githubId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${session.user.githubId}/active-schedule`);
      
      if (!response.ok) {
        throw new Error('Failed to load schedule');
      }
      
      const data = await response.json();
      setSchedule(data);
      setLocalClasses(data.classes || []);
      setHasLoadedSchedule(true);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Load schedule on mount and auth change
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Save schedule function
  const saveSchedule = useCallback(async () => {
    if (!schedule || !session?.user?.githubId || isSaving) return;
    
    try {
      setIsSaving(true);
      
      // Extract class IDs and colors
      const class_ids = localClasses.map(c => c.id);
      const colors: Record<string, string> = {};
      localClasses.forEach(c => {
        colors[c.id] = c.color;
      });
      
      const response = await fetch(
        `/api/schedules/${schedule.schedule_id}/classes`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ class_ids, colors }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }
      
      // Update the schedule state with new classes to prevent infinite loop
      setSchedule(prev => prev ? { ...prev, classes: localClasses } : null);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  }, [schedule, session?.user?.githubId, localClasses, isSaving]);

  // Auto-save when classes change
  useEffect(() => {
    if (!hasLoadedSchedule || !schedule || isSaving) return;
    
    // Skip if both are empty
    if (debouncedClasses.length === 0 && (!schedule.classes || schedule.classes.length === 0)) {
      return;
    }
    
    // Compare class IDs to see if there's an actual change
    const currentClassIds = debouncedClasses.map(c => c.id).sort().join(',');
    const savedClassIds = (schedule.classes || []).map(c => c.id).sort().join(',');
    
    if (currentClassIds !== savedClassIds) {
      console.log('💾 Auto-saving schedule changes...');
      saveSchedule();
    }
  }, [debouncedClasses, hasLoadedSchedule, schedule, isSaving, saveSchedule]);

  // Class management functions
  const addClass = useCallback((classData: ScheduledClass) => {
    setLocalClasses(prev => {
      // Check if class already exists
      if (prev.find(c => c.id === classData.id)) {
        return prev;
      }
      return [...prev, classData];
    });
  }, []);

  const removeClass = useCallback((classId: string) => {
    setLocalClasses(prev => prev.filter(c => c.id !== classId));
  }, []);

  const updateClass = useCallback((classId: string, updates: Partial<ScheduledClass>) => {
    setLocalClasses(prev => 
      prev.map(c => c.id === classId ? { ...c, ...updates } : c)
    );
  }, []);

  const clearSchedule = useCallback(() => {
    setLocalClasses([]);
  }, []);

  const isClassScheduled = useCallback((classId: string) => {
    return localClasses.some(c => c.id === classId);
  }, [localClasses]);

  const isAuthenticated = status === "authenticated";

  const value: ScheduleContextType = {
    scheduledClasses: localClasses,
    schedule,
    loading,
    error,
    isSaving,
    isAuthenticated,
    addClass,
    removeClass,
    updateClass,
    clearSchedule,
    isClassScheduled,
    refreshSchedule: loadSchedule,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

// Custom hook to use the schedule context
export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}