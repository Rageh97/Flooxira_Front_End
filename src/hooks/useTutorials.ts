import { useState, useEffect } from "react";
import { Tutorial } from "@/types/tutorial";

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadTutorials = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/tutorials`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTutorials(data.tutorials);
      } else {
        setError(data.message || 'Failed to load tutorials');
      }
    } catch (e: any) {
      console.error('Error loading tutorials:', e);
      setError(e.message || 'Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorials();
  }, []);

  const getTutorialByCategory = (category: string): Tutorial | null => {
    return tutorials.find(t => 
      t.category.toLowerCase() === category.toLowerCase() ||
      t.category.toLowerCase().includes(category.toLowerCase())
    ) || null;
  };

  const getTutorialsByCategory = (category: string): Tutorial[] => {
    return tutorials.filter(t => 
      t.category.toLowerCase() === category.toLowerCase() ||
      t.category.toLowerCase().includes(category.toLowerCase())
    );
  };

  const incrementViews = async (tutorialId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/tutorials/${tutorialId}/view`, {
        method: 'POST'
      });
    } catch (e) {
      console.error('Error incrementing views:', e);
    }
  };

  return {
    tutorials,
    loading,
    error,
    loadTutorials,
    getTutorialByCategory,
    getTutorialsByCategory,
    incrementViews
  };
}













