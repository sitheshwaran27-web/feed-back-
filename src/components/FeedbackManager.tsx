"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2, Trash2, Star, ArrowUp, ArrowDown, Filter, ChevronsUpDown, XCircle } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

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

type SortableHeaderProps = {
  children: React.ReactNode;
  columnKey: keyof Feedback | 'student_name' | 'class_name';
  sortConfig: { key: string; direction: string } | null;
  setSortConfig: (config: { key: string; direction: string }) => void;
};

const SortableHeader: React.FC<SortableHeaderProps> = ({ children, columnKey, sortConfig, setSortConfig }) => {
  const isSorted = sortConfig?.key === columnKey;
  const direction = isSorted ? sortConfig.direction : 'none';

  const handleClick = () => {
    let newDirection = 'ascending';
    if (isSorted && sortConfig.direction === 'ascending') {
      newDirection = 'descending';
    }
    setSortConfig({ key: columnKey, direction: newDirection });
  };

  return (
    <Button variant="ghost" onClick={handleClick} className="pl-0">
      {children}
      {isSorted && direction === 'ascending' && <ArrowUp className="ml-2 h-4 w-4" />}
      {isSorted && direction === 'descending' && <ArrowDown className="ml-2 h-4 w-4" />}
    </Button>
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
  const location = useLocation();
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [respondingToFeedback, setRespondingToFeedback] = useState<Feedback | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<string[]>([]);
  const [classFilter, setClassFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'created_at', direction: 'descending' });

  useEffect(() => {
    if (location.state) {
      const { classId, studentName } = location.state;
      if (classId) {
        setClassFilter(classId);
      }
      if (studentName) {
        setSearchTerm(studentName);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRatingFilter([]);
    setClassFilter('all');
    setSearchTerm('');
    setSortConfig({ key: 'created_at', direction: 'descending' });
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    ratingFilter.length > 0,
    classFilter !== 'all',
    searchTerm !== '',
  ].filter(Boolean).length;

  const availableClasses = useMemo(() => {
    if (!feedbackEntries) return [];
    const uniqueClasses = new Map<string, { name: string; period: number }>();
    feedbackEntries.forEach(entry => {
      if (entry.classes && !uniqueClasses.has(entry.class_id)) {
        uniqueClasses.set(entry.class_id, { name: entry.classes.name, period: entry.classes.period });
      }
    });
    return Array.from(uniqueClasses.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => a.period - b.period);
  }, [feedbackEntries]);

  const filteredAndSortedFeedback = useMemo(() => {
    let filtered = [...feedbackEntries];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => (statusFilter === 'responded' ? !!entry.admin_response : !entry.admin_response));
    }
    if (ratingFilter.length > 0) {
      filtered = filtered.filter(entry => ratingFilter.includes(entry.rating.toString()));
    }
    if (classFilter !== 'all') {
      filtered = filtered.filter(entry => entry.class_id === classFilter);
    }
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        `${entry.profiles?.first_name || ''} ${entry.profiles?.last_name || ''}`.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'student_name') {
          aValue = `${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`;
          bValue = `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`;
        } else if (sortConfig.key === 'class_name') {
          aValue = a.classes?.name || '';
          bValue = b.classes?.name || '';
        } else {
          aValue = a[sortConfig.key as keyof Feedback];
          bValue = b[sortConfig.key as keyof Feedback];
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [feedbackEntries, statusFilter, ratingFilter, classFilter, searchTerm, sortConfig]);

  const handleUpdateResponse = async (values: FeedbackResponseFormValues) => {
    if (!respondingToFeedback) return;
    const updated = await updateAdminResponse(respondingToFeedback.id, values.admin_response || null);
    if (updated) {
      closeResponseForm();
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
    <Card className="w-full max-w-6xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Manage Student Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Collapsible
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          className="mb-4 border rounded-lg"
        >
          <div className="flex items-center justify-between p-2 pr-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center text-sm font-semibold">
                <Filter className="h-4 w-4 mr-2" />
                Filters & Search
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                )}
                <ChevronsUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
              </Button>
            </CollapsibleTrigger>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <XCircle className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <div className="flex flex-col gap-4 p-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {availableClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name} (P{cls.period})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="unresponded">Unresponded</ToggleGroupItem>
                    <ToggleGroupItem value="responded">Responded</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Separator orientation="vertical" className="h-8 hidden md:block" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Ratings:</span>
                  <ToggleGroup type="multiple" value={ratingFilter} onValueChange={setRatingFilter}>
                    {[1, 2, 3, 4, 5].map(r => (
                      <ToggleGroupItem key={r} value={r.toString()} className="p-2"><Star className="h-4 w-4" /></ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader columnKey="student_name" sortConfig={sortConfig} setSortConfig={setSortConfig}>Student</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader columnKey="class_name" sortConfig={sortConfig} setSortConfig={setSortConfig}>Class</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader columnKey="rating" sortConfig={sortConfig} setSortConfig={setSortConfig}>Rating</SortableHeader>
                </TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>
                  <SortableHeader columnKey="created_at" sortConfig={sortConfig} setSortConfig={setSortConfig}>Date</SortableHeader>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedFeedback.length > 0 ? (
                filteredAndSortedFeedback.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.profiles?.first_name} {feedback.profiles?.last_name}</TableCell>
                    <TableCell>{feedback.classes.name}</TableCell>
                    <TableCell><RatingStars rating={feedback.rating} /></TableCell>
                    <TableCell className="max-w-[200px] truncate">{feedback.comment || 'N/A'}</TableCell>
                    <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
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
                                <blockquote className="mt-2 border-l-2 pl-4 italic text-foreground">{respondingToFeedback.comment || "No comment provided."}</blockquote>
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
                        description="This will permanently delete this feedback entry."
                        onConfirm={() => handleDeleteFeedback(feedback.id)}
                      >
                        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </ConfirmAlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No feedback matches the current filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackManager;