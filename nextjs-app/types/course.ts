// Shared course-related types across the application

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: string;
}

// Basic class information from API
export interface ClassData {
  id: string;
  subject: string;
  courseNumber: string;
  number?: string; // API returns "number" not "courseNumber"
  title: string;
  credits: number;
  instructor?: string;
  time?: string;
  location?: string;
  meetingTimes?: any[];
  available_seats?: number; // API uses underscore
  total_seats?: number; // API uses underscore
  type?: string;
  labs?: any[];
  description?: string;
  rating?: number;
  difficulty?: number;
  wouldTakeAgain?: number;
  grade?: string;
  semester?: string;
}

// ClassData with user-specific scheduling information
export interface ScheduledClass extends ClassData {
  instructor: string; // Required for scheduled classes
  time: string; // Required for scheduled classes
  location: string; // Required for scheduled classes
  color: string;
  colorBg?: string;
  colorHex?: string;
}

export interface GroupedClass {
  subject: string;
  number: string;
  title: string;
  credits?: number;
  sections: ClassData[];
  labSections?: ClassData[];
}

export interface Schedule {
  schedule_id: number;
  schedule_name: string;
  semester: string;
  classes: ScheduledClass[];
}

export interface SelectedCourse extends Course {
  grade: string;
}

export interface Department {
  code: string;
  count: number;
}