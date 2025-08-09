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
      .order('period', { ascending: true })
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
      setClasses(prevClasses => [...prevClasses, data].sort((a, b) => a.period - b.period || a.start_time.localeCompare(b.start_time)));
      setIsSubmitting(false);
      return data;
    }
  };

  const updateClass = async (id: string, values: Omit<Class, 'id' | 'created_at'>) => {
    setIsSubmitting(true);

    const oldClass = classes.find(c => c.id === id);
    if (!oldClass) {
      showError("Original class not found. Cannot perform update.");
      setIsSubmitting(false);
      return null;
    }

    // Check for timetable conflicts if the period is being changed
    if (values.period && values.period !== oldClass.period) {
      try {
        // 1. Find all days this class is scheduled on.
        const { data: scheduledDays, error: scheduleError } = await supabase
          .from('timetables')
          .select('day_of_week')
          .eq('class_id', id);

        if (scheduleError) throw scheduleError;

        if (scheduledDays && scheduledDays.length > 0) {
          // 2. For each scheduled day, check if the new period is free.
          const days = scheduledDays.map(d => d.day_of_week);
          const { data: conflictingEntries, error: conflictError } = await supabase
            .from('timetables')
            .select('id, classes!inner(period)')
            .in('day_of_week', days)
            .eq('classes.period', values.period);

          if (conflictError) throw conflictError;

          if (conflictingEntries && conflictingEntries.length > 0) {
            showError(`Cannot change period. A class is already scheduled for period ${values.period} on one or more days this class is timetabled.`);
            setIsSubmitting(false);
            return null;
          }
        }
      } catch (error: any) {
        console.error("Error checking for timetable conflicts:", error);
        showError("Failed to check for timetable conflicts. Please try again.");
        setIsSubmitting(false);
        return null;
      }
    }

    // Proceed with the update if no conflicts are found
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
      setClasses(prevClasses => prevClasses.map(cls => cls.id === data.id ? data : cls).sort((a, b) => a.period - b.period || a.start_time.localeCompare(b.start_time)));
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