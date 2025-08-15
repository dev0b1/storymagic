import { useState, useEffect } from 'react';
import { User, authService } from '@/lib/supabase';
import { sessionManager } from '@/lib/session-manager';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!sessionManager.isInitialized());

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await sessionManager.initialize();
        if (session) {
          const user = await authService.getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!sessionManager.isInitialized()) {
      loadUser();
    }

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe(async (session) => {
      if (session) {
        const user = await authService.getCurrentUser();
        setUser(user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    }
  };
}
