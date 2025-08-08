"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const ProfilePage: React.FC = () => {
  const { session, isLoading: isSessionLoading, isAdmin, setIsProfileIncompleteRedirect } = useSession();
  const navigate = useNavigate();
  const { profile, loading: loadingProfile, isSubmitting, fetchProfile, updateProfile } = useProfile();
  const [wasIncomplete, setWasIncomplete] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && profile) {
      if (!profile.first_name || !profile.last_name) {
        setWasIncomplete(true);
      } else {
        setWasIncomplete(false);
      }
    }
  }, [profile, isSessionLoading]);

  const handleUpdateProfile = async (values: { first_name?: string; last_name?: string; avatar_url?: string }) => {
    const updatedProfile = await updateProfile(values);

    if (updatedProfile) {
      if (wasIncomplete && updatedProfile.first_name && updatedProfile.last_name) {
        if (updatedProfile.is_admin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      } else {
        navigate(-1);
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isSessionLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col items-center p-4 h-full">
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
            userId={session.user.id} {/* Pass userId here */}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;