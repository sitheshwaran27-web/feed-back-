"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Feedback } from '@/types/supabase';
import RatingStars from '../RatingStars';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';

interface RecentFeedbackProps {
  feedback: Feedback[];
  loading: boolean;
}

const RecentFeedback: React.FC<RecentFeedbackProps> = ({ feedback, loading }) => {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (feedback.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No feedback has been submitted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Feedback</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/feedback">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {feedback.map(item => (
            <li key={item.id}>
              <Link
                to="/admin/feedback"
                state={{ feedbackId: item.id }}
                className="flex items-start space-x-4 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <Avatar>
                  <AvatarImage src={item.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">
                      {item.profiles?.first_name || 'Student'} {item.profiles?.last_name}
                      <span className="mx-1 font-normal text-muted-foreground">on</span>
                      {item.subjects.name} {/* Renamed from classes.name */}
                    </p>
                    <RatingStars rating={item.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate text-left">
                    {item.comment || 'No comment provided.'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecentFeedback;