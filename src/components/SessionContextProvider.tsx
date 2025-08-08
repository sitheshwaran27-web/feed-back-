"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleSession = async (currentSession: Session | null) => {
    setIsLoading(true);
    if (currentSession) {
      setSession(currentSession);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, first_name, last_name') // Fetch first_name and last_name
        .eq('id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        showError("Failed to load user profile. Please complete your profile.");
        setIsAdmin(false);
        navigate("/profile"); // Redirect to profile page to allow user to complete it.
      } else {
        setIsAdmin(profile?.is_admin || false);
        // Check if first_name or last_name are missing
        if (!profile?.first_name || !profile?.last_name) {
          showError("Please complete your profile details.");
          navigate("/profile");
        } else {
          // If user is authenticated and profile loaded, navigate to appropriate dashboard
          if (profile?.is_admin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }
      }
    } else {
      setSession(null);
      setIsAdmin(false);
      navigate("/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        navigate("/login");
        showError("You have been signed out.");
      } else if (currentSession) {
        handleSession(currentSession);
      } else {
        setSession(null);
        setIsAdmin(false);
        navigate("/login");
      }
    });

    // Initial session check on component mount
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      handleSession(initialSession);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, isLoading, isAdmin }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};