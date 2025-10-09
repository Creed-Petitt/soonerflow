// Shared course-related types across the application

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: string;
}

export interface MeetingTime {
  days?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  building?: string;
  room?: string;
}

export interface Lab {
  id: string;
  subject: string;
  courseNumber: string;
  number: string;
  title: string;
  instructor?: string;
  time?: string;
  location?: string;
  meetingTimes?: MeetingTime[];
  available_seats?: number;
  total_seats?: number;
  availableSeats?: number;
  totalSeats?: number;
}

// Basic class information from API
export interface ClassData {
  id: string;
  subject: string;
  courseNumber: string;
  number: string; // Same as courseNumber, for backwards compatibility
  title: string;
  credits: number;
  instructor?: string;
  time?: string;
  location?: string;
  meetingTimes?: MeetingTime[];
  available_seats?: number; // API uses underscore
  total_seats?: number; // API uses underscore
  type?: string;
  labs?: Lab[];
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