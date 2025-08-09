"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import DashboardStats from '@/components/DashboardStats';

const AdminDashboardPage = () => {
  const { session } = useSession();

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, Administrator {session?.user.email}!
        </p>
      </div>
      <DashboardStats />
    </div>
  );
};

export default AdminDashboardPage;