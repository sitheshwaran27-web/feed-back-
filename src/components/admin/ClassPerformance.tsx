"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react';
import { ClassPerformanceSummary } from '@/types/supabase';
import { Link } from 'react-router-dom';

const PerformanceList = ({ title, classes, icon: Icon, iconColor }: { title: string, classes: ClassPerformanceSummary[], icon: React.ElementType, iconColor: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Icon className={`mr-2 h-5 w-5 ${iconColor}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1">
        {classes.map(cls => (
          <li key={cls.class_id}>
            <Link
              to="/admin/feedback"
              state={{ classId: cls.class_id }}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted"
            >
              <div>
                <p className="font-semibold">{cls.class_name}</p>
                <p className="text-sm text-muted-foreground">{cls.feedback_count} submissions</p>
              </div>
              <div className="flex items-center">
                <span className="font-bold mr-2">{cls.average_rating.toFixed(1)}</span>
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const ClassPerformance: React.FC<ClassPerformanceProps> = ({ topClasses, bottomClasses, loading }) => {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 w-full">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (topClasses.length === 0 && bottomClasses.length === 0) {
    return null; // Don't render if there's no data
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full">
      <PerformanceList title="Top Performing Classes" classes={topClasses} icon={ArrowUpCircle} iconColor="text-green-500" />
      <PerformanceList title="Classes Needing Attention" classes={bottomClasses} icon={ArrowDownCircle} iconColor="text-red-500" />
    </div>
  );
};

export default ClassPerformance;