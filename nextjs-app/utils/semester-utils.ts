/**
 * Utility functions for semester name and code conversions
 */

/**
 * Convert semester code to human-readable name
 * @param code - Semester code like "202410"
 * @returns Human-readable name like "Fall 2024"
 */
export function semesterCodeToName(code: string): string {
  if (!code || code.length !== 6) {
    return code; // Return as-is if invalid format
  }
  
  const year = parseInt(code.substring(0, 4));
  const term = code.substring(4, 6);
  
  switch (term) {
    case '10':
      return `Fall ${year}`;
    case '20':
      return `Spring ${year + 1}`;
    case '30':
      return `Summer ${year + 1}`;
    default:
      return code; // Return as-is if unknown term
  }
}

/**
 * Convert human-readable semester name to code
 * @param name - Semester name like "Fall 2024"
 * @returns Semester code like "202410"
 */
export function semesterNameToCode(name: string): string {
  if (!name) return '';
  
  // Parse semester name (e.g., "Fall 2024", "Spring 2025")
  const parts = name.split(' ');
  if (parts.length !== 2) return name; // Return as-is if invalid format
  
  const [season, yearStr] = parts;
  const year = parseInt(yearStr);
  
  if (isNaN(year)) return name; // Return as-is if year is not a number
  
  switch (season.toLowerCase()) {
    case 'fall':
      return `${year}10`;
    case 'spring':
      // Spring uses the previous academic year code
      return `${year - 1}20`;
    case 'summer':
      // Summer uses the previous academic year code
      return `${year - 1}30`;
    default:
      return name; // Return as-is if unknown season
  }
}

/**
 * Get all semester codes between two dates
 * @param startYear - Starting year
 * @param endYear - Ending year
 * @returns Array of semester codes
 */
export function getSemesterRange(startYear: number, endYear: number): string[] {
  const semesters: string[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    semesters.push(`${year}10`); // Fall
    semesters.push(`${year}20`); // Spring (next calendar year)
    semesters.push(`${year}30`); // Summer (next calendar year)
  }
  
  return semesters;
}

/**
 * Get the current semester code based on current date
 * @returns Current semester code
 */
export function getCurrentSemesterCode(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  if (month >= 8 && month <= 12) {
    // Fall semester (August - December)
    return `${year}10`;
  } else if (month >= 1 && month <= 5) {
    // Spring semester (January - May)
    return `${year - 1}20`;
  } else {
    // Summer semester (June - July)
    return `${year - 1}30`;
  }
}

/**
 * Check if a semester is in the past
 * @param semesterCode - Semester code to check
 * @returns True if semester is in the past
 */
export function isSemesterPast(semesterCode: string): boolean {
  const currentCode = getCurrentSemesterCode();
  return semesterCode < currentCode;
}

/**
 * Check if a semester is current
 * @param semesterCode - Semester code to check
 * @returns True if semester is current
 */
export function isSemesterCurrent(semesterCode: string): boolean {
  return semesterCode === getCurrentSemesterCode();
}

/**
 * Check if a semester is in the future
 * @param semesterCode - Semester code to check
 * @returns True if semester is in the future
 */
export function isSemesterFuture(semesterCode: string): boolean {
  const currentCode = getCurrentSemesterCode();
  return semesterCode > currentCode;
}