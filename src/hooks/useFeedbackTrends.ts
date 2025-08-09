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
    const startDate = subDays(new Date(), timeframeInDays);

    const { data, error } = await supabase
      .from('feedback')
      .select('created_at, rating')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error("Error fetching feedback trends:", error);
      showError("Failed to load feedback trends.");
      setLoading(false);
      return;
    }

    const groupedByDate = data.reduce((acc, entry) => {
      const date = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { ratings: [] };
      }
      acc[date].ratings.push(entry.rating);
      return acc;
    }, {} as Record<string, { ratings: number[] }>);

    const processedData: FeedbackTrendPoint[] = [];
    for (let i = 0; i < timeframeInDays; i++) {
      const date = startOfDay(subDays(new Date(), i));
      const dateString = format(date, 'yyyy-MM-dd');
      
      const dayData = groupedByDate[dateString];
      if (dayData) {
        const submission_count = dayData.ratings.length;
        const totalRating = dayData.ratings.reduce((sum, r) => sum + r, 0);
        const average_rating = submission_count > 0 ? parseFloat((totalRating / submission_count).toFixed(2)) : null;
        processedData.push({ date: dateString, submission_count, average_rating });
      } else {
        processedData.push({ date: dateString, submission_count: 0, average_rating: null });
      }
    }

    setTrendData(processedData.reverse());
    setLoading(false);
  }, [timeframeInDays]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { trendData, loading, fetchTrends };
};