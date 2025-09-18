"use client";

import CustomNavbar from "@/components/custom-navbar";
import { StudentProfileCard } from "@/components/dashboard/student-profile-card";
import { GPACard } from "@/components/dashboard/gpa-card";
import { CompactSemesterTimeline } from "@/components/dashboard/compact-semester-timeline";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { DegreeRequirementsWidget } from "@/components/dashboard/degree-requirements-widget";
import { ProfileSetupModal } from "@/components/profile-setup-modal";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const {
    creditsCompleted,
    totalCredits,
    gpa,
    majorName,
    graduationYear,
    loading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    semesterTimelineData,
    handleCoursesUpdate,
    handleRemoveCourse
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomNavbar />
      
      <ProfileSetupModal 
        isOpen={showProfileSetup}
        onComplete={() => setShowProfileSetup(false)}
      />
      
      <main className="flex-1 flex flex-col justify-start lg:justify-center max-w-7xl mx-auto px-6 py-6 w-full">
        {!loading && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <div className="flex-1">
                    <StudentProfileCard
                      userName={userName}
                      majorName={majorName}
                      graduationYear={graduationYear}
                      gpa={gpa}
                      creditsCompleted={creditsCompleted}
                      totalCredits={totalCredits}
                      academicStanding={gpa && gpa < 2.0 ? 'warning' : 'good'}
                    />
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <GPACard gpa={gpa} />
                  </div>
                </div>
                <CompactSemesterTimeline
                  semesters={semesterTimelineData}
                  onCoursesUpdate={handleCoursesUpdate}
                  onRemoveCourse={handleRemoveCourse}
                />
              </div>
              <div className="space-y-6">
                <QuickActionsPanel />
                <DegreeRequirementsWidget />
              </div>
            </div>
          </>
        )}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}