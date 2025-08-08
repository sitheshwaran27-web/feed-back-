"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackManager } from '@/hooks/useFeedbackManager';
import { Feedback } from '@/types/supabase';
import RatingStars from './RatingStars';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useClasses } from '@/hooks/useClasses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

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

  const handleCancel = () => {
    form.reset();
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
              <FormLabel>Your Response</FormLabel>
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
  const {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    updateAdminResponse,
    deleteFeedback,
    classIdFilter,
    setClassIdFilter,
  } = useFeedbackManager();
  const { classes, loading: classesLoading } = useClasses();
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

  const handleDeleteFeedback = async (feedbackId: string) => {
    await deleteFeedback(feedbackId);
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
        <div className="flex items-center space-x-2">
          <Select
            value={classIdFilter}
            onValueChange={(value) => setClassIdFilter(value)}
            disabled={classesLoading || loading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by class..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} (P{cls.period})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <p className="text-center">
            {classIdFilter === 'all'
              ? "No feedback submitted yet."
              : "No feedback found for the selected class."}
          </p>
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
                  <TableCell>{feedback.classes?.name} (P{feedback.classes?.period})</TableCell>
                  <TableCell>{feedback.profiles?.first_name} {feedback.profiles?.last_name}</TableCell>
                  <TableCell>
                    <RatingStars rating={feedback.rating} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{feedback.comment || 'N/A'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{feedback.admin_response || 'No response yet'}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isResponseFormOpen && respondingToFeedback?.id === feedback.id} onOpenChange={(isOpen) => !isOpen && closeResponseForm()}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openResponseForm(feedback)} className="mr-2">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Respond to Feedback</DialogTitle>
                        </DialogHeader>
                        {respondingToFeedback && (
                          <>
                            <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{respondingToFeedback.profiles?.first_name} {respondingToFeedback.profiles?.last_name}</span>
                                <span className="text-sm text-muted-foreground">{respondingToFeedback.classes?.name} (P{respondingToFeedback.classes?.period})</span>
                              </div>
                              <RatingStars rating={respondingToFeedback.rating} />
                              {respondingToFeedback.comment ? (
                                <blockquote className="mt-2 border-l-2 pl-4 italic text-foreground">
                                  {respondingToFeedback.comment}
                                </blockquote>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No comment provided.</p>
                              )}
                            </div>
                            <Separator />
                            <FeedbackResponseForm
                              initialData={{ admin_response: respondingToFeedback?.admin_response || "" }}
                              onSubmit={handleUpdateResponse}
                              onCancel={closeResponseForm}
                              isSubmitting={isSubmittingResponse}
                            />
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                    <ConfirmAlertDialog
                      title="Are you absolutely sure?"
                      description="This action cannot be undone. This will permanently delete this feedback entry."
                      onConfirm={() => handleDeleteFeedback(feedback.id)}
                    >
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </ConfirmAlertDialog>
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