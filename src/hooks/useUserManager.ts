"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase'; // Import Profile

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

  const updateUser = async (userId: string, values: { first_name?: string; last_name?: string; is_admin?: boolean }) => {
    setUpdatingUserId(userId);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        is_admin: values.is_admin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      showError("Failed to update user profile.");
      setUpdatingUserId(null);
      return null;
    } else {
      showSuccess("User profile updated successfully!");
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === data.id ? { ...user, ...data } : user
        )
      );
      setUpdatingUserId(null);
      return data;
    }
  };

  const deleteUser = async (userId: string) => {
    setUpdatingUserId(userId); // Indicate that this user is being processed
    try {
      const response = await fetch(`https://kptxngsdfpmdejprefjd.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.currentSession?.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user via Edge Function.');
      }

      showSuccess("User deleted successfully!");
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showError(`Failed to delete user: ${error.message}`);
      return false;
    } finally {
      setUpdatingUserId(null);
    }
  };

  return {
    users,
    loading,
    updatingUserId,
    fetchUsers, // Expose for manual refresh if needed
    toggleAdminStatus,
    updateUser,
    deleteUser, // Expose the new delete function
  };
};