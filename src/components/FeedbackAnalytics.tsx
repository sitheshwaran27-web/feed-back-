"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { showError } from '@/utils/toast';

interface ClassFeedbackStats {
  class_id: string;
  class_name: string;
  period_number: number;
  average_rating: number;
  feedback_count: number;
}

const FeedbackAnalytics: React.FC = () => {
  const [feedbackStats, setFeedbackStats] = useState<ClassFeedbackStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    setLoading(true);
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        class_id,
        rating,
        classes (name, period_number)
      `);

    if (feedbackError) {
      console.error("Error fetching feedback for analytics:", feedbackError);
      showError("Failed to load feedback analytics.");
      setLoading(false);
      return;
    }

    if (!feedbackData || feedbackData.length === 0) {
      setFeedbackStats([]);
      setLoading(false);
      return;
    }

    // Aggregate data to calculate average rating per class
    const classMap = new Map<string, { totalRating: number; count: number; name: string; period: number }>();

    feedbackData.forEach(entry => {
      const classId = entry.class_id;
      const className = entry.classes?.name || 'Unknown Class';
      const periodNumber = entry.classes?.period_number || 0;
      const rating = entry.rating;

      if (classMap.has(classId)) {
        const existing = classMap.get(classId)!;
        existing.totalRating += rating;
        existing.count += 1;
      } else {
        classMap.set(classId, { totalRating: rating, count: 1, name: className, period: periodNumber });
      }
    });

    const aggregatedStats: ClassFeedbackStats[] = Array.from(classMap.entries()).map(([class_id, data]) => ({
      class_id,
      class_name: data.name,
      period_number: data.period,
      average_rating: parseFloat((data.totalRating / data.count).toFixed(2)),
      feedback_count: data.count,
    })).sort((a, b) => a.period_number - b.period_number); // Sort by period number

    setFeedbackStats(aggregatedStats);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Feedback Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center">Loading analytics...</p>
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