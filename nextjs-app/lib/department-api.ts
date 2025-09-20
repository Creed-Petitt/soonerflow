import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api-client";
import { getDepartmentsForMajor } from "@/lib/major-mappings";

export interface Department {
  code: string;
  count: number;
}

export async function fetchDepartments(semester: string): Promise<Department[]> {
  try {
    const response = await fetch(`/api/classes/departments?semester=${semester}`);

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    return data.departments || [];
  } catch (error) {
    console.error('Error loading departments:', error);
    toast.error('Failed to load departments');
    return [];
  }
}

export async function fetchUserMajorDepartments(githubId: string): Promise<string[]> {
  try {
    const response = await fetchWithAuth(`/api/users/${githubId}`);

    if (!response.ok) {
      return [];
    }

    const userData = await response.json();
    if (userData.major) {
      return getDepartmentsForMajor(userData.major);
    }

    return [];
  } catch (error) {
    console.error('Error loading user major departments:', error);
    return [];
  }
}

export async function fetchMajorCourses(majorName: string) {
  try {
    const response = await fetch(`/api/major-courses?major_name=${encodeURIComponent(majorName)}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const uniqueCourses = new Map();
      data.forEach((course: any) => {
        const courseKey = `${course.subject}-${course.courseNumber}`;
        if (!uniqueCourses.has(courseKey)) {
          uniqueCourses.set(courseKey, {
            id: courseKey,
            code: `${course.subject} ${course.courseNumber}`,
            name: course.title,
            credits: course.credits || 3,
            category: course.category || course.subject
          });
        }
      });

      return Array.from(uniqueCourses.values());
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch major courses:', error);
    return [];
  }
}