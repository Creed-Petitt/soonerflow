"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export function useDashboardProfile() {
  const { data: session } = useSession();

  const [creditsCompleted, setCreditsCompleted] = useState(0);
  const [totalCredits, setTotalCredits] = useState(120);
  const [gpa, setGpa] = useState<number | null>(null);
  const [majorName, setMajorName] = useState<string | null>(null);
  const [enrollmentYear, setEnrollmentYear] = useState<number | null>(null);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      const url = `/api/user/dashboard?user_email=${encodeURIComponent(session.user.email)}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCreditsCompleted(data.creditsCompleted || 0);
        setTotalCredits(data.totalCredits || 120);
        setGpa(data.gpa || null);
        setMajorName(data.majorName || null);
        setEnrollmentYear(data.enrollmentYear || null);
        setGraduationYear(data.graduationYear || null);
        setUserName(session.user.name || null);

        if (!data.majorName || !data.graduationYear) {
          setShowProfileSetup(true);
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
        setCreditsCompleted(0);
        setTotalCredits(120);
        setGpa(null);
        setMajorName(null);
        setEnrollmentYear(null);
        setGraduationYear(null);
        setUserName(session.user?.name || null);
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setCreditsCompleted(0);
      setTotalCredits(120);
      setGpa(null);
      setMajorName(null);
      setEnrollmentYear(null);
      setGraduationYear(null);
      setUserName(session.user?.name || null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, session?.user?.name]);

  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false)

  useEffect(() => {
    if (!session?.user?.email || hasLoadedDashboard) {
      if (!hasLoadedDashboard && !session?.user?.email) {
        setLoading(false)
      }
      return
    }

    setHasLoadedDashboard(true)
    fetchDashboardData();
  }, [session?.user?.email, hasLoadedDashboard, fetchDashboardData]);

  useEffect(() => {
    if (!hasLoadedDashboard) return

    const handleCourseCompletion = () => {
      setHasLoadedDashboard(false)
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('coursesCompleted', handleCourseCompletion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('coursesCompleted', handleCourseCompletion);
      }
    };
  }, [hasLoadedDashboard]);

  const updateGpaAndCredits = (newCredits: number, newGpa: number) => {
    setCreditsCompleted(newCredits);
    setGpa(newGpa);
  };

  return {
    creditsCompleted,
    totalCredits,
    gpa,
    majorName,
    enrollmentYear,
    graduationYear,
    loading,
    userName,
    showProfileSetup,
    setShowProfileSetup,
    updateGpaAndCredits
  };
}