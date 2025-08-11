"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { TimetableEntry } from '@/types/supabase';

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
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        class_id,
        classes (id, name, period, start_time, end_time)
      `)
      .order('day_of_week', { ascending: true })
      .order('period', { foreignTable: 'classes', ascending: true });

    if (error) {
      console.error("Error fetching timetable:", error);
      showError("Failed to load weekly timetable.");
    } else {
      setTimetableEntries(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = []));
    timetableEntries.forEach(entry => {
      if (entry.classes && groups[entry.day_of_week]) {
        groups[entry.day_of_week].push(entry);
      }
    });
    // Sort classes within each day
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => {
        if (a.classes.period !== b.classes.period) {
          return a.classes.period - b.classes.period;
        }
        return a.classes.start_time.localeCompare(b.classes.start_time);
      });
    });
    return groups;
  }, [timetableEntries]);

  return {
    groupedTimetable,
    loading,
    daysOfWeek,
  };
};