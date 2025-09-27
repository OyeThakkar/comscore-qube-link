import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mockUser } from "@/services/mockData";

const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevelopmentMode) {
      // Mock authentication for development
      setTimeout(() => {
        setUser(mockUser as any);
        setSession({ user: mockUser } as any);
        setLoading(false);
      }, 500);
      return;
    }

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
    if (isDevelopmentMode) {
      setUser(null);
      setSession(null);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshSession = async () => {
    if (isDevelopmentMode) {
      return { data: { session }, error: null };
    }
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