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
  isProfileIncompleteRedirect: boolean;
  setIsProfileIncompleteRedirect: (value: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileIncompleteRedirect, setIsProfileIncompleteRedirect] = useState(false);
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

      if (profileError || !profile?.first_name || !profile?.last_name) {
        console.error("Profile incomplete or error fetching profile:", profileError);
        showError("Please complete your profile details.");
        setIsAdmin(profile?.is_admin || false); // Still set admin status if profile exists but is incomplete
        setIsProfileIncompleteRedirect(true);
        navigate("/profile");
      } else {
        setIsAdmin(profile.is_admin);
        setIsProfileIncompleteRedirect(false);
        if (profile.is_admin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    } else {
      setSession(null);
      setIsAdmin(false);
      setIsProfileIncompleteRedirect(false);
      navigate("/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false);
        navigate("/login");
        showError("You have been signed out.");
      } else if (currentSession) {
        handleSession(currentSession);
      } else {
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false);
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