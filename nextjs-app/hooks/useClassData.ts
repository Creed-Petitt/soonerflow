import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface ClassData {
  id: string;
  subject: string;
  courseNumber: string;
  number?: string; // API returns "number" not "courseNumber"
  title: string;
  credits: number;
  instructor?: string;
  time?: string;
  meetingTimes?: any[];
  available_seats?: number; // API uses underscore
  total_seats?: number; // API uses underscore
  type?: string;
  labs?: any[];
}

export interface GroupedClass {
  subject: string;
  number: string;
  title: string;
  credits?: number;
  sections: ClassData[];
  labSections: ClassData[];
}

interface UseClassDataReturn {
  classes: ClassData[];
  groupedClasses: GroupedClass[];
  loading: boolean;
  isLoadingMore: boolean;
  isSearching: boolean;
  totalClassCount: number;
  currentPage: number;
  loadClassesForDepartment: (dept: string, currentSemester: string) => Promise<void>;
  loadAllClasses: (currentSemester: string, page?: number, append?: boolean) => Promise<void>;
  loadClassesForMajor: (userMajorDepts: string[], currentSemester: string) => Promise<void>;
  performServerSearch: (query: string, currentSemester: string) => Promise<void>;
  loadMoreClasses: (currentSemester: string) => void;
  clearClasses: () => void;
}

export function useClassData(): UseClassDataReturn {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalClassCount, setTotalClassCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [departmentCache, setDepartmentCache] = useState<Record<string, ClassData[]>>({});

  const processClasses = useCallback((allClasses: ClassData[]) => {
    setClasses(allClasses);

    // Group classes by subject + number
    const grouped: Record<string, GroupedClass> = {};
    allClasses.forEach((cls: ClassData) => {
      // Skip invalid classes
      if (!cls.subject || (!cls.number && !cls.courseNumber)) return;

      const key = `${cls.subject} ${cls.number || cls.courseNumber}`;

      if (!grouped[key]) {
        grouped[key] = {
          subject: cls.subject,
          number: cls.number || cls.courseNumber,
          title: cls.title,
          credits: cls.credits,
          sections: [],
          labSections: []
        };
      }

      // Separate labs from lectures
      if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
        grouped[key].labSections.push(cls);
      } else {
        grouped[key].sections.push(cls);
      }
    });

    // Filter out groups with no sections
    const groupedArray = Object.values(grouped).filter(g =>
      g.sections.length > 0 || g.labSections.length > 0
    );
    setGroupedClasses(groupedArray);
  }, []);

  const loadClassesForDepartment = useCallback(async (dept: string, currentSemester: string) => {
    // Check cache first
    if (departmentCache[dept]) {
      processClasses(departmentCache[dept]);
      return;
    }

    try {
      setLoading(true);

      // Increased limit to 500 to handle large departments like MATH
      const response = await fetch(`/api/classes?subject=${dept}&semester=${currentSemester}&limit=500&skip_ratings=true`);
      if (!response.ok) throw new Error('Failed to fetch classes');

      const data = await response.json();
      const deptClasses = data.classes || [];
      setTotalClassCount(data.pagination?.total || deptClasses.length);

      // Cache the department data
      setDepartmentCache(prev => ({ ...prev, [dept]: deptClasses }));

      processClasses(deptClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [departmentCache, processClasses]);

  const loadAllClasses = useCallback(async (currentSemester: string, page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setIsLoadingMore(true);
      }

      // Load 100 classes at a time for smooth performance
      const response = await fetch(`/api/classes?semester=${currentSemester}&limit=100&page=${page}&skip_ratings=true`);
      if (!response.ok) throw new Error('Failed to fetch classes');

      const data = await response.json();
      const newClasses = data.classes || [];
      setTotalClassCount(data.pagination?.total || 0);

      if (append && page > 1) {
        // Append to existing classes for infinite scroll
        const allClasses = [...classes, ...newClasses];
        setClasses(allClasses);
        processClasses(allClasses);
      } else {
        // Replace classes for initial load
        processClasses(newClasses);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading all classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [classes, processClasses]);

  const loadClassesForMajor = useCallback(async (userMajorDepts: string[], currentSemester: string) => {
    try {
      setLoading(true);

      const allMajorClasses: ClassData[] = [];

      // Load classes for each major department in parallel
      const deptPromises = userMajorDepts.map(async (dept) => {
        if (departmentCache[dept]) {
          return departmentCache[dept];
        } else {
          // Increased to 500 to handle large departments
          const response = await fetch(`/api/classes?subject=${dept}&semester=${currentSemester}&limit=500&skip_ratings=true`);
          if (response.ok) {
            const data = await response.json();
            const deptClasses = data.classes || [];
            // Cache the department data
            setDepartmentCache(prev => ({ ...prev, [dept]: deptClasses }));
            return deptClasses;
          }
          return [];
        }
      });

      const results = await Promise.all(deptPromises);
      results.forEach(deptClasses => allMajorClasses.push(...deptClasses));

      processClasses(allMajorClasses);
    } catch (error) {
      console.error('Error loading major classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [departmentCache, processClasses]);

  const performServerSearch = useCallback(async (query: string, currentSemester: string) => {
    if (!query || query.length < 2) {
      return;
    }

    try {
      setIsSearching(true);

      const response = await fetch(`/api/classes?search=${encodeURIComponent(query)}&semester=${currentSemester}&limit=200&skip_ratings=true`);
      if (!response.ok) throw new Error('Failed to search classes');

      const data = await response.json();
      const searchResults = data.classes || [];
      setTotalClassCount(data.pagination?.total || searchResults.length);

      processClasses(searchResults);
    } catch (error) {
      console.error('Error searching classes:', error);
      toast.error('Failed to search classes');
    } finally {
      setIsSearching(false);
    }
  }, [processClasses]);

  const loadMoreClasses = useCallback((currentSemester: string) => {
    if (!isLoadingMore) {
      loadAllClasses(currentSemester, currentPage + 1, true);
    }
  }, [isLoadingMore, currentPage, loadAllClasses]);

  const clearClasses = useCallback(() => {
    setClasses([]);
    setGroupedClasses([]);
    setTotalClassCount(0);
    setCurrentPage(1);
  }, []);

  return {
    classes,
    groupedClasses,
    loading,
    isLoadingMore,
    isSearching,
    totalClassCount,
    currentPage,
    loadClassesForDepartment,
    loadAllClasses,
    loadClassesForMajor,
    performServerSearch,
    loadMoreClasses,
    clearClasses,
  };
}