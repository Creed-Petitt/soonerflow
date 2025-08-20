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
  semester: string;
  classes: ScheduledClass[];
}

interface Semester {
  code: string;
  name: string;
  class_count: number;
  is_summer: boolean;
}

interface ScheduleContextType {
  scheduledClasses: ScheduledClass[];
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  isAuthenticated: boolean;
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
  // Get current semester based on current date
  const getCurrentSemester = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    if (month >= 1 && month <= 5) {
      // Spring semester (January - May)
      return `${year - 1}20`; // Spring 2025 = 202420
    } else if (month >= 8 && month <= 12) {
      // Fall semester (August - December)  
      return `${year}10`; // Fall 2025 = 202510
    } else {
      // Summer semester (June - July)
      return `${year - 1}30`; // Summer 2025 = 202430
    }
  };
  
  const [currentSemester, setCurrentSemesterState] = useState<string>(getCurrentSemester());
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([]);
  const [includeSummerSemesters, setIncludeSummerSemesters] = useState<boolean>(false);
  const [includeHistoricalSemesters, setIncludeHistoricalSemesters] = useState<boolean>(false);
  
  // Debounce the class list to avoid too many API calls
  const debouncedClasses = useDebounce(localClasses, 1000);

  // Load available semesters
  const loadSemesters = useCallback(async () => {
    try {
      const url = `/api/semesters?include_summers=${includeSummerSemesters}&include_historical=${includeHistoricalSemesters}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableSemesters(data);
      }
    } catch (err) {
      console.error('Failed to load semesters:', err);
    }
  }, [includeSummerSemesters, includeHistoricalSemesters]);

  // Load user's schedule for a specific semester
  const loadSchedule = useCallback(async (semester?: string) => {
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

    const targetSemester = semester || currentSemester;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${session.user.githubId}/schedule/${targetSemester}`);
      
      if (!response.ok) {
        throw new Error('Failed to load schedule');
      }
      
      const data = await response.json();
      
      // Deduplicate classes from backend just in case
      const classMap = new Map<string, ScheduledClass>();
      (data.classes || []).forEach((cls: ScheduledClass) => {
        if (!classMap.has(cls.id)) {
          classMap.set(cls.id, cls);
        }
      });
      const uniqueClasses = Array.from(classMap.values());
      
      console.log(`📚 Loaded ${uniqueClasses.length} unique classes for semester ${targetSemester}`);
      console.log('📚 Unique classes data:', uniqueClasses);
      
      setSchedule({ ...data, classes: uniqueClasses });
      setLocalClasses(uniqueClasses);
      setHasLoadedSchedule(true);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [session, status, currentSemester]);

  // Load semesters on mount and trigger migration
  useEffect(() => {
    loadSemesters();
    
    // One-time migration of completed courses to schedules
    if (session?.user?.githubId && status === "authenticated") {
      fetch(`/api/users/${session.user.githubId}/migrate-completed-courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(response => {
        if (response.ok) {
          response.json().then(result => {
            console.log('📚 Migration result:', result);
          });
        }
      }).catch(error => {
        console.error('Migration failed:', error);
      });
    }
  }, [loadSemesters, session?.user?.githubId, status]);

  // Reload semesters when filter settings change
  useEffect(() => {
    loadSemesters();
  }, [includeSummerSemesters, includeHistoricalSemesters, loadSemesters]);

  // Load schedule when semester changes or auth changes
  useEffect(() => {
    loadSchedule(currentSemester);
  }, [currentSemester, loadSchedule]);

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
    
    // Deduplicate local classes before comparison
    const uniqueLocalClasses = debouncedClasses.filter((cls, index, arr) => 
      arr.findIndex(c => c.id === cls.id) === index
    );
    
    // Compare class IDs to see if there's an actual change
    const currentClassIds = uniqueLocalClasses.map(c => c.id).sort().join(',');
    const savedClassIds = (schedule.classes || []).map(c => c.id).sort().join(',');
    
    if (currentClassIds !== savedClassIds) {
      console.log('💾 Auto-saving schedule changes...');
      
      // Update local classes to remove duplicates before saving
      if (uniqueLocalClasses.length !== debouncedClasses.length) {
        console.log('🧹 Cleaning up duplicates before save');
        setLocalClasses(uniqueLocalClasses);
      } else {
        saveSchedule();
      }
    }
  }, [debouncedClasses, hasLoadedSchedule, schedule, isSaving, saveSchedule]);

  // Class management functions
  const addClass = useCallback((classData: ScheduledClass) => {
    setLocalClasses(prev => {
      // Check if class already exists
      const existingIndex = prev.findIndex(c => c.id === classData.id);
      if (existingIndex !== -1) {
        console.log('⚠️ Class already exists, updating instead:', classData.id);
        // Update existing class instead of adding duplicate
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...classData };
        return updated;
      }
      console.log('✅ Adding new class:', classData.id);
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

  // Semester setter that triggers reload (with validation)
  const setCurrentSemester = useCallback(async (semester: string) => {
    console.log('🔄 Switching to semester:', semester);
    
    // Get the actual current semester code
    const actualCurrentSemester = getCurrentSemester();
    
    // Validate that the semester is current or future (not past)
    if (semester < actualCurrentSemester) {
      console.warn(`⚠️ Cannot switch to past semester ${semester}. Minimum allowed is ${actualCurrentSemester}`);
      // For now, allow switching to past semesters but log a warning
      // This is for backward compatibility - can be made stricter later
    }
    
    // Clear current state before switching to prevent duplicates
    setLocalClasses([]);
    setSchedule(null);
    setError(null);
    setLoading(true);
    setIsSaving(false); // Cancel any pending saves
    
    // Update semester and trigger reload
    setCurrentSemesterState(semester);
    setHasLoadedSchedule(false); // Reset to trigger reload
    
    // Force immediate reload of the new semester
    setTimeout(() => {
      loadSchedule(semester);
    }, 100);
  }, [loadSchedule]);

  const value: ScheduleContextType = {
    scheduledClasses: localClasses,
    schedule,
    loading,
    error,
    isSaving,
    isAuthenticated,
    currentSemester,
    availableSemesters,
    includeSummerSemesters,
    includeHistoricalSemesters,
    setCurrentSemester,
    setIncludeSummerSemesters,
    setIncludeHistoricalSemesters,
    addClass,
    removeClass,
    updateClass,
    clearSchedule,
    isClassScheduled,
    refreshSchedule: () => loadSchedule(currentSemester),
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