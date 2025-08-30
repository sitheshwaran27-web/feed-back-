"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Subject, TimetableEntry } from '@/types/supabase'; // Renamed import

export const useTimetable = () => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]); // Renamed from availableClasses
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: subjectsData, error: subjectsError } = await supabase // Renamed variable
      .from('subjects') // Renamed from classes
      .select('*')
      .order('name', { ascending: true });

    if (subjectsError) { // Renamed variable
      console.error("Error fetching subjects:", subjectsError); // Renamed variable
      showError("Failed to load subjects for timetable."); // Renamed message
    } else {
      setAvailableSubjects(subjectsData || []); // Renamed variable
    }

    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        subject_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects (id, name, period),
        batches (name)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching timetable entries:", timetableError?.message || timetableError);
      showError("Failed to load timetable entries.");
    } else {
      // Explicitly filter out entries where 'subjects' is null
      setTimetableEntries((timetableData || []).filter(entry => entry.subjects !== null)); // Renamed from classes
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTimetableEntry = async (values: { day_of_week: number; subject_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => { // Renamed subject_id, added batch_id, semester_number
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week)
      .eq('batch_id', values.batch_id) // Filter by batch
      .eq('semester_number', values.semester_number); // Filter by semester

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
      showError(`Time conflict detected. A subject is already scheduled during this time for this batch and semester.`); // Updated message
      setIsSubmitting(false);
      return null;
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert(values)
      .select(`
        id,
        day_of_week,
        subject_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects (id, name, period),
        batches (name)
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

  const updateTimetableEntry = async (id: string, values: { day_of_week: number; subject_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => { // Renamed subject_id, added batch_id, semester_number
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week)
      .eq('batch_id', values.batch_id) // Filter by batch
      .eq('semester_number', values.semester_number) // Filter by semester
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
      showError(`Time conflict detected. A subject is already scheduled during this time for this batch and semester.`); // Updated message
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
        subject_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects (id, name, period),
        batches (name)
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
    availableSubjects, // Renamed return value
    loading,
    isSubmitting,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    fetchData,
  };
};
