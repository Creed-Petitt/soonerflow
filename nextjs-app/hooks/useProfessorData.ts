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

interface UseProfessorDataReturn {
  professorData: ProfessorData | null;
  loading: boolean;
  loadProfessorData: (instructorName: string) => Promise<void>;
  clearProfessorData: () => void;
}

export function useProfessorData(): UseProfessorDataReturn {
  const [professorData, setProfessorData] = useState<ProfessorData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfessorData = useCallback(async (instructorName: string) => {
    if (!instructorName || instructorName === 'TBA') {
      setProfessorData(null);
      return;
    }

    setLoading(true);
    try {
      // Parse instructor name (usually "Last, First")
      const nameParts = instructorName.split(',').map((p: string) => p.trim());
      const searchName = nameParts.length > 1 ?
        `${nameParts[1]} ${nameParts[0]}` : instructorName;

      const response = await fetch(`/api/professors/search?name=${encodeURIComponent(searchName)}`);
      if (response.ok) {
        const prof = await response.json();
        if (prof && prof.id) {
          setProfessorData({
            name: `${prof.firstName} ${prof.lastName}`,
            rating: prof.avgRating || 0,
            difficulty: prof.avgDifficulty || 0,
            wouldTakeAgain: prof.wouldTakeAgainPercent || 0,
            totalRatings: prof.numRatings || 0,
            tags: prof.tags || [],
            ratingDistribution: prof.ratingDistribution || [0, 0, 0, 0, 0]
          });
        } else {
          setProfessorData(null);
        }
      } else {
        setProfessorData(null);
      }
    } catch (error) {
      console.error('Error loading professor data:', error);
      setProfessorData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfessorData = useCallback(() => {
    setProfessorData(null);
    setLoading(false);
  }, []);

  return {
    professorData,
    loading,
    loadProfessorData,
    clearProfessorData,
  };
}