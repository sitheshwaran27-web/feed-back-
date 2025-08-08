"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import StudentFeedbackHistory from '@/components/StudentFeedbackHistory';
import { CheckCircle } from 'lucide-react'; // Import CheckCircle icon

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  hasSubmittedFeedback?: boolean; // Added for feedback status
}

const StudentDashboard = () => {
  const { session, isLoading, isAdmin } = useSession();
  const navigate = useNavigate();
  const [dailyClasses, setDailyClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [activeFeedbackClass, setActiveFeedbackClass] = useState<Class | null>(null);
  const [hasSubmittedFeedbackForActiveClass, setHasSubmittedFeedbackForActiveClass] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const checkFeedbackWindow = useCallback((classItem: Class) => {
    const now = new Date();
    const [startHour, startMinute] = classItem.start_time.split(':').map(Number);
    const [endHour, endMinute] = classItem.end_time.split(':').map(Number);

    const classStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    const classEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);

    const fiveMinutesBeforeEnd = new Date(classEndTime.getTime() - 5 * 60 * 1000);

    return now >= fiveMinutesBeforeEnd && now <= classEndTime;
  }, []);

  const fetchDailyClasses = useCallback(async () => {
    setClassesLoading(true);
    const userId = session?.user.id;
    if (!userId) {
      setClassesLoading(false);
      return;
    }

    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('period_number', { ascending: true })
      .order('start_time', { ascending: true });

    if (classesError) {
      console.error("Error fetching daily classes:", classesError);
      showError("Failed to load daily timetable.");
      setClassesLoading(false);
      return;
    }

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('class_id')
      .eq('student_id', userId);

    if (feedbackError) {
      console.error("Error fetching student feedback:", feedbackError);
      showError("Failed to load feedback status.");
      // Continue with classes even if feedback fails
    }

    const submittedClassIds = new Set(feedbackData?.map(f => f.class_id));

    const classesWithFeedbackStatus = (classesData || []).map(cls => ({
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

    setClassesLoading(false);
  }, [checkFeedbackWindow, session?.user.id]);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      navigate("/login");
      return;
    }

    if (isAdmin) {
      navigate("/admin/dashboard");
      return;
    }

    fetchDailyClasses();
    const interval = setInterval(() => {
      fetchDailyClasses(); // Re-fetch classes and check feedback window/submission status
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [session, isLoading, isAdmin, navigate, fetchDailyClasses]);

  const handleFeedbackSubmit = async (values: { rating: number; comment?: string }) => {
    if (!session?.user.id || !activeFeedbackClass?.id) {
      showError("Cannot submit feedback: User or class information missing.");
      return;
    }

    setIsSubmittingFeedback(true);
    const { error } = await supabase.from('feedback').insert({
      student_id: session.user.id,
      class_id: activeFeedbackClass.id,
      rating: values.rating,
      comment: values.comment,
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      showError("Failed to submit feedback. You might have already submitted feedback for this class.");
    } else {
      showSuccess("Feedback submitted successfully!");
      // Update the specific class in dailyClasses state
      setDailyClasses(prevClasses =>
        prevClasses.map(cls =>
          cls.id === activeFeedbackClass.id ? { ...cls, hasSubmittedFeedback: true } : cls
        )
      );
      setHasSubmittedFeedbackForActiveClass(true); // Mark as submitted for the active class
    }
    setIsSubmittingFeedback(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  if (!session || isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Student Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, {session.user.email}!
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Your Daily Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <p className="text-center">Loading timetable...</p>
          ) : dailyClasses.length === 0 ? (
            <p className="text-center">No classes scheduled for today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Feedback Status</TableHead> {/* New column header */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.period_number}</TableCell>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.start_time} - {cls.end_time}</TableCell>
                    <TableCell>
                      {cls.hasSubmittedFeedback ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> Submitted
                        </span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {activeFeedbackClass && (
        <Card className="w-full max-w-md mx-auto mb-8">
          <CardHeader>
            <CardTitle>Feedback for {activeFeedbackClass.name} (Period {activeFeedbackClass.period_number})</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSubmittedFeedbackForActiveClass ? (
              <p className="text-center text-green-600 dark:text-green-400">
                You have already submitted feedback for this class. Thank you!
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide your feedback for this class.
                </p>
                <FeedbackForm onSubmit={handleFeedbackSubmit} isSubmitting={isSubmittingFeedback} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <StudentFeedbackHistory />
    </div>
  );
};

export default StudentDashboard;