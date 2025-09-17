export function cleanDescription(description: string): string {
  if (!description) return description;

  let cleaned = description
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const boilerplatePatterns = [
    /This course\/section has been selected for the Inclusive Access \(IA\) program.*?Check here to view the savings for your course material: https:\/\/link\.ou\.edu\/ia-savings\s*/gi,
    /STUDENTS MUST ENROLL IN ONE OF THE FOLLOWING CO-REQUISITE:.*?\s*/gi,
    /Co-requisite:.*?\s*/gi,
    /Corequisite:.*?\s*/gi,
    /Prerequisite[s]?:.*?\.\s*/gi,  // Remove prerequisite text and following period
    /Prerequisites?:.*?\.\s*/gi,
  ];

  boilerplatePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Clean up any leading periods or extra spaces
  cleaned = cleaned.replace(/^\.\s*/, '').replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function formatPrerequisites(prerequisites: any[]): string {
  if (!prerequisites || prerequisites.length === 0) return '';

  const groups = prerequisites.map(group => {
    const courses = group.courses.map((c: any) => `${c.subject} ${c.number}`).join(' or ');
    return courses;
  });

  return groups.join(' and ');
}

export function formatMeetingTime(meetingTimes: any[]): string {
  if (!meetingTimes || meetingTimes.length === 0) return "TBA";
  const mt = meetingTimes[0];
  if (!mt.startTime || !mt.endTime) return "TBA";
  return `${mt.days || ""} ${mt.startTime}-${mt.endTime}`;
}

export function checkTimeConflict(classToCheck: any, existingClasses: any[]): boolean {
  // Simple conflict check - you can enhance this
  return false; // Placeholder
}