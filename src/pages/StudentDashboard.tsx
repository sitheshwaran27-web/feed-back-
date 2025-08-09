"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, CalendarDays } from 'lucide-react';
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
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">Student Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {profile?.first_name || session.user.email}!
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/student/timetable">
            <CalendarDays className="mr-2 h-4 w-4" />
            View Full Timetable
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Today's Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyClasses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No classes scheduled for today.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
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
                            <span className="text-green-600 flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" /> Submitted
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Pending</span>
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
                  <div className="text-center text-green-600 dark:text-green-400 p-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>You have already submitted feedback for this class. Thank you!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please provide your feedback for the current class.
                    </p>
                    <FeedbackForm onSubmit={handleFeedbackSubmit} isSubmitting={isSubmittingFeedback} />
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center h-full text-center p-6 bg-muted/50">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">
                There are no active classes available for feedback right now.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;