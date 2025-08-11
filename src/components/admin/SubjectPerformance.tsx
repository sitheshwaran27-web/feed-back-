"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircle, ArrowDownCircle, Star } from 'lucide-react';
import { SubjectPerformanceSummary } from '@/types/supabase'; // Renamed import
import { Link } from 'react-router-dom';

const PerformanceList = ({ title, subjects, icon: Icon, iconColor }: { title: string, subjects: SubjectPerformanceSummary[], icon: React.ElementType, iconColor: string }) => ( // Renamed prop
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Icon className={`mr-2 h-5 w-5 ${iconColor}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1">
        {subjects.map(sub => ( // Renamed map variable
          <li key={sub.subject_id}> {/* Renamed key */}
            <Link
              to="/admin/feedback"
              state={{ subjectId: sub.subject_id }} {/* Renamed state key */}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted"
            >
              <div>
                <p className="font-semibold">{sub.subject_name}</p> {/* Renamed property */}
                <p className="text-sm text-muted-foreground">{sub.feedback_count} submissions</p>
              </div>
              <div className="flex items-center">
                <span className="font-bold mr-2">{sub.average_rating.toFixed(1)}</span>
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

interface SubjectPerformanceProps { // Renamed interface
    topSubjects: SubjectPerformanceSummary[]; // Renamed prop
    bottomSubjects: SubjectPerformanceSummary[]; // Renamed prop
    loading: boolean;
}

const SubjectPerformance: React.FC<SubjectPerformanceProps> = ({ topSubjects, bottomSubjects, loading }) => { // Renamed props
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 w-full">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (topSubjects.length === 0 && bottomSubjects.length === 0) { // Renamed prop
    return null; // Don't render if there's no data
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full">
      <PerformanceList title="Top Performing Subjects" subjects={topSubjects} icon={ArrowUpCircle} iconColor="text-green-500" /> {/* Renamed props */}
      <PerformanceList title="Subjects Needing Attention" subjects={bottomSubjects} icon={ArrowDownCircle} iconColor="text-red-500" /> {/* Renamed props */}
    </div>
  );
};

export default SubjectPerformance;