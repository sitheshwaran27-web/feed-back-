"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2, Trash2, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackManager } from '@/hooks/useFeedbackManager';
import { Feedback } from '@/types/supabase';
import RatingStars from './RatingStars';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

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
                <Textarea placeholder="Type your response here..." {...field} value={field.value || ''} />
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
  } = useFeedbackManager();
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [respondingToFeedback, setRespondingToFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<string[]>([]);

  const filteredFeedbackEntries = useMemo(() => {
    if (!feedbackEntries) return [];
    return feedbackEntries.filter(entry => {
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'responded' && !!entry.admin_response) ||
        (statusFilter === 'unresponded' && !entry.admin_response);

      const ratingMatch = ratingFilter.length === 0 || ratingFilter.includes(entry.rating.toString());

      return statusMatch && ratingMatch;
    });
  }, [feedbackEntries, statusFilter, ratingFilter]);

  const groupedFeedback = useMemo(() => {
    if (!filteredFeedbackEntries) return [];
    const groups: Record<string, { className: string; period: number; entries: Feedback[]; totalRating: number }> = {};

    filteredFeedbackEntries.forEach(feedback => {
      if (!feedback.class_id || !feedback.classes) return;
      if (!groups[feedback.class_id]) {
        groups[feedback.class_id] = {
          className: feedback.classes.name,
          period: feedback.classes.period,
          entries: [],
          totalRating: 0,
        };
      }
      groups[feedback.class_id].entries.push(feedback);
      groups[feedback.class_id].totalRating += feedback.rating;
    });

    return Object.entries(groups)
      .map(([classId, group]) => ({
        classId,
        ...group,
        averageRating: group.totalRating / group.entries.length,
      }))
      .sort((a, b) => a.period - b.period);
  }, [filteredFeedbackEntries]);

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
      <CardHeader>
        <CardTitle>Manage Student Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4 p-2 border rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <ToggleGroup
              type="single"
              defaultValue="all"
              value={statusFilter}
              onValueChange={(value) => {
                if (value) setStatusFilter(value);
              }}
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="unresponded">Unresponded</ToggleGroupItem>
              <ToggleGroupItem value="responded">Responded</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Ratings:</span>
            <ToggleGroup
              type="multiple"
              value={ratingFilter}
              onValueChange={setRatingFilter}
              aria-label="Filter by rating"
            >
              {[1, 2, 3, 4, 5].map(rating => (
                <ToggleGroupItem key={rating} value={rating.toString()} aria-label={`Toggle ${rating} star`}>
                  <Star className={cn("h-4 w-4", ratingFilter.includes(rating.toString()) ? "text-yellow-500 fill-yellow-500" : "text-yellow-300 fill-yellow-300")} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : groupedFeedback.length === 0 ? (
          <p className="text-center py-8">
            No feedback matches the current filters.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {groupedFeedback.map((group) => (
              <AccordionItem value={group.classId} key={group.classId}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full pr-4">
                    <span className="font-semibold">{group.className} (P{group.period})</span>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{group.entries.length} submissions</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                        <span>{group.averageRating.toFixed(1)} avg. rating</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Admin Response</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.entries.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>{feedback.profiles?.first_name} {feedback.profiles?.last_name}</TableCell>
                          <TableCell><RatingStars rating={feedback.rating} /></TableCell>
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
                                <DialogHeader><DialogTitle>Respond to Feedback</DialogTitle></DialogHeader>
                                {respondingToFeedback && (
                                  <>
                                    <div className="space-y-3 rounded-md border bg-muted/50 p-4">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{respondingToFeedback.profiles?.first_name} {respondingToFeedback.profiles?.last_name}</span>
                                        <RatingStars rating={respondingToFeedback.rating} />
                                      </div>
                                      {respondingToFeedback.comment ? (
                                        <blockquote className="mt-2 border-l-2 pl-4 italic text-foreground">{respondingToFeedback.comment}</blockquote>
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
                              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                            </ConfirmAlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackManager;