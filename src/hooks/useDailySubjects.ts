"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { DailySubject } from '@/types/supabase'; // Renamed import
import { useProfile } from './useProfile'; // Import useProfile to get student's batch/semester

const FEEDBACK_GRACE_PERIOD_MINUTES = 15;

export const useDailySubjects = () => { // Renamed hook
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile(); // Get student's profile
  const [dailySubjects, setDailySubjects] = useState<DailySubject[]>([]); // Renamed state variable
  const [activeFeedbackSubject, setActiveFeedbackSubject] = useState<DailySubject | null>(null); // Renamed state variable
  const [hasSubmittedFeedbackForActiveSubject, setHasSubmittedFeedbackForActiveSubject] = useState(false); // Renamed state variable
  const [loading, setLoading] = useState(true);

  const checkFeedbackWindow = useCallback((subjectItem: DailySubject) => { // Renamed parameter
    const now = new Date();
    const [startHour, startMinute] = subjectItem.start_time.split(':').map(Number);
    const [endHour, endMinute] = subjectItem.end_time.split(':').map(Number);

    const subjectStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute); // Renamed variable
    const subjectEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute); // Renamed variable

    const feedbackWindowEndTime = new Date(subjectEndTime.getTime() + FEEDBACK_GRACE_PERIOD_MINUTES * 60 * 1000);

    return now >= subjectStartTime && now <= feedbackWindowEndTime; // Renamed variable
  }, []);

  const fetchDailySubjects = useCallback(async () => { // Renamed function
    setLoading(true);
    const userId = session?.user.id;
    const studentBatchId = profile?.batch_id;
    const studentSemesterNumber = profile?.semester_number;

    if (!userId || !studentBatchId || !studentSemesterNumber) { // Ensure batch/semester are available
      setLoading(false);
      setActiveFeedbackSubject(null);
      setHasSubmittedFeedbackForActiveSubject(false);
      setDailySubjects([]);
      return;
    }

    const currentDayOfWeek = new Date().getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const supabaseDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // Supabase uses 1 for Monday, 7 for Sunday

    const { data: timetableEntries, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        subject_id, {/* Renamed from class_id */}
        start_time,
        end_time,
        subjects (id, name, period) {/* Renamed from classes, added period */}
      `)
      .eq('day_of_week', supabaseDayOfWeek)
      .eq('batch_id', studentBatchId) // Filter by student's batch
      .eq('semester_number', studentSemesterNumber) // Filter by student's semester
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching daily timetable entries:", timetableError);
      showError("Failed to load daily timetable.");
      setLoading(false);
      return;
    }

    const dailyScheduledSubjects: DailySubject[] = (timetableEntries || []) // Renamed variable
      .filter(entry => entry.subjects)
      .map(entry => ({
        id: entry.subjects!.id,
        name: entry.subjects!.name,
        start_time: entry.start_time,
        end_time: entry.end_time,
        batch_id: studentBatchId, // Add batch_id
        semester_number: studentSemesterNumber, // Add semester_number
      }));

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('subject_id') // Renamed from class_id
      .eq('student_id', userId)
      .eq('batch_id', studentBatchId) // Filter by student's batch
      .eq('semester_number', studentSemesterNumber); // Filter by student's semester

    if (feedbackError) {
      console.error("Error fetching student feedback:", feedbackError);
      showError("Failed to load feedback status.");
    }

    const submittedSubjectIds = new Set(feedbackData?.map(f => f.subject_id)); // Renamed variable

    const subjectsWithFeedbackStatus = dailyScheduledSubjects.map(sub => ({ // Renamed variable
      ...sub,
      hasSubmittedFeedback: submittedSubjectIds.has(sub.id),
    }));

    setDailySubjects(subjectsWithFeedbackStatus); // Renamed state variable

    const currentActive = subjectsWithFeedbackStatus.find(checkFeedbackWindow); // Renamed variable
    setActiveFeedbackSubject(currentActive || null); // Renamed state variable

    if (currentActive) {
      setHasSubmittedFeedbackForActiveSubject(currentActive.hasSubmittedFeedback || false); // Renamed state variable
    } else {
      setHasSubmittedFeedbackForActiveSubject(false); // Renamed state variable
    }

    setLoading(false);
  }, [session?.user.id, profile?.batch_id, profile?.semester_number, checkFeedbackWindow]); // Added profile dependencies

  useEffect(() => {
    if (!isSessionLoading && !profileLoading && session) { // Wait for profile to load
      fetchDailySubjects();
      const interval = setInterval(fetchDailySubjects, 60 * 1000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [session, isSessionLoading, profileLoading, fetchDailySubjects]); // Added profileLoading dependency

  return {
    dailySubjects, // Renamed return value
    activeFeedbackSubject, // Renamed return value
    hasSubmittedFeedbackForActiveSubject, // Renamed return value
    loading,
    fetchDailySubjects // Renamed return value
  };
};