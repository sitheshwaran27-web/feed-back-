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
      .order('period', { ascending: true });

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
        classes (id, name, period, start_time, end_time)
      `)
      .order('day_of_week', { ascending: true })
      .order('classes.period', { ascending: true });

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

    const classToAdd = availableClasses.find(c => c.id === values.class_id);
    if (!classToAdd) {
      showError("Selected class could not be found.");
      setIsSubmitting(false);
      return null;
    }

    const existingEntryForPeriod = timetableEntries.find(entry =>
      entry.day_of_week === values.day_of_week && entry.classes.period === classToAdd.period
    );

    if (existingEntryForPeriod) {
      showError(`A class is already scheduled for Period ${classToAdd.period} on this day.`);
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
        classes (id, name, period, start_time, end_time)
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

  const updateTimetableEntry = async (id: string, values: { day_of_week?: number; class_id?: string }) => {
    setIsSubmitting(true);

    const classToUpdate = availableClasses.find(c => c.id === values.class_id);
    if (!classToUpdate) {
      showError("Selected class could not be found.");
      setIsSubmitting(false);
      return null;
    }

    const existingEntryForPeriod = timetableEntries.find(entry =>
      entry.id !== id &&
      entry.day_of_week === values.day_of_week &&
      entry.classes.period === classToUpdate.period
    );

    if (existingEntryForPeriod) {
      showError(`Another class is already scheduled for Period ${classToUpdate.period} on this day.`);
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
        classes (id, name, period, start_time, end_time)
      `)
      .single();

    if (error) {
      console.error("Error updating timetable entry:", error);
      showError("Failed to update timetable entry.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry updated successfully!");
      setTimetableEntries(prevEntries => prevEntries.map(entry => entry.id === data.id ? data : entry));
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