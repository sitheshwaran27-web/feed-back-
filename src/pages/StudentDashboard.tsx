"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, CalendarDays, Clock } from 'lucide-react';
import { useDailyClasses } from '@/hooks/useDailyClasses';
import { showError, showSuccess } from '@/utils/toast';
import { DailyClass } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RecentStudentFeedback from '@/components/RecentStudentFeedback';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

const StudentDashboard = () => {
  const { session, isLoading: isSessionLoading, isAdmin } = useSession();
  const { profile, loading: profileLoading } = useProfile();

  const {
    dailyClasses,
    activeFeedbackClass,
    hasSubmittedFeedbackForActiveClass,
    loading: classesLoading,
    fetchDailyClasses
  } = useDailyClasses();

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  if (isSessionLoading || classesLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center p-4 h-full">
        <div className="w-full max-w-6xl mb-8">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-7 w-1/2 mb-6" />
        </div>
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
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
    }
    setIsSubmittingFeedback(false);
  };

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-6xl mb-8">
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
          Welcome, {profile?.first_name || session.user.email}!
        </p>
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyClasses.length === 0 ? (
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
          <RecentStudentFeedback />
        </div>

        <div className="lg:col-span-1">
          {activeFeedbackClass ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback for {activeFeedbackClass.name} (P{activeFeedbackClass.period})</CardTitle>
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
          ) : (
            <Card className="h-full flex flex-col items-center justify-center">
              <CardHeader className="text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle>No Active Class</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  There is no class currently active for feedback submission.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;