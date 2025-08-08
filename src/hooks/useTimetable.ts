"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  class_id: string;
  classes: Class; // Joined class data
}

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
      .order('period_number', { ascending: true });

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
        classes (id, name, period_number, start_time, end_time)
      `)
      .order('day_of_week', { ascending: true })
      .order('classes.period_number', { ascending: true });

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

  const addTimetableEntry = async (values: { day_of_week: number; class_id: string }) => {
    setIsSubmitting(true);

    // Check for existing entry
    const { data: existingEntry, error: checkError } = await supabase
      .from('timetables')
      .select('id')
      .eq('day_of_week', values.day_of_week)
      .eq('class_id', values.class_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error checking for existing timetable entry:", checkError);
      showError("Failed to check for existing timetable entry.");
      setIsSubmitting(false);
      return null;
    }

    if (existingEntry) {
      showError("This class is already scheduled for this day.");
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
        classes (id, name, period_number, start_time, end_time)
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
    deleteTimetableEntry,
    fetchData, // Expose for manual refresh if needed
  };
};