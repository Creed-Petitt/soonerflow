import { useState } from "react";
import { fetchClassesForDepartment, processClasses } from "@/lib/class-api";
import type { ClassData, GroupedClass } from "@/lib/class-api";

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

  const loadClassesForDepartment = async (dept: string, semester: string) => {
    setIsLoading(true);
    const { classes: deptClasses } = await fetchClassesForDepartment(dept, semester);
    setClasses(deptClasses);
    setGroupedClasses(processClasses(deptClasses));
    setIsLoading(false);
  };

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