"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError } from '@/utils/toast';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface FeedbackEntry {
  id: string;
  rating: number;
  comment: string | null;
  admin_response: string | null;
  created_at: string;
  classes: {
    name: string;
    period_number: number;
  };
}

const StudentFeedbackHistory: React.FC = () => {
  const { session, isLoading } = useSession();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && session?.user.id) {
      fetchFeedbackHistory(session.user.id);
    }
  }, [session, isLoading]);

  const fetchFeedbackHistory = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        classes (name, period_number)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching student feedback history:", error);
      showError("Failed to load your feedback history.");
    } else {
      setFeedbackHistory(data || []);
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Your Feedback History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : feedbackHistory.length === 0 ? (
          <p className="text-center">You haven't submitted any feedback yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Your Comment</TableHead>
                <TableHead>Admin Response</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbackHistory.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.classes?.name} (P{feedback.classes?.period_number})</TableCell>
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
                  <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentFeedbackHistory;