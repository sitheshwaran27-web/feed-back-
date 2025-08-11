"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { format, subDays, startOfDay } from 'date-fns';
import { FeedbackTrendPoint } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession

export const useFeedbackTrends = (timeframeInDays: number = 30) => {
  const { isAdmin, isLoading: isSessionLoading } = useSession(); // Get isAdmin and session loading state
  const [trendData, setTrendData] = useState<FeedbackTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    if (!isAdmin) { // Only fetch if user is admin
      setTrendData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_feedback_trends', {
      timeframe_days: timeframeInDays
    });

    if (error) {
      console.error("Error fetching feedback trends:", error);
      if (error?.code !== '42501') { // 42501 is permission denied
        showError("Failed to load feedback trends.");
      }
      setTrendData([]);
    } else {
      setTrendData(data.map(d => ({...d, date: d.date.split('T')[0]})) || []);
    }
    setLoading(false);
  }, [timeframeInDays, isAdmin]); // Add isAdmin to dependencies

  useEffect(() => {
    if (!isSessionLoading) { // Only fetch once session loading is complete
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
    }
  }, [fetchTrends, timeframeInDays, isSessionLoading]); // Add isSessionLoading to dependencies

  return { trendData, loading, fetchTrends };
};