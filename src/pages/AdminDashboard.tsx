"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import ClassManager from '@/components/ClassManager';
import FeedbackManager from '@/components/FeedbackManager';
import UserManager from '@/components/UserManager';
import FeedbackAnalytics from '@/components/FeedbackAnalytics';
import TimetableManager from '@/components/TimetableManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardStats from '@/components/DashboardStats'; // Import the new component

const AdminDashboard = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return null; // ProtectedRoute handles the redirect
  }

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, Administrator {session?.user.email}!
        </p>
      </div>

      <DashboardStats /> {/* Add the stats component here */}

      <Tabs defaultValue="classes" className="w-full max-w-4xl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="classes">
          <ClassManager />
        </TabsContent>
        <TabsContent value="timetable">
          <TimetableManager />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackManager />
        </TabsContent>
        <TabsContent value="users">
          <UserManager />
        </TabsContent>
        <TabsContent value="analytics">
          <FeedbackAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;