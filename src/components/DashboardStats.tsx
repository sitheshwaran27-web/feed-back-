"use client";

import React from 'react';
import { Users, BookOpen, MessageSquare, MessageSquarePlus } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import StatCard from './StatCard';

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
        title="Total Subjects"
        value={stats?.subjectCount ?? 0}
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