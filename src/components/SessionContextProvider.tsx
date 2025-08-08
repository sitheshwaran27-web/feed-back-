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
  isProfileIncompleteRedirect: boolean; // New state
  setIsProfileIncompleteRedirect: (value: boolean) => void; // New setter
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileIncompleteRedirect, setIsProfileIncompleteRedirect] = useState(false); // Initialize new state
  const navigate = useNavigate();

  const handleSession = async (currentSession: Session | null) => {
    setIsLoading(true);
    if (currentSession) {
      setSession(currentSession);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, first_name, last_name')
        .eq('id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        showError("Failed to load user profile. Please complete your profile.");
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(true); // Set to true if profile fetch fails
        navigate("/profile");
      } else {
        setIsAdmin(profile?.is_admin || false);
        if (!profile?.first_name || !profile?.last_name) {
          showError("Please complete your profile details.");
          setIsProfileIncompleteRedirect(true); // Set to true if profile is incomplete
          navigate("/profile");
        } else {
          setIsProfileIncompleteRedirect(false); // Reset if profile is complete
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
      setIsProfileIncompleteRedirect(false); // Reset on sign out
      navigate("/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false); // Reset on sign out
        navigate("/login");
        showError("You have been signed out.");
      } else if (currentSession) {
        handleSession(currentSession);
      } else {
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false); // Reset if no session
        navigate("/login");
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      handleSession(initialSession);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, isLoading, isAdmin, isProfileIncompleteRedirect, setIsProfileIncompleteRedirect }}>
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