"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  UserCircle,
  Calculator
} from "lucide-react";
import { AdvisorContactModal } from "./advisor-contact-modal";
import { GPACalculatorModal } from "./gpa-calculator-modal";
import { AcademicCalendarModal } from "./academic-calendar-modal";
import { FinalsScheduleModal } from "./finals-schedule-modal";

export function QuickActionsPanel() {
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [gpaCalculatorOpen, setGpaCalculatorOpen] = useState(false);
  const [academicCalendarOpen, setAcademicCalendarOpen] = useState(false);
  const [finalsScheduleOpen, setFinalsScheduleOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={() => setAcademicCalendarOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-3" />
            Academic Calendar
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={() => setFinalsScheduleOpen(true)}
          >
            <Clock className="h-4 w-4 mr-3" />
            Finals Exam Schedule
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={() => setAdvisorModalOpen(true)}
          >
            <UserCircle className="h-4 w-4 mr-3" />
            Advisor Contact
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={() => setGpaCalculatorOpen(true)}
          >
            <Calculator className="h-4 w-4 mr-3" />
            GPA Calculator
          </Button>
      </div>
      
      <AdvisorContactModal 
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
      />
      
      <GPACalculatorModal
        isOpen={gpaCalculatorOpen}
        onClose={() => setGpaCalculatorOpen(false)}
      />
      
      <AcademicCalendarModal
        isOpen={academicCalendarOpen}
        onClose={() => setAcademicCalendarOpen(false)}
      />
      
      <FinalsScheduleModal
        isOpen={finalsScheduleOpen}
        onClose={() => setFinalsScheduleOpen(false)}
      />
    </>
  );
}