// Major to Department mapping - comprehensive based on actual OU majors
export const MAJOR_TO_DEPT: Record<string, string[]> = {
  // Engineering
  "Computer Science": ["C S", "CS"],
  "Computer Engineering": ["C S", "CS", "ECE"],
  "Electrical Engineering": ["ECE"],
  "Electrical and Computer Engineering": ["ECE"],
  "Mechanical Engineering": ["AME"],
  "Aerospace Engineering": ["AERO", "AME"],
  "Aerospace and Defense": ["AERO", "AME"],
  "Chemical Engineering": ["CH E", "CHEM"],
  "Chemical Biosciences": ["CH E", "CHEM", "BIOL"],
  "Civil Engineering": ["CEES", "CEE"],
  "Environmental Engineering": ["CEES", "CEE", "ENST"],
  "Petroleum Engineering": ["P E"],
  "GeoEnergy Engineering": ["G E", "P E"],
  "Industrial and Systems Engineering": ["ISE"],
  "Biomedical Engineering": ["BME", "CBME"],
  "Architectural Engineering": ["ARCH", "CEES"],
  "Engineering Analytics": ["ISE", "DSA"],
  "Engineering Physics": ["ENGR", "PHYS"],

  // Sciences
  "Mathematics": ["MATH"],
  "Chemistry": ["CHEM"],
  "Chemistry and Biochemistry": ["CHEM", "BIOL"],
  "Physics": ["PHYS"],
  "Astrophysics": ["PHYS", "ASTR"],
  "Astronomy": ["ASTR", "PHYS"],
  "Biology": ["BIOL"],
  "Biochemistry": ["CHEM", "BIOL"],
  "Microbiology": ["MBIO", "BIOL"],
  "Plant Biology": ["PBIO", "BIOL"],
  "Human Health & Biology": ["BIOL", "HES"],

  // Business
  "Business": ["B AD", "ACCT", "FIN", "MKT", "SCM", "B C"],
  "Business Administration": ["B AD", "ACCT", "FIN", "MKT", "SCM", "B C"],
  "Finance": ["FIN", "B AD"],
  "Accounting": ["ACCT", "B AD"],
  "Marketing": ["MKT", "B AD"],
  "Management": ["MGT", "B AD", "B C"],
  "Management Information Systems": ["MIS", "B AD"],
  "Supply Chain Management": ["SCM", "B AD"],
  "Entrepreneurship": ["ENT", "B AD"],
  "Entrepreneurship and Venture Management": ["ENT", "B AD"],
  "International Business": ["B AD", "IAS"],
  "Energy Management": ["B AD", "P E"],
  "Healthcare Business": ["HCB", "B AD"],
  "Sports Business": ["B AD", "HES"],

  // Liberal Arts
  "Psychology": ["PSY"],
  "English": ["ENGL"],
  "History": ["HIST"],
  "Political Science": ["P SC"],
  "Economics": ["ECON"],
  "Sociology": ["SOC"],
  "Philosophy": ["PHIL"],
  "Anthropology": ["ANTH"],
  "Communication": ["COMM"],
  "Journalism": ["JMC"],
  "Letters": ["LTRS", "ENGL", "HIST", "PHIL"],
  "Linguistics": ["LING"],
  "Religious Studies": ["RELS"],

  // Health & Exercise
  "Nursing": ["NURS"],
  "Health & Exercise Science": ["HES"],
  "Health and Exercise Science": ["HES"],
  "Community Health": ["HES", "COMM"],
  "Public Health": ["HES", "COMM"],
  "Lifespan Care Administration": ["HES", "B AD"],

  // Arts & Performance
  "Music": ["MUS", "MUTE", "MUTH", "MUSC", "MUED", "MUNM"],
  "Musical Theatre": ["MTHR", "MUS", "DRAM"],
  "Dance": ["DANC"],
  "Ballet": ["DANC"],
  "Modern Dance": ["DANC"],
  "Art": ["F A", "A HI", "ARTC"],
  "Art History": ["A HI"],
  "Studio Arts": ["F A", "ARTC"],
  "Visual Communication": ["ARTC", "JMC"],
  "Theatre": ["DRAM"],
  "Film & Media Studies": ["FMS"],
  "Film and Media Studies": ["FMS"],

  // International & Area Studies
  "International Studies": ["IAS"],
  "International Security Studies": ["IAS", "P SC"],
  "International Development": ["IAS", "ECON"],
  "Asian Studies": ["EACS", "IAS"],
  "Chinese": ["CHIN"],
  "Japanese": ["JAPN"],
  "Arabic": ["ARAB"],
  "Russian": ["RUSS"],
  "German": ["GERM"],
  "French": ["FR"],
  "Spanish": ["SPAN"],
  "Italian": ["ITAL"],
  "Portuguese": ["PORT"],
  "Latin American Studies": ["IAS", "SPAN"],
  "European Studies": ["IAS", "HIST"],
  "Middle Eastern Studies": ["IAS", "ARAB"],
  "Native American Studies": ["NAS"],
  "African and African-American Studies": ["AFAM"],
  "Judaic Studies": ["RELS", "HEBR"],

  // Education
  "Elementary Education": ["EDEL", "ILAC"],
  "Early Childhood Education": ["EDEC", "ILAC"],
  "Special Education": ["EDSP", "ILAC"],
  "Language Arts Education": ["EDEN", "ILAC"],
  "Mathematics Education": ["EDMA", "ILAC"],
  "Science Education": ["EDSC", "ILAC"],
  "Social Studies Education": ["EDSS", "ILAC"],
  "World Language Education": ["EDWL", "ILAC"],
  "Instrumental Music Education": ["MUED"],
  "Vocal Music Education": ["MUED"],

  // Other Professional
  "Architecture": ["ARCH"],
  "Environmental Design": ["EN D", "ARCH"],
  "Interior Design": ["I D"],
  "Construction Science": ["CNS"],
  "Meteorology": ["METR"],
  "Geology": ["GEOL"],
  "Geophysics": ["GPHY", "GEOL"],
  "Geography": ["GEOG"],
  "Geographic Information Science": ["GIS", "GEOG"],
  "Environmental Science": ["ENST"],
  "Environmental Sustainability": ["ENST"],
  "Environmental Studies": ["ENST"],
  "Criminal Justice": ["SOC", "P SC"],
  "Social Work": ["S WK"],
  "Human Relations": ["H R"],
  "Aviation": ["AVIA"],
  "Information Science and Technology": ["LIS", "MIS"],
  "Information Studies": ["LIS"],
  "Library and Information Studies": ["LIS"],
  "Public and Nonprofit Administration": ["P SC", "B AD"],
  "Women's & Gender Studies": ["WGS"],
  "Women's and Gender Studies": ["WGS"],
  "History of Science": ["HSTM"],
  "Classics": ["CL C", "GRK", "LAT"],
  "Cybersecurity": ["CYBS", "C S"],
  "Software Development": ["SDI", "C S"],
  "Software Development & Integration": ["SDI", "C S"],
  "Applied Artificial Intelligence": ["AAI", "C S"],

  // General/Interdisciplinary
  "Interdisciplinary Studies": ["IAS", "CAS"],
  "Integrative Studies": ["CAS"],
  "Planned Program": ["CAS", "IAS"],
  "Liberal Studies": ["CAS", "IAS"]
};

export function getDepartmentsForMajor(majorName: string): string[] {
  if (!majorName) return [];

  // Clean major name by removing degree suffixes and everything after comma
  const cleanMajor = majorName.split(',')[0].trim();

  // Direct match
  if (MAJOR_TO_DEPT[cleanMajor]) {
    return MAJOR_TO_DEPT[cleanMajor];
  }

  // Try case-insensitive and partial matching
  const cleanLower = cleanMajor.toLowerCase();
  for (const [major, depts] of Object.entries(MAJOR_TO_DEPT)) {
    const majorLower = major.toLowerCase();
    if (majorLower === cleanLower ||
        majorLower.includes(cleanLower) ||
        cleanLower.includes(majorLower) ||
        cleanLower.split(/\s+/).some(word =>
          word.length > 3 && majorLower.includes(word)
        )) {
      return depts;
    }
  }

  return [];
}