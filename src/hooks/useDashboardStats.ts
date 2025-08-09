"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface DashboardStatsData {
  studentCount: number;
  classCount: number;
  totalFeedbackCount: number;
  feedbackTodayCount: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        { count: studentCount, error: studentError },
        { count: classCount, error: classError },
        { count: totalFeedbackCount, error: totalFeedbackError },
        { count: feedbackTodayCount, error: feedbackTodayError },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', false),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('id', { count: 'exact', head: true }),
        supabase.from('feedback').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
      ]);

      if (studentError || classError || totalFeedbackError || feedbackTodayError) {
        console.error({ studentError, classError, totalFeedbackError, feedbackTodayError });
        throw new Error("Failed to load one or more dashboard statistics.");
      }

      setStats({
        studentCount: studentCount || 0,
        classCount: classCount || 0,
        totalFeedbackCount: totalFeedbackCount || 0,
        feedbackTodayCount: feedbackTodayCount || 0,
      });

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
};