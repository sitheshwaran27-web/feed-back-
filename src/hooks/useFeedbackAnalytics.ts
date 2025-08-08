"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { ClassFeedbackStats } from '@/types/supabase'; // Import ClassFeedbackStats

export const useFeedbackAnalytics = () => {
  const [feedbackStats, setFeedbackStats] = useState<ClassFeedbackStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbackStats = useCallback(async () => {
    setLoading(true);
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        class_id,
        rating,
        classes (name, period)
      `);

    if (feedbackError) {
      console.error("Error fetching feedback for analytics:", feedbackError);
      showError("Failed to load feedback analytics.");
      setLoading(false);
      return;
    }

    if (!feedbackData || feedbackData.length === 0) {
      setFeedbackStats([]);
      setLoading(false);
      return;
    }

    // Aggregate data to calculate average rating per class
    const classMap = new Map<string, { totalRating: number; count: number; name: string; period: number }>();

    feedbackData.forEach(entry => {
      const classId = entry.class_id;
      const className = entry.classes?.name || 'Unknown Class';
      const period = entry.classes?.period || 0;
      const rating = entry.rating;

      if (classMap.has(classId)) {
        const existing = classMap.get(classId)!;
        existing.totalRating += rating;
        existing.count += 1;
      } else {
        classMap.set(classId, { totalRating: rating, count: 1, name: className, period: period });
      }
    });

    const aggregatedStats: ClassFeedbackStats[] = Array.from(classMap.entries()).map(([class_id, data]) => ({
      class_id,
      class_name: data.name,
      period: data.period,
      average_rating: parseFloat((data.totalRating / data.count).toFixed(2)),
      feedback_count: data.count,
    })).sort((a, b) => a.period - b.period); // Sort by period number

    setFeedbackStats(aggregatedStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedbackStats();
  }, [fetchFeedbackStats]);

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats, // Expose for manual refresh if needed
  };
};