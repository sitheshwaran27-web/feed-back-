"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Loader2 } from 'lucide-react'; // Import Loader2 icon
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface Feedback {
  id: string;
  class_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  admin_response: string | null;
  created_at: string;
  classes: {
    name: string;
    period_number: number;
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
}

const formSchema = z.object({
  admin_response: z.string().max(500, "Response cannot exceed 500 characters").optional(),
});

type FeedbackResponseFormValues = z.infer<typeof formSchema>;

interface FeedbackResponseFormProps {
  initialData?: FeedbackResponseFormValues;
  onSubmit: (data: FeedbackResponseFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FeedbackResponseForm: React.FC<FeedbackResponseFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<FeedbackResponseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      admin_response: "",
    },
  });

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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
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
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [respondingToFeedback, setRespondingToFeedback] = useState<Feedback | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        classes (name, period_number),
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      showError("Failed to load feedback entries.");
    } else {
      setFeedbackEntries(data || []);
    }
    setLoading(false);
  };

  const handleUpdateResponse = async (values: FeedbackResponseFormValues) => {
    if (!respondingToFeedback) return;
    setIsSubmittingResponse(true);
    const { data, error } = await supabase
      .from('feedback')
      .update({ admin_response: values.admin_response })
      .eq('id', respondingToFeedback.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating feedback response:", error);
      showError("Failed to update feedback response.");
    } else {
      showSuccess("Feedback response updated successfully!");
      setFeedbackEntries(feedbackEntries.map(entry => entry.id === data.id ? { ...entry, admin_response: data.admin_response } : entry));
      setIsResponseFormOpen(false);
      setRespondingToFeedback(null);
    }
    setIsSubmittingResponse(false);
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
              {feedbackEntries.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.classes?.name} (P{feedback.classes?.period_number})</TableCell>
                  <TableCell>{feedback.profiles?.first_name} {feedback.profiles?.last_name}</TableCell>
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
                          <strong>Rating:</strong> {feedback.rating} <Star className="inline h-4 w-4 fill-yellow-500 text-yellow-500" /><br />
                          <strong>Comment:</strong> {feedback.comment || 'N/A'}
                        </p>
                        <FeedbackResponseForm
                          initialData={{ admin_response: feedback.admin_response || "" }}
                          onSubmit={handleUpdateResponse}
                          onCancel={closeResponseForm}
                          isSubmitting={isSubmittingResponse}
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