// Parse prerequisites from course descriptions
export interface ParsedPrerequisite {
  courseCode: string; // e.g., "ECE 2713"
  isCorequisite?: boolean; // Can be taken concurrently
  isOneOf?: string[]; // Alternative prerequisites
}

export interface CoursePrerequisites {
  courseCode: string;
  prerequisites: ParsedPrerequisite[];
}

export function parsePrerequisites(description: string): ParsedPrerequisite[] {
  if (!description) return [];
  
  const prerequisites: ParsedPrerequisite[] = [];
  
  // Look for "Prerequisites:" or "Prerequisite:" in the description
  const prereqMatch = description.match(/Prerequisites?:\s*([^.]+)\./i);
  if (!prereqMatch) return [];
  
  const prereqText = prereqMatch[1];
  
  // Parse course codes (e.g., "ECE 2713", "MATH 2423")
  const coursePattern = /([A-Z]+)\s+(\d{4})/g;
  const courses = prereqText.match(coursePattern);
  
  if (!courses) return [];
  
  // Check for corequisites
  const coreqPattern = /concurrent\s+enrollment|may\s+be\s+taken\s+concurrently/i;
  
  courses.forEach(course => {
    const isCorequisite = prereqText.includes(course) && 
      prereqText.substring(prereqText.indexOf(course) - 50, prereqText.indexOf(course) + 50)
        .match(coreqPattern) !== null;
    
    prerequisites.push({
      courseCode: course,
      isCorequisite
    });
  });
  
  // Handle "or" conditions (e.g., "MATH 2423 or 2924")
  const orPattern = /([A-Z]+)\s+(\d{4})\s+or\s+(\d{4})/g;
  let orMatch;
  while ((orMatch = orPattern.exec(prereqText)) !== null) {
    const subject = orMatch[1];
    const course1 = `${subject} ${orMatch[2]}`;
    const course2 = `${subject} ${orMatch[3]}`;
    
    // Find and update the prerequisite entry
    const existingIndex = prerequisites.findIndex(p => p.courseCode === course1);
    if (existingIndex >= 0) {
      prerequisites[existingIndex].isOneOf = [course1, course2];
    }
  }
  
  return prerequisites;
}

// Generate edges for React Flow based on prerequisites
export function generatePrerequisiteEdges(courses: any[]): any[] {
  const edges: any[] = [];
  
  courses.forEach(course => {
    if (!course.description) return;
    
    const prerequisites = parsePrerequisites(course.description);
    
    prerequisites.forEach(prereq => {
      // Check if the prerequisite course exists in our course list
      const prereqCourse = courses.find(c => 
        `${c.subject} ${c.courseNumber}` === prereq.courseCode
      );
      
      if (prereqCourse) {
        edges.push({
          id: `e-${prereq.courseCode.replace(' ', '')}-${course.subject}${course.courseNumber}`,
          source: prereq.courseCode.replace(' ', '').toLowerCase(),
          target: `${course.subject}${course.courseNumber}`.toLowerCase(),
          type: 'prerequisite',
          data: {
            satisfied: false, // This would need to be calculated based on completed courses
            corequisite: prereq.isCorequisite
          }
        });
      }
    });
  });
  
  return edges;
}

// Map of common prerequisite relationships for Computer Engineering
// This can be used as fallback when descriptions don't contain prerequisites
export const commonPrerequisites: Record<string, string[]> = {
  // Math sequence
  "MATH 2924": ["MATH 1914"],
  "MATH 2934": ["MATH 2924"],
  "MATH 3113": ["MATH 2924"],
  
  // Physics sequence
  "PHYS 2514": ["MATH 1914"],
  "PHYS 2524": ["PHYS 2514", "MATH 2924"],
  
  // ECE courses
  "ECE 2723": ["PHYS 2524", "MATH 2924"],
  "ECE 3723": ["ECE 2723"],
  "ECE 2713": ["MATH 2924"],
  "ECE 3793": ["ECE 2713", "MATH 3113"],
  "ECE 4273": ["ECE 3793"],
  "ECE 3613": ["PHYS 2524", "MATH 2934"],
  
  // CS courses
  "CS 2334": ["CS 1323"],
  "CS 2413": ["CS 1323"],
  "CS 3203": ["CS 2334", "CS 2413"],
};