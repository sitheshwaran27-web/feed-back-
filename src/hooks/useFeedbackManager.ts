"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useFeedbackManager = () => {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [classIdFilter, setClassIdFilter] = useState<string>('all'); // Filter state

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        classes (name, period),
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (classIdFilter !== 'all') {
      query = query.eq('class_id', classIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching feedback:", error);
      showError("Failed to load feedback entries.");
    } else {
      setFeedbackEntries(data || []);
    }
    setLoading(false);
  }, [classIdFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateAdminResponse = async (feedbackId: string, response: string | null) => {
    setIsSubmittingResponse(true);
    const { data, error } = await supabase
      .from('feedback')
      .update({ admin_response: response })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      console.error("Error updating feedback response:", error);
      showError("Failed to update feedback response.");
      setIsSubmittingResponse(false);
      return null;
    } else {
      showSuccess("Feedback response updated successfully!");
      setFeedbackEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === data.id ? { ...entry, admin_response: data.admin_response } : entry
        )
      );
      setIsSubmittingResponse(false);
      return data;
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      console.error("Error deleting feedback:", error);
      showError("Failed to delete feedback entry.");
      return false;
    } else {
      showSuccess("Feedback entry deleted successfully!");
      setFeedbackEntries(prevEntries => prevEntries.filter(entry => entry.id !== feedbackId));
      return true;
    }
  };

  return {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    fetchFeedback,
    updateAdminResponse,
    deleteFeedback,
    classIdFilter,
    setClassIdFilter,
  };
};