// Shared course-related types across the application

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: string;
}

export interface ClassData {
  id: string;
  subject: string;
  courseNumber: string;
  number?: string; // API returns "number" not "courseNumber"
  title: string;
  credits: number;
  instructor?: string;
  time?: string;
  meetingTimes?: any[];
  available_seats?: number; // API uses underscore
  total_seats?: number; // API uses underscore
  type?: string;
  labs?: any[];
}

export interface GroupedClass {
  subject: string;
  number: string;
  title: string;
  credits?: number;
  sections: ClassData[];
  labSections: ClassData[];
}

export interface SelectedCourse extends Course {
  grade: string;
}

export interface Department {
  code: string;
  count: number;
}