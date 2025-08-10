"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileForm from '@/components/ProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

const ProfilePage: React.FC = () => {
  const { session, isLoading: isSessionLoading, setIsProfileIncompleteRedirect } = useSession();
  const navigate = useNavigate();
  const { profile, loading: loadingProfile, isSubmitting, updateProfile } = useProfile();
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
      if (updatedProfile.is_admin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isSessionLoading || loadingProfile) {
    return (
      <div className="flex flex-col items-center h-full">
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <div className="w-full space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col items-center h-full">
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
            userId={session.user.id}
            disableCancel={wasIncomplete}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;