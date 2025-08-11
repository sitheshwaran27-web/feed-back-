"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';

export const useProfile = () => {
  const { session, isLoading: isSessionLoading, setIsProfileIncompleteRedirect } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    if (!session?.user.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Fetch full profile data, including batch and semester
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, is_admin, updated_at, batch_id, semester_number, batches (name)') // Added batch_id, semester_number, and joined batches
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      showError("Failed to load profile.");
      setProfile(null);
    } else {
      setProfile(data as Profile); 
    }
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      fetchProfile();
    } else if (!isSessionLoading && !session) {
      setProfile(null);
      setLoading(false);
    }
  }, [session, isSessionLoading, fetchProfile]);

  const updateProfile = async (values: { first_name?: string; last_name?: string; avatar_url?: string; batch_id?: string | null; semester_number?: number | null }) => { // Added batch_id, semester_number
    if (!session?.user.id) {
      showError("User not authenticated.");
      return null;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        avatar_url: values.avatar_url || null,
        batch_id: values.batch_id || null, // Update batch_id
        semester_number: values.semester_number || null, // Update semester_number
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select('id, first_name, last_name, avatar_url, is_admin, updated_at, batch_id, semester_number, batches (name)') // Select updated fields
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Profile updated successfully!");
      setProfile(data);
      // Update redirect logic to include batch_id and semester_number
      if (data?.first_name && data?.last_name && data?.batch_id && data?.semester_number) {
        setIsProfileIncompleteRedirect(false);
      }
      setIsSubmitting(false);
      return data;
    }
  };

  return {
    profile,
    loading,
    isSubmitting,
    fetchProfile,
    updateProfile,
  };
};