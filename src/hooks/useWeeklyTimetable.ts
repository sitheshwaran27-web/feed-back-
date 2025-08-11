"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { TimetableEntry } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider'; // Import useSession
import { useProfile } from './useProfile'; // Import useProfile

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export const useWeeklyTimetable = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile(); // Get student's profile
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    const userId = session?.user.id;
    const studentBatchId = profile?.batch_id;
    const studentSemesterNumber = profile?.semester_number;

    if (!userId || !studentBatchId || !studentSemesterNumber) { // Ensure batch/semester are available
      setLoading(false);
      setTimetableEntries([]);
      return;
    }

    const { data, error } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        subject_id, {/* Renamed from class_id */}
        batch_id, {/* New field */}
        semester_number, {/* New field */}
        start_time,
        end_time,
        subjects (id, name, period) {/* Renamed from classes, added period */}
      `)
      .eq('batch_id', studentBatchId) // Filter by student's batch
      .eq('semester_number', studentSemesterNumber) // Filter by student's semester
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching timetable:", error);
      showError("Failed to load weekly timetable.");
    } else {
      // Explicitly filter out entries where 'subjects' is null
      setTimetableEntries((data || []).filter(entry => entry.subjects !== null)); // Renamed from classes
    }
    setLoading(false);
  }, [session?.user.id, profile?.batch_id, profile?.semester_number]); // Added profile dependencies

  useEffect(() => {
    if (!isSessionLoading && !profileLoading && session) { // Wait for profile to load
      fetchTimetable();
    } else if (!isSessionLoading && !session) {
      setLoading(false);
    }
  }, [session, isSessionLoading, profileLoading, fetchTimetable]); // Added profileLoading dependency

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = []));
    timetableEntries.forEach(entry => {
      if (entry.subjects && groups[entry.day_of_week]) { // Renamed from classes
        groups[entry.day_of_week].push(entry);
      }
    });
    // Sort classes within each day by start time
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [timetableEntries]);

  return {
    groupedTimetable,
    loading,
    daysOfWeek,
  };
};