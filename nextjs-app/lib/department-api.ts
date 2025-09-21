import { toast } from "sonner";

export interface Department {
  code: string;
  count: number;
}

export async function fetchDepartments(semester: string): Promise<Department[]> {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/classes/departments?semester=${semester}`);

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

