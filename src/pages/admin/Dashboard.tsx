"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import DashboardStats from '@/components/DashboardStats';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import RecentFeedback from '@/components/admin/RecentFeedback';
import ClassPerformance from '@/components/admin/ClassPerformance';
import { Separator } from '@/components/ui/separator';

const AdminDashboardPage = () => {
  const { session } = useSession();
  const { recentFeedback, topClasses, bottomClasses, loading } = useAdminDashboardData();

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Welcome, Administrator {session?.user.email}!
        </p>
      </div>
      
      <div className="w-full max-w-6xl">
        <DashboardStats />
      </div>

      <Separator className="my-8" />

      <div className="w-full max-w-6xl">
        <ClassPerformance topClasses={topClasses} bottomClasses={bottomClasses} loading={loading} />
      </div>

      <div className="w-full max-w-6xl">
        <RecentFeedback feedback={recentFeedback} loading={loading} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;