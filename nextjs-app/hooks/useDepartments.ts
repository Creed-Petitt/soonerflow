import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api-client";
import { getDepartmentsForMajor } from "@/lib/major-mappings";

interface Department {
  code: string;
  count: number;
}

interface UseDepartmentsReturn {
  departments: Department[];
  userMajorDepts: string[];
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  const loadDepartments = useCallback(async (currentSemester: string) => {
    try {
      setLoading(true);

      // Load departments list
      const deptResponse = await fetch(`/api/classes/departments?semester=${currentSemester}`);
      if (!deptResponse.ok) throw new Error('Failed to fetch departments');

      const deptData = await deptResponse.json();
      const departmentsList = deptData.departments || [];
      setDepartments(departmentsList);

      // Get user's major departments
      let majorDepts: string[] = [];
      if (session?.user?.githubId) {
        const userResponse = await fetchWithAuth(`/api/users/${session.user.githubId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.major) {
            majorDepts = getDepartmentsForMajor(userData.major);
          }
        }
      }

      setUserMajorDepts(majorDepts);

      // Determine suggested department selection
      let suggestedSelection = "";
      if (majorDepts.length > 0) {
        // If user has major departments, suggest "major"
        suggestedSelection = "major";
      } else if (departmentsList.length > 0) {
        // Otherwise suggest first department
        suggestedSelection = departmentsList[0].code;
      }

      return {
        departments: departmentsList,
        userMajorDepts: majorDepts,
        suggestedSelection
      };
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
      return {
        departments: [],
        userMajorDepts: [],
        suggestedSelection: ""
      };
    } finally {
      setLoading(false);
    }
  }, [session?.user?.githubId]);

  return {
    departments,
    userMajorDepts,
    loading,
    loadDepartments,
  };
}