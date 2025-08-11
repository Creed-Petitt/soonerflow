export type Semester = {
  year: number
  term: 'Spring' | 'Summer' | 'Fall'
  label: string
  value: string
}

export type SemesterGenerationOptions = {
  startYear?: number
  endYear?: number
  includeSummer?: boolean
  reverseOrder?: boolean
}

/**
 * Generate a list of semesters between start and end years
 * @param options Configuration for semester generation
 * @returns Array of Semester objects
 */
export function generateSemesters(options: SemesterGenerationOptions = {}): Semester[] {
  const {
    startYear = 2019,
    endYear = new Date().getFullYear() + 4,
    includeSummer = false,
    reverseOrder = false
  } = options
  
  const semesters: Semester[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    // Spring semester
    semesters.push({
      year,
      term: 'Spring',
      label: `Spring ${year}`,
      value: `Spring ${year}`
    })
    
    // Summer semester (optional)
    if (includeSummer) {
      semesters.push({
        year,
        term: 'Summer',
        label: `Summer ${year}`,
        value: `Summer ${year}`
      })
    }
    
    // Fall semester
    semesters.push({
      year,
      term: 'Fall',
      label: `Fall ${year}`,
      value: `Fall ${year}`
    })
  }
  
  return reverseOrder ? semesters.reverse() : semesters
}

/**
 * Generate semesters for a student's entire academic journey
 * @param enrollmentYear The year the student enrolled
 * @param graduationYear The expected graduation year
 * @param includeSummer Whether to include summer semesters
 * @returns Array of Semester objects
 */
export function generateStudentSemesters(
  enrollmentYear: number,
  graduationYear: number,
  includeSummer = false
): Semester[] {
  return generateSemesters({
    startYear: enrollmentYear,
    endYear: graduationYear,
    includeSummer,
    reverseOrder: false
  })
}

/**
 * Get the current semester based on the current date
 * @returns The current semester
 */
export function getCurrentSemester(): Semester {
  const now = new Date()
  const month = now.getMonth() + 1 // getMonth() is 0-indexed
  const year = now.getFullYear()
  
  let term: 'Spring' | 'Summer' | 'Fall'
  
  if (month >= 1 && month <= 5) {
    term = 'Spring'
  } else if (month >= 6 && month <= 7) {
    term = 'Summer'
  } else {
    term = 'Fall'
  }
  
  return {
    year,
    term,
    label: `${term} ${year}`,
    value: `${term} ${year}`
  }
}

/**
 * Calculate the number of semesters between enrollment and graduation
 * @param enrollmentYear The year the student enrolled
 * @param enrollmentTerm The term the student enrolled
 * @param graduationYear The expected graduation year
 * @param graduationTerm The expected graduation term
 * @param includeSummer Whether to count summer semesters
 * @returns Number of semesters
 */
export function calculateSemesterCount(
  enrollmentYear: number,
  enrollmentTerm: 'Spring' | 'Fall',
  graduationYear: number,
  graduationTerm: 'Spring' | 'Fall',
  includeSummer = false
): number {
  const multiplier = includeSummer ? 3 : 2
  
  let count = (graduationYear - enrollmentYear) * multiplier
  
  // Adjust for the specific terms
  if (!includeSummer) {
    if (enrollmentTerm === 'Fall' && graduationTerm === 'Spring') {
      count += 1
    } else if (enrollmentTerm === 'Spring' && graduationTerm === 'Fall') {
      count -= 1
    }
  }
  
  return Math.max(count, 1)
}

/**
 * Parse a semester string into components
 * @param semesterString e.g., "Fall 2024"
 * @returns Object with term and year
 */
export function parseSemester(semesterString: string): { term: string; year: number } | null {
  const match = semesterString.match(/^(Spring|Summer|Fall)\s+(\d{4})$/)
  if (!match) return null
  
  return {
    term: match[1],
    year: parseInt(match[2], 10)
  }
}

/**
 * Format a semester for display
 * @param semester The semester to format
 * @param format The format to use ('short' | 'long' | 'abbreviated')
 * @returns Formatted semester string
 */
export function formatSemester(
  semester: Semester,
  format: 'short' | 'long' | 'abbreviated' = 'long'
): string {
  switch (format) {
    case 'short':
      // e.g., "S24", "F24"
      const termAbbr = semester.term[0]
      const yearShort = semester.year.toString().slice(-2)
      return `${termAbbr}${yearShort}`
    
    case 'abbreviated':
      // e.g., "Spr 2024", "Fall 2024"
      const termAbbreviated = semester.term === 'Spring' ? 'Spr' : 
                              semester.term === 'Summer' ? 'Sum' : 
                              semester.term
      return `${termAbbreviated} ${semester.year}`
    
    case 'long':
    default:
      // e.g., "Spring 2024"
      return semester.label
  }
}

/**
 * Get semesters for a dropdown/select component
 * Commonly used for marking classes as completed
 * @param yearsBack How many years back to include from current year
 * @param yearsForward How many years forward to include from current year
 * @returns Array of semester options
 */
export function getSemesterOptions(yearsBack = 5, yearsForward = 3): Semester[] {
  const currentYear = new Date().getFullYear()
  return generateSemesters({
    startYear: currentYear - yearsBack,
    endYear: currentYear + yearsForward,
    includeSummer: false,
    reverseOrder: true // Most recent first
  })
}