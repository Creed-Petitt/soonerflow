import { toast } from "sonner";
import type { ClassData, GroupedClass } from "@/types/course";

export async function fetchClassesForDepartment(
  department: string,
  semester: string,
  limit: number = 200
): Promise<{ classes: ClassData[]; total: number }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/classes?subject=${department}&semester=${semester}&limit=${limit}&skip_ratings=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }

    const data = await response.json();
    return {
      classes: data.classes || [],
      total: data.pagination?.total || 0
    };
  } catch (error) {
    console.error('Error fetching classes for department:', error);
    toast.error('Failed to load classes');
    return { classes: [], total: 0 };
  }
}


export function processClasses(allClasses: ClassData[]): GroupedClass[] {
  const grouped: Record<string, GroupedClass> = {};

  for (const cls of allClasses) {
    const courseNumber = cls.number || cls.courseNumber;
    if (!cls.subject || !courseNumber) continue;

    const key = `${cls.subject} ${courseNumber}`;

    if (!grouped[key]) {
      grouped[key] = {
        subject: cls.subject,
        number: courseNumber,
        title: "",
        credits: 0,
        sections: [],
        labSections: [], // Always initialize labSections
      };
    }

    const group = grouped[key];

    if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
      // Since we initialize it, it will always be present.
      group.labSections!.push(cls);
    } else {
      group.sections.push(cls);
      if (!group.title) {
        group.title = cls.title;
      }
      if (!group.credits || group.credits === 0) {
        group.credits = cls.credits;
      }
    }
  }

  return Object.values(grouped);
}

export async function fetchClassDetails(classId: string): Promise<ClassData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/classes/${classId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch class details');
    }

    const classData = await response.json();
    return classData;
  } catch (error) {
    console.error('Error fetching class details:', error);
    return null;
  }
}