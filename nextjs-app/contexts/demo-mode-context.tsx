"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  demoSchedule: any[];
}

// Sample demo data for OU classes
const sampleDemoSchedule = [
  {
    id: "demo-1",
    subject: "ECE",
    number: "2214", 
    title: "Digital Design",
    instructor: "Fitzmorris, Clifford",
    time: "MWF 10:00 am-10:50 am",
    location: "Felgar Hall 300",
    credits: 4,
    type: "Lecture",
    colorBg: "bg-blue-100",
    colorHex: "#3b82f6",
    available_seats: 42,
    total_seats: 144,
    rating: 3.8,
    difficulty: 2.8,
    wouldTakeAgain: 61.9
  },
  {
    id: "demo-2", 
    subject: "MATH",
    number: "2924",
    title: "Differential Equations",
    instructor: "Johnson, Michael",
    time: "TR 2:00 pm-3:15 pm", 
    location: "Physical Sciences 114",
    credits: 3,
    type: "Lecture",
    colorBg: "bg-green-100",
    colorHex: "#10b981",
    available_seats: 15,
    total_seats: 45,
    rating: 4.1,
    difficulty: 3.2,
    wouldTakeAgain: 72.5
  },
  {
    id: "demo-3",
    subject: "PHYS", 
    number: "2534",
    title: "Physics for Engineers II",
    instructor: "Smith, Jennifer",
    time: "MWF 1:00 pm-1:50 pm",
    location: "Nielsen Hall 170",
    credits: 4,
    type: "Lecture", 
    colorBg: "bg-purple-100",
    colorHex: "#8b5cf6",
    available_seats: 8,
    total_seats: 120,
    rating: 3.6,
    difficulty: 3.8,
    wouldTakeAgain: 58.3
  },
  {
    id: "demo-4",
    subject: "ENGL",
    number: "1213", 
    title: "English Composition",
    instructor: "Davis, Sarah",
    time: "TR 11:00 am-12:15 pm",
    location: "Ellison Hall 205",
    credits: 3,
    type: "Lecture",
    colorBg: "bg-orange-100", 
    colorHex: "#f59e0b",
    available_seats: 5,
    total_seats: 25,
    rating: 4.3,
    difficulty: 2.1,
    wouldTakeAgain: 85.7
  }
];

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const demoFlag = localStorage.getItem("demoMode");
    if (demoFlag === "true") {
      setIsDemoMode(true);
    }
  }, []);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("demoMode", "true");
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem("demoMode");
  };

  return (
    <DemoModeContext.Provider value={{ 
      isDemoMode, 
      enableDemoMode, 
      disableDemoMode, 
      demoSchedule: sampleDemoSchedule 
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error("useDemoMode must be used within a DemoModeProvider");
  }
  return context;
}