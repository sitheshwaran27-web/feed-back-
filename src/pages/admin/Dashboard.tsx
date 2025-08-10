"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import DashboardStats from '@/components/DashboardStats';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import RecentFeedback from '@/components/admin/RecentFeedback';
import ClassPerformance from '@/components/admin/ClassPerformance';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboardPage = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { recentFeedback, topClasses, bottomClasses, loading: isAdminDataLoading } = useAdminDashboardData();

  const isLoading = isSessionLoading || isAdminDataLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center w-full space-y-8">
        {/* Header Skeleton */}
        <div className="w-full max-w-6xl text-center">
          <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-7 w-3/4 mx-auto" />
        </div>
        
        {/* DashboardStats Skeleton */}
        <div className="w-full max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>

        <Separator className="my-8" />

        {/* ClassPerformance Skeleton */}
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>

        {/* RecentFeedback Skeleton */}
        <div className="w-full max-w-6xl">
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

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
        <ClassPerformance topClasses={topClasses} bottomClasses={bottomClasses} loading={isAdminDataLoading} />
      </div>

      <div className="w-full max-w-6xl">
        <RecentFeedback feedback={recentFeedback} loading={isAdminDataLoading} />
      </div>
    </div>
  );
};

export default AdminDashboardPage;