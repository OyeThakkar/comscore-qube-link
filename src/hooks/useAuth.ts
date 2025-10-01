import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear API token from localStorage for security
      localStorage.removeItem('qube_wire_token');
      
      const { error } = await supabase.auth.signOut();
      // Ensure local state is cleared immediately regardless of event timing
      setUser(null);
      setSession(null);
      return { error };
    } catch (error) {
      // Fallback: clear state even if an exception occurs
      setUser(null);
      setSession(null);
      // Still clear token even on error for security
      localStorage.removeItem('qube_wire_token');
      return { error } as any;
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
  };
};