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

export function QuickActionsPanel() {
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [gpaCalculatorOpen, setGpaCalculatorOpen] = useState(false);
  
  const openAcademicCalendar = () => {
    // Open OU's Fall 2025 academic calendar
    window.open('https://www.ou.edu/registrar/academic-records/academic-calendars/fall-2025-academic-calendar0', '_blank');
  };

  const openFinalsSchedule = () => {
    // Open OU's final exam schedule
    window.open('https://www.ou.edu/registrar/academic-records/academic-calendars/fall-final-exam-schedule', '_blank');
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={openAcademicCalendar}
          >
            <Calendar className="h-4 w-4 mr-3" />
            Academic Calendar
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start h-10 hover:bg-accent"
            onClick={openFinalsSchedule}
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
      </div>
      
      <AdvisorContactModal 
        isOpen={advisorModalOpen}
        onClose={() => setAdvisorModalOpen(false)}
      />
      
      <GPACalculatorModal
        isOpen={gpaCalculatorOpen}
        onClose={() => setGpaCalculatorOpen(false)}
      />
    </>
  );
}