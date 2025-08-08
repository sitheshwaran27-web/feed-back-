"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import StudentFeedbackHistory from '@/components/StudentFeedbackHistory'; // Import the new component

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

const StudentDashboard = () => {
  const { session, isLoading, isAdmin } = useSession(); // Use isAdmin from context
  const navigate = useNavigate();
  const [dailyClasses, setDailyClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [activeFeedbackClass, setActiveFeedbackClass] = useState<Class | null>(null);
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
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('period_number', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching daily classes:", error);
      showError("Failed to load daily timetable.");
    } else {
      setDailyClasses(data || []);
      // Check for active feedback window immediately after fetching classes
      const currentActive = data.find(checkFeedbackWindow);
      setActiveFeedbackClass(currentActive || null);
    }
    setClassesLoading(false);
  }, [checkFeedbackWindow]);

  useEffect(() => {
    // If session is loading, do nothing yet
    if (isLoading) return;

    // If no session, redirect to login
    if (!session) {
      navigate("/login");
      return;
    }

    // If session exists and user is an admin, redirect to admin dashboard
    if (isAdmin) {
      navigate("/admin/dashboard");
      return;
    }

    // For students, fetch classes and set up interval
    fetchDailyClasses();
    const interval = setInterval(() => {
      const currentActive = dailyClasses.find(checkFeedbackWindow);
      setActiveFeedbackClass(currentActive || null);
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [session, isLoading, isAdmin, navigate, fetchDailyClasses, dailyClasses, checkFeedbackWindow]);

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
      setActiveFeedbackClass(null); // Hide the form after submission
      fetchDailyClasses(); // Re-fetch to update any state if needed
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

  // If not session or is admin, the useEffect will navigate, so render nothing here
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.period_number}</TableCell>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.start_time} - {cls.end_time}</TableCell>
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide your feedback for this class.
            </p>
            <FeedbackForm onSubmit={handleFeedbackSubmit} isSubmitting={isSubmittingFeedback} />
          </CardContent>
        </Card>
      )}

      <StudentFeedbackHistory /> {/* Add the new component here */}
    </div>
  );
};

export default StudentDashboard;