"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { X, Search, Filter, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassDetailDialog } from "./class-detail-dialog";
import { useSchedule } from "@/hooks/use-schedule";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ScheduleErrorDialog, type ScheduleErrorType } from "@/components/schedule-error-dialog";

// Major to Department mapping - comprehensive based on actual OU majors
const MAJOR_TO_DEPT: Record<string, string[]> = {
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

interface ClassData {
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

interface GroupedClass {
  subject: string;
  number: string;
  title: string;
  credits?: number;
  sections: ClassData[];
  labSections: ClassData[];
}

interface ClassBrowserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userMajor?: string;
}

export function ClassBrowserPanel({ isOpen, onClose, userMajor }: ClassBrowserPanelProps) {
  const { data: session } = useSession();
  const { scheduledClasses, addClass, isClassScheduled, currentSemester } = useSchedule();
  
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
  const [filteredGroupedClasses, setFilteredGroupedClasses] = useState<GroupedClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState<{code: string, count: number}[]>([]);
  const [hideFullClasses, setHideFullClasses] = useState(false);
  const [userMajorDepts, setUserMajorDepts] = useState<string[]>([]);
  const [departmentCache, setDepartmentCache] = useState<Record<string, ClassData[]>>({});
  
  // Dialog state
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Validation error state
  const [validationError, setValidationError] = useState<{
    isOpen: boolean;
    errorType: ScheduleErrorType;
    classInfo: any;
    conflicts?: any[];
    missingPrerequisites?: any[];
    pendingAddData?: { section: any; labSection?: any };
  }>({
    isOpen: false,
    errorType: "time_conflict",
    classInfo: { subject: "", number: "", title: "" },
    conflicts: [],
    missingPrerequisites: [],
    pendingAddData: undefined
  });

  // Load departments when panel opens
  useEffect(() => {
    if (isOpen && departments.length === 0) {
      loadDepartments();
    }
  }, [isOpen]);
  
  // Load classes when department changes
  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== "major") {
      loadClassesForDepartment(selectedDepartment);
    } else if (selectedDepartment === "major" && userMajorDepts.length > 0) {
      // Load classes for all major departments
      loadClassesForMajor();
    }
  }, [selectedDepartment, userMajorDepts]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      
      // Load departments list
      const deptResponse = await fetch('/api/classes/departments');
      if (!deptResponse.ok) throw new Error('Failed to fetch departments');
      
      const deptData = await deptResponse.json();
      setDepartments(deptData.departments || []);
      
      // Get user's major departments
      let majorDepts: string[] = [];
      if (session?.user?.githubId) {
        const userResponse = await fetch(`/api/users/${session.user.githubId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.major) {
            // Clean major name by removing degree suffixes and everything after comma
            const cleanMajor = userData.major.split(',')[0].trim();
            
            // Get departments for this major with flexible matching
            if (MAJOR_TO_DEPT[cleanMajor]) {
              majorDepts = MAJOR_TO_DEPT[cleanMajor];
            } else {
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
                  majorDepts = depts;
                  break;
                }
              }
            }
            console.log('User major:', userData.major, '-> Depts:', majorDepts);
          }
        }
      }
      
      setUserMajorDepts(majorDepts);
      
      // Auto-select department
      if (majorDepts.length > 0) {
        // If user has major departments, select "major"
        setSelectedDepartment("major");
      } else if (deptData.departments.length > 0) {
        // Otherwise select first department
        setSelectedDepartment(deptData.departments[0].code);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };
  
  const loadClassesForDepartment = async (dept: string) => {
    // Check cache first
    if (departmentCache[dept]) {
      processClasses(departmentCache[dept]);
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/classes?subject=${dept}&semester=${currentSemester}&limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      
      const data = await response.json();
      const deptClasses = data.classes || [];
      
      // Cache the department data
      setDepartmentCache(prev => ({ ...prev, [dept]: deptClasses }));
      
      processClasses(deptClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };
  
  const loadClassesForMajor = async () => {
    try {
      setLoading(true);
      
      const allMajorClasses: ClassData[] = [];
      
      // Load classes for each major department
      for (const dept of userMajorDepts) {
        if (departmentCache[dept]) {
          allMajorClasses.push(...departmentCache[dept]);
        } else {
          const response = await fetch(`/api/classes?subject=${dept}&semester=${currentSemester}&limit=1000`);
          if (response.ok) {
            const data = await response.json();
            const deptClasses = data.classes || [];
            allMajorClasses.push(...deptClasses);
            // Cache the department data
            setDepartmentCache(prev => ({ ...prev, [dept]: deptClasses }));
          }
        }
      }
      
      processClasses(allMajorClasses);
    } catch (error) {
      console.error('Error loading major classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };
  
  const processClasses = (allClasses: ClassData[]) => {
    setClasses(allClasses);
    
    // Group classes by subject + number
    const grouped: Record<string, GroupedClass> = {};
    allClasses.forEach((cls: ClassData) => {
      // Skip invalid classes
      if (!cls.subject || (!cls.number && !cls.courseNumber)) return;
      
      const key = `${cls.subject} ${cls.number || cls.courseNumber}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          subject: cls.subject,
          number: cls.number || cls.courseNumber,
          title: cls.title,
          credits: cls.credits,
          sections: [],
          labSections: []
        };
      }
      
      // Separate labs from lectures
      if (cls.type === "Lab" || cls.type === "Lab with No Credit") {
        grouped[key].labSections.push(cls);
      } else {
        grouped[key].sections.push(cls);
      }
    });
    
    // Filter out groups with no sections
    const groupedArray = Object.values(grouped).filter(g => 
      g.sections.length > 0 || g.labSections.length > 0
    );
    setGroupedClasses(groupedArray);
    setFilteredGroupedClasses(groupedArray);
  };
  

  // Filter grouped classes
  useEffect(() => {
    let filtered = [...groupedClasses];

    // Note: Department filtering is now done at load time
    // This only handles search and hide full

    // Hide full classes (check if any section has seats)
    if (hideFullClasses) {
      filtered = filtered.filter(g => {
        // Check if at least one section has available seats
        const hasAvailableSection = g.sections.some(s => 
          s.available_seats === undefined || s.available_seats > 0
        );
        return hasAvailableSection;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(g => 
        g.subject.toLowerCase().includes(search) ||
        g.number.toLowerCase().includes(search) ||
        g.title.toLowerCase().includes(search) ||
        `${g.subject} ${g.number}`.toLowerCase().includes(search) ||
        // Also search in instructor names across all sections
        g.sections.some(s => s.instructor?.toLowerCase().includes(search))
      );
    }

    setFilteredGroupedClasses(filtered);
  }, [groupedClasses, searchTerm, hideFullClasses]);

  const checkTimeConflict = (classToCheck: ClassData) => {
    // Simple conflict check - you can enhance this
    return false; // Placeholder
  };

  const formatMeetingTime = (meetingTimes: any[]) => {
    if (!meetingTimes || meetingTimes.length === 0) return "TBA";
    const mt = meetingTimes[0];
    if (!mt.startTime || !mt.endTime) return "TBA";
    return `${mt.days || ""} ${mt.startTime}-${mt.endTime}`;
  };

  const handleClassClick = (groupedClass: GroupedClass) => {
    // Pass the grouped class directly
    setSelectedClass(groupedClass);
    setIsDialogOpen(true);
  };

  // Get display info for a grouped class
  const getGroupedClassDisplay = (grouped: GroupedClass) => {
    // Ensure we have sections
    if (!grouped.sections || grouped.sections.length === 0) {
      return {
        displaySection: null,
        totalAvailable: 0,
        totalSeats: 0,
        sectionCount: 0,
        labCount: grouped.labSections?.length || 0
      };
    }
    
    // Find first section with available seats for display
    const availableSection = grouped.sections.find(s => 
      s.available_seats === undefined || s.available_seats > 0
    ) || grouped.sections[0];
    
    // Count total available seats across all sections
    const totalAvailable = grouped.sections.reduce((sum, s) => 
      sum + (s.available_seats || 0), 0
    );
    const totalSeats = grouped.sections.reduce((sum, s) => 
      sum + (s.total_seats || 0), 0
    );
    
    return {
      displaySection: availableSection,
      totalAvailable,
      totalSeats,
      sectionCount: grouped.sections.length,
      labCount: grouped.labSections?.length || 0
    };
  };

  const handleAddToSchedule = async (section: any, labSection?: any) => {
    // First validate the class before adding
    try {
      // Get the current schedule ID
      const scheduleResponse = await fetch(`/api/users/${session?.user?.githubId}/schedule/${currentSemester}`);
      if (!scheduleResponse.ok) {
        toast.error("Could not validate class - schedule not found");
        return;
      }
      const scheduleData = await scheduleResponse.json();
      const scheduleId = scheduleData.schedule_id;
      
      // Check for time conflicts
      const conflictResponse = await fetch(`/api/schedules/${scheduleId}/validate-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: section.id, schedule_id: scheduleId })
      });
      
      if (conflictResponse.ok) {
        const conflictData = await conflictResponse.json();
        
        if (conflictData.has_conflict) {
          // Show conflict error dialog
          setValidationError({
            isOpen: true,
            errorType: "time_conflict",
            classInfo: {
              subject: section.subject,
              number: section.number || section.courseNumber,
              title: section.title
            },
            conflicts: conflictData.conflicts,
            missingPrerequisites: [],
            pendingAddData: undefined
          });
          return;
        }
      }
      
      // Check prerequisites
      const prereqResponse = await fetch(`/api/schedules/${scheduleId}/validate-prerequisites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          class_id: section.id, 
          schedule_id: scheduleId
        })
      });
      
      if (prereqResponse.ok) {
        const prereqData = await prereqResponse.json();
        
        if (!prereqData.prerequisites_met) {
          // Show prerequisite error dialog with option to add anyway
          setValidationError({
            isOpen: true,
            errorType: "missing_prerequisites",
            classInfo: {
              subject: section.subject,
              number: section.number || section.courseNumber,
              title: section.title
            },
            conflicts: [],
            missingPrerequisites: prereqData.missing,
            pendingAddData: { section, labSection }
          });
          return;
        }
      }
      
      // If all validations pass, add the class
      addClassToSchedule(section, labSection);
      
    } catch (error) {
      console.error("Error validating class:", error);
      // If validation fails, add anyway (fallback behavior)
      addClassToSchedule(section, labSection);
    }
  };
  
  const addClassToSchedule = (section: any, labSection?: any) => {
    // Format the class data for the schedule
    const classData = {
      id: section.id,
      subject: section.subject,
      number: section.number || section.courseNumber,
      title: section.title,
      instructor: section.instructor || "TBA",
      time: section.meetingTimes?.[0] ? 
        `${section.meetingTimes[0].days || ''} ${section.meetingTimes[0].startTime || ''}-${section.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
        : section.time || "TBA",
      location: section.meetingTimes?.[0]?.location || section.location || "TBA",
      credits: section.credits || 3,
      type: section.type,
      color: "#3b82f6", // Default blue
      available_seats: section.available_seats ?? section.availableSeats,
      total_seats: section.total_seats ?? section.totalSeats,
    };

    addClass(classData);
    
    // If there's a lab, add it too
    if (labSection) {
      const labData = {
        id: labSection.id,
        subject: labSection.subject,
        number: labSection.number || labSection.courseNumber,
        title: `Lab - ${section.title}`,
        instructor: labSection.instructor || "TBA",
        time: labSection.meetingTimes?.[0] ? 
          `${labSection.meetingTimes[0].days || ''} ${labSection.meetingTimes[0].startTime || ''}-${labSection.meetingTimes[0].endTime || ''}`.trim() || 'TBA'
          : labSection.time || "TBA",
        location: labSection.meetingTimes?.[0]?.location || labSection.location || "TBA",
        credits: 0,
        type: "Lab",
        color: "#10b981", // Green for labs
        available_seats: labSection.available_seats ?? labSection.availableSeats,
        total_seats: labSection.total_seats ?? labSection.totalSeats,
      };
      addClass(labData);
    }

    toast.success(`Added ${section.subject} ${section.number || section.courseNumber} to schedule`);
    setIsDialogOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed left-0 top-0 h-full w-[600px] bg-background border-r shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Browse Classes</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {userMajorDepts.length > 0 && (
                  <SelectItem value="major">My Major</SelectItem>
                )}
                {departments.map(dept => (
                  <SelectItem key={dept.code} value={dept.code}>
                    {dept.code} ({dept.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={hideFullClasses ? "default" : "outline"}
              size="sm"
              onClick={() => setHideFullClasses(!hideFullClasses)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Hide Full
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[120px]">Course</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[80px]">Credits</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading classes...
                  </TableCell>
                </TableRow>
              ) : filteredGroupedClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroupedClasses.slice(0, 100).map((grouped: GroupedClass) => {
                  const display = getGroupedClassDisplay(grouped);
                  const isScheduled = grouped.sections.some(s => isClassScheduled(s.id));
                  const allFull = display.totalAvailable === 0 && display.totalSeats > 0;
                  
                  return (
                    <TableRow 
                      key={`${grouped.subject}-${grouped.number}`}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        isScheduled ? 'opacity-50' : ''
                      }`}
                      onClick={() => handleClassClick(grouped)}
                    >
                      <TableCell className="font-medium">
                        {grouped.subject} {grouped.number}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <div>
                          <div>{grouped.title}</div>
                          {grouped.labSections.length > 0 && (
                            <span className="text-xs text-muted-foreground">+Lab</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{grouped.credits || 3}</TableCell>
                      <TableCell>
                        {isScheduled ? (
                          <Badge variant="secondary" className="text-xs">Added</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={allFull}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClassClick(grouped);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {filteredGroupedClasses.length > 100 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Showing first 100 results. Use filters to narrow your search.
            </div>
          )}
        </div>
      </div>

      {/* Class Detail Dialog */}
      {selectedClass && (
        <ClassDetailDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          groupedClass={selectedClass}
          onAddToSchedule={handleAddToSchedule}
        />
      )}
      
      {/* Schedule Error Dialog */}
      <ScheduleErrorDialog
        isOpen={validationError.isOpen}
        onClose={() => setValidationError(prev => ({ ...prev, isOpen: false }))}
        errorType={validationError.errorType}
        classInfo={validationError.classInfo}
        conflicts={validationError.conflicts}
        missingPrerequisites={validationError.missingPrerequisites}
        allowAddAnyway={validationError.errorType === "missing_prerequisites"}
        onAddAnyway={() => {
          if (validationError.pendingAddData) {
            addClassToSchedule(
              validationError.pendingAddData.section, 
              validationError.pendingAddData.labSection
            );
          }
        }}
      />
    </>
  );
}