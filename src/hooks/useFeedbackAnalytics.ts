"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { ClassFeedbackStats } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

export const useFeedbackAnalytics = () => {
  const { isAdmin, isLoading: isSessionLoading } = useSession(); // Get isAdmin and session loading state
  const [feedbackStats, setFeedbackStats] = useState<ClassFeedbackStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbackStats = useCallback(async () => {
    if (!isAdmin) { // Only fetch if user is admin
      setFeedbackStats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_class_feedback_stats');

    if (error) {
      console.error("Error fetching feedback for analytics:", error);
      if (error?.code !== '42501') { // 42501 is permission denied
        showError("Failed to load feedback analytics.");
      }
      setFeedbackStats([]);
    } else {
      setFeedbackStats(data || []);
    }
    setLoading(false);
  }, [isAdmin]); // Add isAdmin to dependencies

  useEffect(() => {
    if (!isSessionLoading) { // Only fetch once session loading is complete
      fetchFeedbackStats();

      const channel = supabase
        .channel('feedback-analytics-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback' },
          () => fetchFeedbackStats()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchFeedbackStats, isSessionLoading]); // Add isSessionLoading to dependencies

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats,
  };
};