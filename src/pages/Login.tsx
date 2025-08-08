"use client";

import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';
import { customAuthTheme } from '@/lib/supabaseAuthTheme'; // Import the custom theme

function Login() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (session) {
    // SessionContextProvider will handle redirect if session exists
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to the Feedback Portal</CardTitle>
          <CardDescription>Sign in or sign up to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers unless specified
            appearance={{
              theme: customAuthTheme, // Use the custom theme
            }}
            redirectTo={window.location.origin} // Redirect to root after auth, SessionContextProvider handles further redirect
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;