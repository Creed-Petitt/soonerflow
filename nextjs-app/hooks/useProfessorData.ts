import { useState, useCallback } from "react";

export interface ProfessorData {
  name: string;
  rating: number;
  difficulty: number;
  wouldTakeAgain: number;
  totalRatings: number;
  tags: string[];
  ratingDistribution: number[];
}

export interface ProfessorDataError {
  type: 'not_found' | 'network_error' | 'invalid_instructor';
  message: string;
  instructorName: string;
}

interface UseProfessorDataReturn {
  professorData: ProfessorData | null;
  professorError: ProfessorDataError | null;
  isLoading: boolean;
  loadProfessorData: (instructorName: string) => Promise<void>;
  clearProfessorData: () => void;
}

export function useProfessorData(): UseProfessorDataReturn {
  const [professorData, setProfessorData] = useState<ProfessorData | null>(null);
  const [professorError, setProfessorError] = useState<ProfessorDataError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProfessorData = useCallback(async (instructorName: string) => {
    if (!instructorName || instructorName === 'TBA') {
      setProfessorData(null);
      setProfessorError({
        type: 'invalid_instructor',
        message: 'No instructor assigned',
        instructorName: instructorName || 'TBA'
      });
      return;
    }

    setIsLoading(true);
    setProfessorData(null);
    setProfessorError(null);

    try {
      // Parse instructor name (usually "Last, First")
      const nameParts = instructorName.split(',').map((p: string) => p.trim());
      const searchName = nameParts.length > 1 ?
        `${nameParts[1]} ${nameParts[0]}` : instructorName;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/professors/search?name=${encodeURIComponent(searchName)}`);

      if (response.status === 404) {
        // Professor not found - this is normal, not all professors are on RMP
        setProfessorData(null);
        setProfessorError({
          type: 'not_found',
          message: 'No ratings available for this professor',
          instructorName: searchName
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const prof = await response.json();

      // Successfully found professor data
      setProfessorData({
        name: `${prof.firstName} ${prof.lastName}`,
        rating: prof.avgRating || 0,
        difficulty: prof.avgDifficulty || 0,
        wouldTakeAgain: prof.wouldTakeAgainPercent || 0,
        totalRatings: prof.numRatings || 0,
        tags: prof.tags || [],
        ratingDistribution: prof.ratingDistribution || [0, 0, 0, 0, 0]
      });
      setProfessorError(null);
    } catch (error) {
      console.error('Error loading professor data:', error);
      setProfessorData(null);
      setProfessorError({
        type: 'network_error',
        message: 'Unable to load professor ratings',
        instructorName: instructorName
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProfessorData = useCallback(() => {
    setProfessorData(null);
    setProfessorError(null);
    setIsLoading(false);
  }, []);

  return {
    professorData,
    professorError,
    isLoading,
    loadProfessorData,
    clearProfessorData,
  };
}