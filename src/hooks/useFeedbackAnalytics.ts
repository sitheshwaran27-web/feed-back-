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
    const { data, error } = await supabase.rpc('get_class_feedback_stats');

    if (error) {
      console.error("Error fetching feedback for analytics:", error);
      showError("Failed to load feedback analytics.");
      setLoading(false);
      return;
    }

    setFeedbackStats(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
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
  }, [fetchFeedbackStats]);

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats,
  };
};