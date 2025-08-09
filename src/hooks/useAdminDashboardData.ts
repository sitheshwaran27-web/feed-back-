"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Feedback, ClassPerformanceSummary } from '@/types/supabase';

export const useAdminDashboardData = () => {
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedbackRes, recentFeedbackRes] = await Promise.all([
        supabase.from('feedback').select(`class_id, rating, classes (name, period)`),
        supabase.from('feedback').select(`*, classes (name), profiles (first_name, last_name)`).order('created_at', { ascending: false }).limit(5)
      ]);

      if (feedbackRes.error || recentFeedbackRes.error) {
        console.error("Error fetching dashboard data:", feedbackRes.error || recentFeedbackRes.error);
        throw new Error("Failed to load dashboard data.");
      }

      // Process class performance stats
      const feedbackData = feedbackRes.data || [];
      const classMap = new Map<string, { ratings: number[]; name: string; period: number }>();

      feedbackData.forEach(entry => {
        if (!entry.classes) return;
        const { class_id, rating, classes } = entry;
        if (classMap.has(class_id)) {
          classMap.get(class_id)!.ratings.push(rating);
        } else {
          classMap.set(class_id, { ratings: [rating], name: classes.name, period: classes.period });
        }
      });

      const aggregatedStats: ClassPerformanceSummary[] = Array.from(classMap.entries()).map(([class_id, data]) => {
        const feedback_count = data.ratings.length;
        const totalRating = data.ratings.reduce((acc, r) => acc + r, 0);
        const average_rating = feedback_count > 0 ? parseFloat((totalRating / feedback_count).toFixed(2)) : 0;
        return {
          class_id,
          class_name: data.name,
          period: data.period,
          average_rating,
          feedback_count,
        };
      });

      setClassPerformance(aggregatedStats);
      setRecentFeedback(recentFeedbackRes.data || []);

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const topClasses = [...classPerformance].sort((a, b) => b.average_rating - a.average_rating).slice(0, 3);
  const bottomClasses = [...classPerformance].sort((a, b) => a.average_rating - b.average_rating).slice(0, 3);

  return {
    recentFeedback,
    topClasses,
    bottomClasses,
    loading,
    fetchData,
  };
};