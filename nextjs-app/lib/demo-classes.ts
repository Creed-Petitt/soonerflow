import type { ScheduledClass } from '@/types/course';

export const demoClasses: ScheduledClass[] = [
  {
    id: 'demo-cs2413',
    subject: 'CS',
    number: '2413',
    courseNumber: '2413',
    title: 'Data Structures',
    credits: 4,
    instructor: 'Dr. Sarah Johnson',
    time: 'MWF 9:00 am-9:50 am',
    location: 'DEH 120',
    color: '#dc2626', // OU red
    colorBg: 'bg-red-600/10',
    colorHex: '#dc2626',
    available_seats: 25,
    total_seats: 35,
    type: 'Lecture',
    description: 'Introduction to fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Implementation and analysis of algorithms for manipulating these structures.'
  },
  {
    id: 'demo-cs3113',
    subject: 'CS',
    number: '3113',
    courseNumber: '3113',
    title: 'Operating Systems',
    credits: 3,
    instructor: 'Dr. Michael Chen',
    time: 'TR 1:30 pm-2:45 pm',
    location: 'ENG 301',
    color: '#dc2626', // OU red
    colorBg: 'bg-red-600/10',
    colorHex: '#dc2626',
    available_seats: 18,
    total_seats: 30,
    type: 'Lecture',
    description: 'Fundamental concepts of operating systems including process management, memory management, file systems, and concurrent programming.'
  },
  {
    id: 'demo-cs4033',
    subject: 'CS',
    number: '4033',
    courseNumber: '4033',
    title: 'Machine Learning',
    credits: 3,
    instructor: 'Dr. Emily Rodriguez',
    time: 'MW 3:00 pm-4:15 pm',
    location: 'DEH 205',
    color: '#dc2626', // OU red
    colorBg: 'bg-red-600/10',
    colorHex: '#dc2626',
    available_seats: 12,
    total_seats: 25,
    type: 'Lecture',
    description: 'Introduction to machine learning algorithms including supervised learning, unsupervised learning, and neural networks. Hands-on experience with Python and ML libraries.'
  }
];