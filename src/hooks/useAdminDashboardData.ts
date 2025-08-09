"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Feedback, ClassPerformanceSummary, ClassFeedbackStats } from '@/types/supabase';

export const useAdminDashboardData = () => {
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classStatsRes, recentFeedbackRes] = await Promise.all([
        supabase.rpc('get_class_feedback_stats'),
        supabase.from('feedback').select(`*, classes (name), profiles (first_name, last_name)`).order('created_at', { ascending: false }).limit(5)
      ]);

      if (classStatsRes.error || recentFeedbackRes.error) {
        console.error("Error fetching dashboard data:", classStatsRes.error || recentFeedbackRes.error);
        throw new Error("Failed to load dashboard data.");
      }

      // Data is now pre-aggregated by the database function.
      const classStats: ClassFeedbackStats[] = classStatsRes.data || [];
      
      // The returned data is compatible with ClassPerformanceSummary
      setClassPerformance(classStats);
      setRecentFeedback(recentFeedbackRes.data || []);

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-dashboard-feedback-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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