"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, Star, CalendarDays } from 'lucide-react';
import { useDailyClasses } from '@/hooks/useDailyClasses';
import { useStudentFeedbackHistory } from '@/hooks/useStudentFeedbackHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { DailyClass, FeedbackHistoryEntry } from '@/types/supabase';
import RatingStars from '@/components/RatingStars';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
      fetchDailyClasses();
      fetchFeedbackHistory(session.user.id);
    }
    setIsSubmittingFeedback(false);
  };

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-4xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Student Dashboard</h1>
          <Button asChild variant="outline">
            <Link to="/student/timetable">
              <CalendarDays className="mr-2 h-4 w-4" />
              View Full Timetable
            </Link>
          </Button>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, {session.user.email}!
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>Today's Timetable</CardTitle>
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
                {dailyClasses.map((cls: DailyClass) => (
                  <TableRow key={cls.id}>
                    <TableCell>{cls.period}</TableCell>
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
            <CardTitle>Feedback for {activeFeedbackClass.name} (Period {activeFeedbackClass.period})</CardTitle>
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
                {feedbackHistory.map((feedback: FeedbackHistoryEntry) => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.classes?.name} (P{feedback.classes?.period})</TableCell>
                    <TableCell>
                      <RatingStars rating={feedback.rating} />
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