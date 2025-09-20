import { useState, useCallback } from "react";
import { fetchDepartments } from "@/lib/department-api";
import type { Department } from "@/lib/department-api";

export type { Department };

interface UseDepartmentsReturn {
  departments: Department[];
  isLoading: boolean;
  loadDepartments: (currentSemester: string) => Promise<Department[]>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDepartments = useCallback(async (currentSemester: string) => {
    setIsLoading(true);
    const fetchedDepartments = await fetchDepartments(currentSemester);
    setDepartments(fetchedDepartments);
    setIsLoading(false);
    return fetchedDepartments;
  }, []);

  return {
    departments,
    isLoading,
    loadDepartments,
  };
}