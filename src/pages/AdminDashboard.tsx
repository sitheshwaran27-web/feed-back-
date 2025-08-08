"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { showError } from '@/utils/toast';

const AdminDashboard = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching admin profile:", error);
          showError("Failed to verify admin status.");
          setIsAdmin(false);
          navigate("/login"); // Redirect if profile fetch fails
        } else if (profile && profile.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate("/student/dashboard"); // Redirect non-admins to student dashboard
        }
      }
      setProfileLoading(false);
    };

    if (!isLoading && session) {
      checkAdminStatus();
    } else if (!isLoading && !session) {
      navigate("/login");
    }
  }, [session, isLoading, navigate]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirect handled by useEffect
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // SessionContextProvider will handle the redirect to /login
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Welcome, Administrator {session?.user.email}!
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          Here you can manage timetables, classes, students, and view/respond to feedback.
        </p>
        <Button onClick={handleSignOut} variant="destructive">
          Sign Out
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AdminDashboard;