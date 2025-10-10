import { useState, useCallback } from "react";
import { fetchClassesForDepartment, processClasses } from "@/lib/class-api";
import type { ClassData, GroupedClass } from "@/types/course";

export type { ClassData, GroupedClass };

interface UseClassDataReturn {
  classes: ClassData[];
  groupedClasses: GroupedClass[];
  isLoading: boolean;
  loadClassesForDepartment: (dept: string, semester: string) => Promise<void>;
  clearClasses: () => void;
}

export function useClassData(): UseClassDataReturn {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClassesForDepartment = useCallback(async (dept: string, semester: string) => {
    setIsLoading(true);
    setClasses([]);
    setGroupedClasses([]);
    const { classes: deptClasses } = await fetchClassesForDepartment(dept, semester);
    setClasses(deptClasses);
    setGroupedClasses(processClasses(deptClasses));
    setIsLoading(false);
  }, []);

  const clearClasses = () => {
    setClasses([]);
    setGroupedClasses([]);
  };

  return {
    classes,
    groupedClasses,
    isLoading,
    loadClassesForDepartment,
    clearClasses,
  };
}