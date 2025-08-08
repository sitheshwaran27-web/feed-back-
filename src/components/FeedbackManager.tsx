"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackManager } from '@/hooks/useFeedbackManager';
import { Feedback } from '@/types/supabase'; // Import Feedback
import RatingStars from './RatingStars'; // Import the new component

const formSchema = z.object({
  admin_response: z.string().max(500, "Response cannot exceed 500 characters").optional(),
});

type FeedbackResponseFormValues = z.infer<typeof formSchema>;

interface FeedbackResponseFormProps {
  initialData?: FeedbackResponseFormValues;
  onSubmit: (data: FeedbackResponseFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  feedbackRating: number; // Added prop for displaying rating in the form
}

const FeedbackResponseForm: React.FC<FeedbackResponseFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting, feedbackRating }) => {
  const form = useForm<FeedbackResponseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      admin_response: "",
    },
  });

  const handleCancel = () => {
    form.reset(); // Reset form fields on cancel
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="admin_response"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Response</FormLabel>
              <FormControl>
                <Textarea placeholder="Type your response here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Response"}
          </Button>
        </div>
      </form>
    </Form>
  );
};


const FeedbackManager: React.FC = () => {
  const { feedbackEntries, loading, isSubmittingResponse, updateAdminResponse } = useFeedbackManager();
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [respondingToFeedback, setRespondingToFeedback] = useState<Feedback | null>(null);

  const handleUpdateResponse = async (values: FeedbackResponseFormValues) => {
    if (!respondingToFeedback) return;
    const updated = await updateAdminResponse(respondingToFeedback.id, values.admin_response || null);
    if (updated) {
      setIsResponseFormOpen(false);
      setRespondingToFeedback(null);
    }
  };

  const openResponseForm = (feedback: Feedback) => {
    setRespondingToFeedback(feedback);
    setIsResponseFormOpen(true);
  };

  const closeResponseForm = () => {
    setIsResponseFormOpen(false);
    setRespondingToFeedback(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Student Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Admin Response</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : feedbackEntries.length === 0 ? (
          <p className="text-center">No feedback submitted yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Admin Response</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbackEntries.map((feedback: Feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.classes?.name} (P{feedback.classes?.period_number})</TableCell>
                  <TableCell>{feedback.profiles?.first_name} {feedback.profiles?.last_name}</TableCell>
                  <TableCell>
                    <RatingStars rating={feedback.rating} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{feedback.comment || 'N/A'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{feedback.admin_response || 'No response yet'}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isResponseFormOpen && respondingToFeedback?.id === feedback.id} onOpenChange={setIsResponseFormOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openResponseForm(feedback)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Respond to Feedback</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Class:</strong> {feedback.classes?.name} (P{feedback.classes?.period_number})<br />
                          <strong>Student:</strong> {feedback.profiles?.first_name} {feedback.profiles?.last_name}<br />
                          <strong>Rating:</strong> <RatingStars rating={feedback.rating} /> <br />
                          <strong>Comment:</strong> {feedback.comment || 'N/A'}
                        </p>
                        <FeedbackResponseForm
                          initialData={{ admin_response: respondingToFeedback?.admin_response || "" }}
                          onSubmit={handleUpdateResponse}
                          onCancel={closeResponseForm}
                          isSubmitting={isSubmittingResponse}
                          feedbackRating={feedback.rating}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackManager;