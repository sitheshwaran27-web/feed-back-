"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase"; // Import Profile type

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

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false);
        setIsLoading(false);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, is_admin, batch_id, semester_number')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError || !profile) {
          console.error("Error fetching profile in SessionContextProvider:", (profileError as any)?.message || profileError);
          setIsAdmin(false);
          setIsProfileIncompleteRedirect(true);
        } else {
          setIsAdmin(profile.is_admin || false);
          // Admins only need a name, students need name, batch, and semester
          if (profile.is_admin) {
            setIsProfileIncompleteRedirect(!profile.first_name || !profile.last_name);
          } else {
            setIsProfileIncompleteRedirect(!profile.first_name || !profile.last_name || !profile.batch_id || !profile.semester_number);
          }
        }
      } else {
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false);
      }
      setIsLoading(false);
    };

    checkSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoading(true);
      checkSessionAndProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

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
