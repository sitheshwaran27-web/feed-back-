"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { FeedbackHistoryEntry } from '@/types/supabase'; // Import FeedbackHistoryEntry

export const useStudentFeedbackHistory = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbackHistory = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        classes (name, period_number)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching student feedback history:", error);
      showError("Failed to load your feedback history.");
    } else {
      setFeedbackHistory(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchFeedbackHistory(session.user.id);
    }
  }, [session, isSessionLoading]);

  return {
    feedbackHistory,
    loading,
    fetchFeedbackHistory // Expose for manual refresh if needed
  };
};