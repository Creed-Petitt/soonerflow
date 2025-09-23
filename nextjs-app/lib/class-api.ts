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

  allClasses.forEach((cls: ClassData) => {
    const courseNumber = cls.number || cls.courseNumber;

    if (!cls.subject || !courseNumber) {
      return;
    }

    const key = `${cls.subject} ${courseNumber}`;

    if (!grouped[key]) {
      grouped[key] = {
        subject: cls.subject,
        number: courseNumber,
        title: cls.title,
        credits: cls.credits,
        sections: [],
        labSections: []
      };
    }

    if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
      grouped[key].labSections.push(cls);
    } else {
      grouped[key].sections.push(cls);
    }
  });

  return Object.values(grouped).filter(g =>
    g.sections.length > 0 || g.labSections.length > 0
  );
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