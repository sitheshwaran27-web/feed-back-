"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Feedback, ClassPerformanceSummary, ClassFeedbackStats } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

export const useAdminDashboardData = () => {
  const { isAdmin, isLoading: isSessionLoading } = useSession(); // Get isAdmin and session loading state
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [classPerformance, setClassPerformance] = useState<ClassPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAdmin) { // Only fetch if user is admin
      setRecentFeedback([]);
      setClassPerformance([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [classStatsRes, recentFeedbackRes] = await Promise.all([
        supabase.rpc('get_class_feedback_stats'),
        supabase.from('feedback').select(`*, classes (name), profiles (first_name, last_name)`).order('created_at', { ascending: false }).limit(5)
      ]);

      if (classStatsRes.error || recentFeedbackRes.error) {
        console.error("Error fetching dashboard data:", classStatsRes.error || recentFeedbackRes.error);
        // Do not show error if it's a permission denied, as ProtectedRoute handles it.
        // Only show if it's an unexpected error for an admin.
        if (classStatsRes.error?.code !== '42501' && recentFeedbackRes.error?.code !== '42501') { // 42501 is permission denied
          showError("Failed to load dashboard data.");
        }
        setRecentFeedback([]);
        setClassPerformance([]);
      } else {
        const classStats: ClassFeedbackStats[] = classStatsRes.data || [];
        setClassPerformance(classStats);
        setRecentFeedback(recentFeedbackRes.data || []);
      }

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // Add isAdmin to dependencies

  useEffect(() => {
    if (!isSessionLoading) { // Only fetch once session loading is complete
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
    }
  }, [fetchData, isSessionLoading]); // Add isSessionLoading to dependencies

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