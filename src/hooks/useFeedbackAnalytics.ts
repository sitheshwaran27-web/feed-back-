"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { ClassFeedbackStats } from '@/types/supabase';

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

    const classMap = new Map<string, { ratings: number[]; name: string; period: number }>();

    feedbackData.forEach(entry => {
      if (!entry.classes) return; // Skip entries with no associated class
      const classId = entry.class_id;
      const className = entry.classes.name;
      const period = entry.classes.period;
      const rating = entry.rating;

      if (classMap.has(classId)) {
        classMap.get(classId)!.ratings.push(rating);
      } else {
        classMap.set(classId, { ratings: [rating], name: className, period: period });
      }
    });

    const aggregatedStats: ClassFeedbackStats[] = Array.from(classMap.entries()).map(([class_id, data]) => {
      const feedback_count = data.ratings.length;
      const totalRating = data.ratings.reduce((acc, r) => acc + r, 0);
      const average_rating = feedback_count > 0 ? parseFloat((totalRating / feedback_count).toFixed(2)) : 0;
      
      const rating_counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      data.ratings.forEach(r => {
        if (r >= 1 && r <= 5) {
          rating_counts[r as keyof typeof rating_counts]++;
        }
      });

      return {
        class_id,
        class_name: data.name,
        period: data.period,
        average_rating,
        feedback_count,
        rating_counts,
      };
    }).sort((a, b) => a.period - b.period);

    setFeedbackStats(aggregatedStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedbackStats();
  }, [fetchFeedbackStats]);

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats,
  };
};