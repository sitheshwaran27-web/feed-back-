"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, Info } from 'lucide-react';
import { useDailyClasses } from '@/hooks/useDailyClasses';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';

const StudentDashboard = () => {
  const { session, isLoading: isSessionLoading, isAdmin } = useSession();
  const { profile, loading: profileLoading } = useProfile();

  const {
    activeFeedbackClass,
    hasSubmittedFeedbackForActiveClass,
    loading: classesLoading,
    fetchDailyClasses
  } = useDailyClasses();

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  if (isSessionLoading || classesLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center p-4 h-full space-y-8">
        {/* Header Skeleton */}
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-7 w-3/4" />
        </div>

        {/* Main Content Skeleton */}
        <div className="w-full max-w-6xl space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64 lg:col-span-1" />
          </div>
          <Skeleton className="h-48 w-full" />
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
    <div className="flex flex-col items-center p-4 h-full space-y-8">
      {/* Header Section */}
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200">Student Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Welcome back, {profile?.first_name || session.user.email}!
        </p>
      </div>

      {/* Class Feedback Section */}
      <div className="w-full max-w-md">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Class Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {activeFeedbackClass ? (
              hasSubmittedFeedbackForActiveClass ? (
                <div className="text-center text-green-600 dark:text-green-400 flex flex-col items-center justify-center h-full py-8">
                  <CheckCircle className="h-8 w-8 mb-2" />
                  <p>Feedback for <strong>{activeFeedbackClass.name}</strong> submitted. Thank you!</p>
                </div>
              ) : (
                <>
                  <CardDescription>
                    Please provide your feedback for <strong>{activeFeedbackClass.name} (P{activeFeedbackClass.period})</strong>.
                  </CardDescription>
                  <div className="mt-4">
                    <FeedbackForm onSubmit={handleFeedbackSubmit} isSubmitting={isSubmittingFeedback} />
                  </div>
                </>
              )
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full py-8">
                <Info className="h-8 w-8 mb-2" />
                <p>No class is currently active for feedback. Feedback becomes available at the start of each class.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;