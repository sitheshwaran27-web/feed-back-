"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudentFeedbackHistory } from '@/hooks/useStudentFeedbackHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RatingStars from './RatingStars';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FeedbackHistoryEntry } from '@/types/supabase';
import { Separator } from './ui/separator';

const PAGE_SIZE = 5;

const StudentFeedbackHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { feedbackHistory, loading, totalCount } = useStudentFeedbackHistory(currentPage, PAGE_SIZE);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackHistoryEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const feedbackIdToOpen = location.state?.feedbackId;
    if (feedbackIdToOpen && feedbackHistory.length > 0) {
      const feedbackToSelect = feedbackHistory.find(f => f.id === feedbackIdToOpen);
      if (feedbackToSelect) {
        setSelectedFeedback(feedbackToSelect);
        setIsDialogOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, feedbackHistory]);

  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (feedback: FeedbackHistoryEntry) => {
    setSelectedFeedback(feedback);
    setIsDialogOpen(true);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Your Feedback History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : feedbackHistory.length === 0 ? (
          <p className="text-center">You haven't submitted any feedback yet.</p>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackHistory.map((feedback) => (
                  <TableRow key={feedback.id} onClick={() => handleRowClick(feedback)} className="cursor-pointer">
                    <TableCell>{feedback.classes?.name} (P{feedback.classes?.period})</TableCell>
                    <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <RatingStars rating={feedback.rating} starClassName="inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {selectedFeedback && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Feedback for {selectedFeedback.classes?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                    <RatingStars rating={selectedFeedback.rating} />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Your Comment:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                      {selectedFeedback.comment || "You did not leave a comment."}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Administrator's Response:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                      {selectedFeedback.admin_response || "No response from the administrator yet."}
                    </p>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        )}
        {pageCount > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentFeedbackHistory;