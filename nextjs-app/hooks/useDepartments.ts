import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchDepartments, fetchUserMajorDepartments } from "@/lib/department-api";
import type { Department } from "@/lib/department-api";

export type { Department };

interface UseDepartmentsReturn {
  departments: Department[];
  userMajorDepts: string[];
  isLoading: boolean;
  loadDepartments: (currentSemester: string) => Promise<{
    departments: Department[],
    userMajorDepts: string[],
    suggestedSelection: string
  }>;
}

export function useDepartments(): UseDepartmentsReturn {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userMajorDepts, setUserMajorDepts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDepartments = useCallback(async (currentSemester: string) => {
    try {
      setIsLoading(true);

      const [departmentsList, majorDepts] = await Promise.all([
        fetchDepartments(currentSemester),
        session?.user?.githubId ? fetchUserMajorDepartments(session.user.githubId) : Promise.resolve([])
      ]);

      setDepartments(departmentsList);
      setUserMajorDepts(majorDepts);

      const suggestedSelection = majorDepts.length > 0 ? "major" :
                                departmentsList.length > 0 ? departmentsList[0].code : "";

      return {
        departments: departmentsList,
        userMajorDepts: majorDepts,
        suggestedSelection
      };
    } catch (error) {
      console.error('Error loading departments:', error);
      return {
        departments: [],
        userMajorDepts: [],
        suggestedSelection: ""
      };
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.githubId]);

  return {
    departments,
    userMajorDepts,
    isLoading,
    loadDepartments,
  };
}