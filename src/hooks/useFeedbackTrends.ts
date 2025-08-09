"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { format, subDays, startOfDay } from 'date-fns';
import { FeedbackTrendPoint } from '@/types/supabase';

export const useFeedbackTrends = (timeframeInDays: number = 30) => {
  const [trendData, setTrendData] = useState<FeedbackTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_feedback_trends', {
      timeframe_days: timeframeInDays
    });

    if (error) {
      console.error("Error fetching feedback trends:", error);
      showError("Failed to load feedback trends.");
      setLoading(false);
      return;
    }

    // The data is already aggregated by the database function.
    // We just need to ensure the date is in the right string format if needed, though the chart component can handle Date objects.
    setTrendData(data.map(d => ({...d, date: d.date.split('T')[0]})) || []);
    setLoading(false);
  }, [timeframeInDays]);

  useEffect(() => {
    fetchTrends();

    const channel = supabase
      .channel(`feedback-trends-changes-${timeframeInDays}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => fetchTrends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrends, timeframeInDays]);

  return { trendData, loading, fetchTrends };
};