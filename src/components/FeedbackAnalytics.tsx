"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useFeedbackAnalytics } from '@/hooks/useFeedbackAnalytics'; // Import the new hook

interface ClassFeedbackStats { // This interface is still needed for type consistency with the chart data
  class_id: string;
  class_name: string;
  period_number: number;
  average_rating: number;
  feedback_count: number;
}

const FeedbackAnalytics: React.FC = () => {
  const { feedbackStats, loading } = useFeedbackAnalytics();

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Feedback Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : feedbackStats.length === 0 ? (
          <p className="text-center">No feedback data available for analytics yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={feedbackStats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class_name" />
              <YAxis domain={[0, 5]} />
              <Tooltip formatter={(value: number) => [`${value} Stars`, 'Average Rating']} />
              <Bar dataKey="average_rating" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackAnalytics;