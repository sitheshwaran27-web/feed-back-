"use client";

import React from 'react';
import { useStudentFeedbackHistory } from '@/hooks/useStudentFeedbackHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RatingStars from './RatingStars';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const RecentStudentFeedback: React.FC = () => {
  // Fetch only the first page with 3 items for the summary
  const { feedbackHistory, loading } = useStudentFeedbackHistory(1, 3);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Feedback</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to="/student/feedback-history">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : feedbackHistory.length === 0 ? (
          <p className="text-center">You haven't submitted any feedback yet.</p>
        ) : (
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
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.classes?.name} (P{feedback.classes?.period})</TableCell>
                  <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <RatingStars rating={feedback.rating} starClassName="inline-block" />
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

export default RecentStudentFeedback;