"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, MessageSquare, MessageSquarePlus } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: number | string, icon: React.ElementType, loading: boolean }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC = () => {
  const { stats, loading } = useDashboardStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full max-w-4xl mb-8">
      <StatCard
        title="Total Students"
        value={stats?.studentCount ?? 0}
        icon={Users}
        loading={loading}
      />
      <StatCard
        title="Total Subjects" {/* Renamed title */}
        value={stats?.subjectCount ?? 0} {/* Renamed value */}
        icon={BookOpen}
        loading={loading}
      />
      <StatCard
        title="Feedback Today"
        value={stats?.feedbackTodayCount ?? 0}
        icon={MessageSquarePlus}
        loading={loading}
      />
      <StatCard
        title="Total Feedback"
        value={stats?.totalFeedbackCount ?? 0}
        icon={MessageSquare}
        loading={loading}
      />
    </div>
  );
};

export default DashboardStats;