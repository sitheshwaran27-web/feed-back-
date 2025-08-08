"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setIsLoading(true); // Start loading when auth state changes
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        navigate("/login");
        showError("You have been signed out.");
      } else if (currentSession) {
        setSession(currentSession);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          showError("Failed to load user profile. Please complete your profile.");
          setIsAdmin(false);
          navigate("/profile"); // Redirect to profile page to allow user to complete it.
        } else {
          setIsAdmin(profile?.is_admin || false);
          // If user is authenticated and profile loaded, navigate to appropriate dashboard
          if (profile?.is_admin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }
      } else {
        setSession(null);
        setIsAdmin(false);
        navigate("/login");
      }
      setIsLoading(false); // End loading after state is processed
    });

    // Initial session check on component mount
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', initialSession.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching initial profile:", profileError);
          showError("Failed to load user profile. Please complete your profile.");
          setIsAdmin(false);
          navigate("/profile");
        } else {
          setIsAdmin(profile?.is_admin || false);
          // Initial redirect based on session and admin status
          if (profile?.is_admin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
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