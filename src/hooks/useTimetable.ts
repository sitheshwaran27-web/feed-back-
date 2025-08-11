"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Class, TimetableEntry } from '@/types/supabase'; // Import Class and TimetableEntry

export const useTimetable = () => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true });

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      showError("Failed to load classes for timetable.");
    } else {
      setAvailableClasses(classesData || []);
    }

    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        class_id,
        start_time,
        end_time,
        classes (id, name)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching timetable entries:", timetableError);
      showError("Failed to load timetable entries.");
    } else {
      setTimetableEntries(timetableData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTimetableEntry = async (values: { day_of_week: number; class_id: string; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week);

    if (dayEntriesError) {
      console.error("Error fetching day's schedule for conflict check:", dayEntriesError);
      showError("Could not verify timetable for conflicts.");
      setIsSubmitting(false);
      return null;
    }

    const hasConflict = dayEntries.some(existingEntry => {
      return values.start_time < existingEntry.end_time && values.end_time > existingEntry.start_time;
    });

    if (hasConflict) {
      showError(`Time conflict detected. A class is already scheduled during this time.`);
      setIsSubmitting(false);
      return null;
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert(values)
      .select(`
        id,
        day_of_week,
        class_id,
        start_time,
        end_time,
        classes (id, name)
      `)
      .single();

    if (error) {
      console.error("Error adding timetable entry:", error);
      showError("Failed to add timetable entry.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry added successfully!");
      setTimetableEntries(prevEntries => [...prevEntries, data]);
      fetchData(); // Refetch to ensure sorted order
      setIsSubmitting(false);
      return data;
    }
  };

  const updateTimetableEntry = async (id: string, values: { day_of_week: number; class_id: string; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week)
      .not('id', 'eq', id);

    if (dayEntriesError) {
      console.error("Error fetching day's schedule for conflict check:", dayEntriesError);
      showError("Could not verify timetable for conflicts.");
      setIsSubmitting(false);
      return null;
    }

    const hasConflict = dayEntries.some(existingEntry => {
      return values.start_time < existingEntry.end_time && values.end_time > existingEntry.start_time;
    });

    if (hasConflict) {
      showError(`Time conflict detected. A class is already scheduled during this time.`);
      setIsSubmitting(false);
      return null;
    }

    const { data, error } = await supabase
      .from('timetables')
      .update(values)
      .eq('id', id)
      .select(`
        id,
        day_of_week,
        class_id,
        start_time,
        end_time,
        classes (id, name)
      `)
      .single();

    if (error) {
      console.error("Error updating timetable entry:", error);
      showError("Failed to update timetable entry.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry updated successfully!");
      fetchData(); // Refetch to ensure sorted order
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting timetable entry:", error);
      showError("Failed to delete timetable entry.");
      return false;
    } else {
      showSuccess("Timetable entry deleted successfully!");
      setTimetableEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      return true;
    }
  };

  return {
    timetableEntries,
    availableClasses,
    loading,
    isSubmitting,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    fetchData,
  };
};