"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Batch } from '@/types/supabase';

export const useBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching batches:", (error as any)?.message || error);
      showError("Failed to load batches.");
    } else {
      setBatches(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const addBatch = async (values: Omit<Batch, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('batches')
      .insert(values)
      .select()
      .single();

    if (error) {
      console.error("Error adding batch:", error);
      showError(`Failed to add batch: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Batch added successfully!");
      setBatches(prevBatches => [...prevBatches, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return data;
    }
  };

  const updateBatch = async (id: string, values: Omit<Batch, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('batches')
      .update(values)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating batch:", error);
      showError(`Failed to update batch: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Batch updated successfully!");
      setBatches(prevBatches => prevBatches.map(batch => batch.id === data.id ? data : batch).sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteBatch = async (id: string) => {
    // Note: Deleting a batch will cascade delete subjects, timetables, and set profiles to NULL.
    // Consider if you need a more complex deletion logic (e.g., reassigning subjects/timetables).
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting batch:", error);
      showError(`Failed to delete batch: ${error.message}`);
      return false;
    } else {
      showSuccess("Batch deleted successfully!");
      setBatches(prevBatches => prevBatches.filter(batch => batch.id !== id));
      return true;
    }
  };

  return {
    batches,
    loading,
    isSubmitting,
    addBatch,
    updateBatch,
    deleteBatch,
    fetchBatches
  };
};
