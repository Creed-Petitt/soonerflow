import { useState } from "react";
import { fetchClassesForDepartment, fetchAllClasses, processClasses } from "@/lib/class-api";
import type { ClassData, GroupedClass } from "@/lib/class-api";

export type { ClassData, GroupedClass };

interface UseClassDataReturn {
  classes: ClassData[];
  groupedClasses: GroupedClass[];
  isLoading: boolean;
  totalClassCount: number;
  currentPage: number;
  loadClassesForDepartment: (dept: string, semester: string) => Promise<void>;
  loadAllClasses: (semester: string, page?: number, append?: boolean) => Promise<void>;
  loadClassesForMajor: (userMajorDepts: string[], semester: string) => Promise<void>;
  loadMoreClasses: (semester: string) => void;
  clearClasses: () => void;
}

export function useClassData(): UseClassDataReturn {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalClassCount, setTotalClassCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const loadClassesForDepartment = async (dept: string, semester: string) => {
    setIsLoading(true);
    const { classes: deptClasses, total } = await fetchClassesForDepartment(dept, semester);
    setClasses(deptClasses);
    setGroupedClasses(processClasses(deptClasses));
    setTotalClassCount(total);
    setIsLoading(false);
  };

  const loadAllClasses = async (semester: string, page: number = 1, append: boolean = false) => {
    setIsLoading(true);
    const { classes: newClasses, total } = await fetchAllClasses(semester, page);

    if (append && page > 1) {
      const allClasses = [...classes, ...newClasses];
      setClasses(allClasses);
      setGroupedClasses(processClasses(allClasses));
    } else {
      setClasses(newClasses);
      setGroupedClasses(processClasses(newClasses));
    }

    setTotalClassCount(total);
    setCurrentPage(page);
    setIsLoading(false);
  };

  const loadClassesForMajor = async (userMajorDepts: string[], semester: string) => {
    setIsLoading(true);
    const allMajorClasses: ClassData[] = [];

    const deptPromises = userMajorDepts.map(async (dept) => {
      const { classes: deptClasses } = await fetchClassesForDepartment(dept, semester);
      return deptClasses;
    });

    const results = await Promise.all(deptPromises);
    results.forEach(deptClasses => allMajorClasses.push(...deptClasses));

    setClasses(allMajorClasses);
    setGroupedClasses(processClasses(allMajorClasses));
    setIsLoading(false);
  };

  const loadMoreClasses = (semester: string) => {
    const nextPage = currentPage + 1;
    loadAllClasses(semester, nextPage, true);
  };

  const clearClasses = () => {
    setClasses([]);
    setGroupedClasses([]);
    setTotalClassCount(0);
    setCurrentPage(1);
  };

  return {
    classes,
    groupedClasses,
    isLoading,
    totalClassCount,
    currentPage,
    loadClassesForDepartment,
    loadAllClasses,
    loadClassesForMajor,
    loadMoreClasses,
    clearClasses,
  };
}