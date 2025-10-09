import type { ScheduledClass } from '@/types/course';

export const demoClasses: ScheduledClass[] = [
  {
    id: 'demo-cs3203',
    subject: 'C S',
    number: '3203',
    courseNumber: '3203',
    title: 'Software Engineering',
    credits: 3,
    instructor: 'Demo Instructor',
    time: 'MWF 10:30am - 11:20am',
    location: 'Demo Location',
    color: '#dc2626',
    colorBg: 'bg-red-600/10',
    colorHex: '#dc2626',
    available_seats: 0,
    total_seats: 0,
    type: 'Lecture',
  },
  {
    id: 'demo-cs4723',
    subject: 'C S',
    number: '4723',
    courseNumber: '4723',
    title: 'AI and Machine Learning',
    credits: 3,
    instructor: 'Demo Instructor',
    time: 'TR 1:30pm - 2:45pm',
    location: 'Demo Location',
    color: '#dc2626',
    colorBg: 'bg-red-600/10',
    colorHex: '#dc2626',
    available_seats: 0,
    total_seats: 0,
    type: 'Lecture',
  }
];
