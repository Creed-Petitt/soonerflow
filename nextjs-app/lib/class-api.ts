import { toast } from "sonner";
import type { ClassData, GroupedClass } from "@/types/course";

export async function fetchClassesForDepartment(
  department: string,
  semester: string,
  limit: number = 500
): Promise<{ classes: ClassData[]; total: number }> {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/classes?subject=${department}&semester=${semester}&limit=${limit}&skip_ratings=true`
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
    if (!cls.subject || (!cls.number && !cls.courseNumber)) return;

    const key = `${cls.subject} ${cls.number || cls.courseNumber}`;

    if (!grouped[key]) {
      grouped[key] = {
        subject: cls.subject,
        number: cls.number || cls.courseNumber,
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