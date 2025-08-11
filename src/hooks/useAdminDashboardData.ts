"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Feedback, SubjectPerformanceSummary, SubjectFeedbackStats } from '@/types/supabase'; // Renamed imports
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

export const useAdminDashboardData = () => {
  const { isAdmin, isLoading: isSessionLoading } = useSession(); // Get isAdmin and session loading state
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceSummary[]>([]); // Renamed state variable
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAdmin) { // Only fetch if user is admin
      setRecentFeedback([]);
      setSubjectPerformance([]); // Renamed state variable
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subjectStatsRes, recentFeedbackRes] = await Promise.all([ // Renamed variable
        supabase.rpc('get_subject_feedback_stats'), // Renamed RPC call
        supabase.from('feedback').select(`*, subjects (name), profiles (first_name, last_name)`).order('created_at', { ascending: false }).limit(5) // Renamed from classes
      ]);

      if (subjectStatsRes.error || recentFeedbackRes.error) { // Renamed variable
        console.error("Error fetching dashboard data:", subjectStatsRes.error || recentFeedbackRes.error); // Renamed variable
        // Do not show error if it's a permission denied, as ProtectedRoute handles it.
        // Only show if it's an unexpected error for an admin.
        if (subjectStatsRes.error?.code !== '42501' && recentFeedbackRes.error?.code !== '42501') { // 42501 is permission denied
          showError("Failed to load dashboard data.");
        }
        setRecentFeedback([]);
        setSubjectPerformance([]); // Renamed state variable
      } else {
        const subjectStats: SubjectFeedbackStats[] = subjectStatsRes.data || []; // Renamed type and variable
        setSubjectPerformance(subjectStats); // Renamed state variable
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

  const topSubjects = [...subjectPerformance].sort((a, b) => b.average_rating - a.average_rating).slice(0, 3); // Renamed variable
  const bottomSubjects = [...subjectPerformance].sort((a, b) => a.average_rating - b.average_rating).slice(0, 3); // Renamed variable

  return {
    recentFeedback,
    topSubjects, // Renamed return value
    bottomSubjects, // Renamed return value
    loading,
    fetchData,
  };
};