export interface CourseWithGrade {
  credits: number;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A': 4.0,
  'B': 3.0,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0
};

export function calculateGPA(courses: CourseWithGrade[]): string {
  if (courses.length === 0) return "0.00";

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

  if (totalCredits === 0) return "0.00";

  const totalPoints = courses.reduce((sum, course) => {
    return sum + (gradePoints[course.grade] || 0) * course.credits;
  }, 0);

  return (totalPoints / totalCredits).toFixed(2);
}

export function calculateTotalCredits(courses: CourseWithGrade[]): number {
  return courses.reduce((sum, course) => sum + course.credits, 0);
}

export function getGradePoints(grade: string): number {
  return gradePoints[grade] || 0;
}