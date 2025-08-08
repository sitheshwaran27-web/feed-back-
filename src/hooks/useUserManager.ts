"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  email: string; // Assuming email can be fetched or joined
}

export const useUserManager = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // Fetch profiles and join with auth.users to get email
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        is_admin,
        auth_users:auth.users(email)
      `);

    if (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load user list.");
    } else {
      const usersWithEmail: Profile[] = data.map(profile => ({
        ...profile,
        email: profile.auth_users?.email || 'N/A',
      }));
      setUsers(usersWithEmail || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean) => {
    setUpdatingUserId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentIsAdmin })
      .eq('id', userId);

    if (error) {
      console.error("Error updating admin status:", error);
      showError(`Failed to update admin status for user ${userId}.`);
    } else {
      showSuccess("Admin status updated successfully!");
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: !currentIsAdmin } : user
        )
      );
    }
    setUpdatingUserId(null);
  };

  return {
    users,
    loading,
    updatingUserId,
    fetchUsers, // Expose for manual refresh if needed
    toggleAdminStatus,
  };
};