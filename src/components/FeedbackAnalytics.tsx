"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackAnalytics } from '@/hooks/useFeedbackAnalytics';

const RATING_COLORS = {
  '1': '#ef4444', // red-500
  '2': '#f97316', // orange-500
  '3': '#eab308', // yellow-500
  '4': '#84cc16', // lime-500
  '5': '#22c55e', // green-500
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="p-2 bg-background border rounded-md shadow-md">
        <p className="font-bold">{label}</p>
        <p className="text-sm text-muted-foreground">Total Submissions: {total}</p>
        <div className="mt-2">
          {payload.slice().reverse().map((entry: any) => (
            <div key={entry.name} style={{ color: entry.color }} className="flex justify-between text-sm">
              <span>{entry.name}:</span>
              <span className="ml-4 font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const FeedbackAnalytics: React.FC = () => {
  const { feedbackStats, loading } = useFeedbackAnalytics();

  const chartData = feedbackStats.map(stat => ({
    name: stat.class_name,
    '1 Star': stat.rating_counts['1'],
    '2 Stars': stat.rating_counts['2'],
    '3 Stars': stat.rating_counts['3'],
    '4 Stars': stat.rating_counts['4'],
    '5 Stars': stat.rating_counts['5'],
  }));

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Feedback Analytics</CardTitle>
        <CardDescription>Distribution of ratings for each class.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : feedbackStats.length === 0 ? (
          <p className="text-center">No feedback data available for analytics yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="1 Star" stackId="a" fill={RATING_COLORS['1']} />
              <Bar dataKey="2 Stars" stackId="a" fill={RATING_COLORS['2']} />
              <Bar dataKey="3 Stars" stackId="a" fill={RATING_COLORS['3']} />
              <Bar dataKey="4 Stars" stackId="a" fill={RATING_COLORS['4']} />
              <Bar dataKey="5 Stars" stackId="a" fill={RATING_COLORS['5']} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackAnalytics;