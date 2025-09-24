import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = 'admin' | 'client_service' | 'viewer';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        setRole(data.role as UserRole);
        
        // Update last login
        await supabase.rpc('update_last_login');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  // Refresh role data every 10 seconds to catch updates
  useEffect(() => {
    if (!user || authLoading) return;
    
    const interval = setInterval(() => {
      fetchUserRole();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, authLoading]);

  const refreshRole = () => {
    if (user && !authLoading) {
      fetchUserRole();
    }
  };

  const hasPermission = (requiredRoles: UserRole[]) => {
    return role && requiredRoles.includes(role);
  };

  const isAdmin = () => role === 'admin';
  const isClientService = () => role === 'client_service';
  const isViewer = () => role === 'viewer';

  return {
    role,
    loading: loading || authLoading,
    hasPermission,
    isAdmin,
    isClientService,
    isViewer,
    refreshRole,
  };
};