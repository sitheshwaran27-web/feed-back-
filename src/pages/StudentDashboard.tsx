"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, Star } from 'lucide-react';
import { useDailyClasses } from '@/hooks/useDailyClasses'; // Import the new hook
import { useStudentFeedbackHistory } from '@/hooks/useStudentFeedbackHistory'; // Import the new hook
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for table loading
import { showError, showSuccess } from '@/utils/toast';

interface Class {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  hasSubmittedFeedback?: boolean;
}

const StudentDashboard = () => {
  const { session, isLoading, isAdmin } = useSession();

  const {
    dailyClasses,
    activeFeedbackClass,
    hasSubmittedFeedbackForActiveClass,
    loading: classesLoading,
    fetchDailyClasses
  } = useDailyClasses();

  const {
    feedbackHistory,
    loading: feedbackHistoryLoading,
    fetchFeedbackHistory
  } = useStudentFeedbackHistory();

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // SessionContextProvider handles redirection if not authenticated or if admin
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  if (!session || isAdmin) {
    return null; // SessionContextProvider handles redirect
  }

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
      // Manually trigger re-fetch for both daily classes and history to update UI
      fetchDailyClasses();
      fetchFeedbackHistory(session.user.id);
    }
    setIsSubmittingFeedback(false);
  };

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Feedback Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : dailyClasses.length === 0 ? (
            <p className="text-center">No classes scheduled for today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Feedback Status</TableHead>
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

      {/* Student Feedback History Section */}
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackHistoryLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Your Comment</TableHead>
                  <TableHead>Admin Response</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : feedbackHistory.length === 0 ? (
            <p className="text-center">You haven't submitted any feedback yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Your Comment</TableHead>
                  <TableHead>Admin Response</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackHistory.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.classes?.name} (P{feedback.classes?.period_number})</TableCell>
                    <TableCell className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < feedback.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{feedback.comment || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{feedback.admin_response || 'No response yet'}</TableCell>
                    <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;