"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

const ProfilePage: React.FC = () => {
  const { session, isLoading, isAdmin, setIsProfileIncompleteRedirect } = useSession(); // Get setIsProfileIncompleteRedirect
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasIncomplete, setWasIncomplete] = useState(false);

  useEffect(() => {
    // SessionContextProvider handles redirection if not authenticated
    if (!isLoading && session?.user.id) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, is_admin')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          showError("Failed to load profile. Please update your details.");
          setProfile(null);
          setWasIncomplete(true);
        } else {
          setProfile(data);
          if (!data?.first_name || !data?.last_name) {
            setWasIncomplete(true);
          } else {
            setWasIncomplete(false);
          }
        }
        setLoadingProfile(false);
      };
      fetchProfile();
    } else if (!isLoading && !session) {
      setLoadingProfile(false); // Ensure loading state is false if no session
    }
  }, [session, isLoading]);

  const handleUpdateProfile = async (values: { first_name?: string; last_name?: string; avatar_url?: string }) => {
    if (!session?.user.id) {
      showError("User not authenticated.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        avatar_url: values.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile.");
    } else {
      showSuccess("Profile updated successfully!");
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, is_admin')
        .eq('id', session.user.id)
        .single();

      if (!fetchError) {
        setProfile(updatedProfile);
        if (wasIncomplete && updatedProfile?.first_name && updatedProfile?.last_name) {
          setIsProfileIncompleteRedirect(false); // Reset the incomplete redirect state
          if (updatedProfile.is_admin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        } else {
          navigate(-1);
        }
      } else {
        navigate(-1);
      }
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null; // SessionContextProvider handles redirect to login
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {wasIncomplete && (
            <Alert className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Profile Incomplete!</AlertTitle>
              <AlertDescription>
                Please complete your first name and last name to proceed.
              </AlertDescription>
            </Alert>
          )}
          <ProfileForm
            initialData={{
              first_name: profile?.first_name || "",
              last_name: profile?.last_name || "",
              avatar_url: profile?.avatar_url || "",
            }}
            onSubmit={handleUpdateProfile}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            email={session.user.email || "N/A"}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;