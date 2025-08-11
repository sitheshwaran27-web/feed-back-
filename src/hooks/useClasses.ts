"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Class } from '@/types/supabase'; // Import Class

export const useClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching classes:", error);
      showError("Failed to load classes.");
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const addClass = async (values: Omit<Class, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('classes')
      .insert(values)
      .select()
      .single();

    if (error) {
      console.error("Error adding class:", error);
      showError("Failed to add class.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Class added successfully!");
      setClasses(prevClasses => [...prevClasses, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setIsSubmitting(false);
      return data;
    }
  };

  const updateClass = async (id: string, values: Omit<Class, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('classes')
      .update(values)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating class:", error);
      showError("Failed to update class.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Class updated successfully!");
      setClasses(prevClasses => prevClasses.map(cls => cls.id === data.id ? data : cls).sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteClass = async (id: string) => {
    const { error } = await supabase
      .rpc('delete_class_and_dependents', {
        class_id_to_delete: id
      });

    if (error) {
      console.error("Error deleting class:", error);
      showError(`Failed to delete class: ${error.message}`);
      return false;
    } else {
      showSuccess("Class deleted successfully!");
      setClasses(prevClasses => prevClasses.filter(cls => cls.id !== id));
      return true;
    }
  };

  return {
    classes,
    loading,
    isSubmitting,
    addClass,
    updateClass,
    deleteClass,
    fetchClasses // Expose for manual refresh if needed
  };
};