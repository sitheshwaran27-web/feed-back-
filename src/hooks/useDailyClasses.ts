"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { DailyClass } from '@/types/supabase'; // Import DailyClass

const FEEDBACK_GRACE_PERIOD_MINUTES = 15;

export const useDailyClasses = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [dailyClasses, setDailyClasses] = useState<DailyClass[]>([]);
  const [activeFeedbackClass, setActiveFeedbackClass] = useState<DailyClass | null>(null);
  const [hasSubmittedFeedbackForActiveClass, setHasSubmittedFeedbackForActiveClass] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFeedbackWindow = useCallback((classItem: DailyClass) => {
    const now = new Date();
    const [startHour, startMinute] = classItem.start_time.split(':').map(Number);
    const [endHour, endMinute] = classItem.end_time.split(':').map(Number);

    const classStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    const classEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);

    const feedbackWindowEndTime = new Date(classEndTime.getTime() + FEEDBACK_GRACE_PERIOD_MINUTES * 60 * 1000);

    return now >= classStartTime && now <= feedbackWindowEndTime;
  }, []);

  const fetchDailyClasses = useCallback(async () => {
    setLoading(true);
    const userId = session?.user.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const currentDayOfWeek = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const supabaseDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // Supabase uses 1 for Monday, 7 for Sunday

    const { data: timetableEntries, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        class_id,
        start_time,
        end_time,
        classes (id, name)
      `)
      .eq('day_of_week', supabaseDayOfWeek)
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching daily timetable entries:", timetableError);
      showError("Failed to load daily timetable.");
      setLoading(false);
      return;
    }

    const dailyScheduledClasses: DailyClass[] = (timetableEntries || [])
      .filter(entry => entry.classes)
      .map(entry => ({
        id: entry.classes!.id,
        name: entry.classes!.name,
        start_time: entry.start_time,
        end_time: entry.end_time,
      }));

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('class_id')
      .eq('student_id', userId);

    if (feedbackError) {
      console.error("Error fetching student feedback:", feedbackError);
      showError("Failed to load feedback status.");
    }

    const submittedClassIds = new Set(feedbackData?.map(f => f.class_id));

    const classesWithFeedbackStatus = dailyScheduledClasses.map(cls => ({
      ...cls,
      hasSubmittedFeedback: submittedClassIds.has(cls.id),
    }));

    setDailyClasses(classesWithFeedbackStatus);

    const currentActive = classesWithFeedbackStatus.find(checkFeedbackWindow);
    setActiveFeedbackClass(currentActive || null);

    if (currentActive) {
      setHasSubmittedFeedbackForActiveClass(currentActive.hasSubmittedFeedback || false);
    } else {
      setHasSubmittedFeedbackForActiveClass(false);
    }

    setLoading(false);
  }, [session?.user.id, checkFeedbackWindow]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      fetchDailyClasses();
      const interval = setInterval(fetchDailyClasses, 60 * 1000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [session, isSessionLoading, fetchDailyClasses]);

  return {
    dailyClasses,
    activeFeedbackClass,
    hasSubmittedFeedbackForActiveClass,
    loading,
    fetchDailyClasses // Expose for manual refresh if needed
  };
};