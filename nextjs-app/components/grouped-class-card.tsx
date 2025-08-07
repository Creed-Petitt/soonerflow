"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { User } from "lucide-react"
import { UnifiedClassPopover } from "@/components/unified-class-popover"

interface ClassData {
  id: string
  subject: string
  number: string
  title: string
  instructor: string
  time: string
  location: string
  credits?: number
  rating?: number
  difficulty?: number
  wouldTakeAgain?: number
  available_seats?: number
  total_seats?: number
  type?: string  // ADDED: Class type (Lecture, Lab with No Credit, etc.)
}

interface GroupedClass {
  subject: string
  number: string
  title: string
  credits?: number
  sections: ClassData[]
  labSections?: ClassData[]
}

interface GroupedClassCardProps {
  groupedClass: GroupedClass
  onAddToSchedule: (classData: ClassData) => void
  onRemoveFromSchedule: (classId: string) => void
  isAnyScheduled: boolean
  scheduledClasses?: ClassData[] // Add this to help find which section to remove
}

// Truncate long meeting times for better display
const truncateTime = (timeString: string, maxLength: number = 25) => {
  if (timeString.length <= maxLength) return timeString;
  return timeString.substring(0, maxLength - 3) + '...';
};

// Get seat availability badge and info
const getSeatAvailability = (availableSeats?: number, totalSeats?: number) => {
  if (availableSeats === undefined || totalSeats === undefined) {
    return { badge: null, text: 'TBA' };
  }
  
  let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';
  let badgeText = 'TBA';
  let badgeClass = '';
  
  if (availableSeats > 10) {
    badgeText = 'Open';
    badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (availableSeats > 0) {
    badgeText = 'Limited';
    badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else {
    badgeText = 'Full';
    badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  
  return {
    badge: { text: badgeText, className: badgeClass },
    text: `${availableSeats}/${totalSeats}`
  };
};

// Detect lecture/lab patterns in sections
const analyzeSections = (sections: ClassData[]) => {
  // Group sections by time + instructor + location
  const groups = new Map<string, ClassData[]>();
  
  sections.forEach(section => {
    const key = `${section.time}|${section.instructor}|${section.location}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(section);
  });
  
  // If multiple sections share same time/instructor/location, they're likely lecture + labs
  const sectionLabels = new Map<string, string>();
  
  groups.forEach((groupSections, key) => {
    if (groupSections.length > 1) {
      // Sort by total seats (lecture usually has more seats)
      const sorted = [...groupSections].sort((a, b) => (b.total_seats || 0) - (a.total_seats || 0));
      
      sorted.forEach((section, index) => {
        if (index === 0 && (section.total_seats || 0) > 50) {
          sectionLabels.set(section.id, 'Lecture');
        } else {
          sectionLabels.set(section.id, `Lab ${String.fromCharCode(65 + index)}`); // Lab A, Lab B, etc.
        }
      });
    } else {
      // Single section, check if it looks like a lab by class code or title
      const section = groupSections[0];
      if (section.title.toLowerCase().includes('lab') || 
          section.location.toLowerCase().includes('lab')) {
        sectionLabels.set(section.id, 'Lab');
      }
    }
  });
  
  return sectionLabels;
};


export function GroupedClassCard({ 
  groupedClass, 
  onAddToSchedule, 
  onRemoveFromSchedule,
  isAnyScheduled,
  scheduledClasses = []
}: GroupedClassCardProps) {
  const [selectedSectionId, setSelectedSectionId] = React.useState<string>("")
  
  // Get the best rated section as default
  const bestSection = groupedClass.sections.reduce((best, current) => 
    (current.rating || 0) > (best.rating || 0) ? current : best
  )
  
  const selectedSection = selectedSectionId 
    ? groupedClass.sections.find(s => s.id === selectedSectionId) || bestSection
    : bestSection

  const handleAddToSchedule = (section?: ClassData) => {
    const sectionToUse = section || selectedSection;
    if (sectionToUse) {
      if (isAnyScheduled) {
        // Find ANY scheduled section from this class group and remove it
        const scheduledSection = groupedClass.sections.find(section => 
          scheduledClasses.some(scheduled => scheduled.id === section.id)
        );
        if (scheduledSection) {
          onRemoveFromSchedule(scheduledSection.id)
        }
      } else {
        onAddToSchedule(sectionToUse)
      }
    }
  }

  // Get seat availability for indicator dot
  const seatAvailability = getSeatAvailability(selectedSection.available_seats, selectedSection.total_seats)


  return (
    <div className="mb-1.5">
      {/* Clickable Badge */}
      <UnifiedClassPopover 
        groupedClass={groupedClass}
        selectedSection={selectedSection}
        onAddToSchedule={handleAddToSchedule}
      />
    </div>
  )
}