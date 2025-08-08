"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';
import TimetableManager from '@/components/TimetableManager';
import FeedbackManager from '@/components/FeedbackManager';
import UserManager from '@/components/UserManager'; // Import the new component

const AdminDashboard = () => {
  const { session, isLoading, isAdmin } = useSession();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      navigate("/student/dashboard");
    }
    setProfileLoading(false);
  }, [session, isLoading, isAdmin, navigate]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, Administrator {session?.user.email}!
        </p>
      </div>
      <TimetableManager />
      <FeedbackManager />
      <UserManager /> {/* Add the new component here */}
    </div>
  );
};

export default AdminDashboard;