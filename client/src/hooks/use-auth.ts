import { useState, useEffect, useCallback } from 'react';
import { User, authService } from '@/lib/auth';
import { sessionManager } from '@/lib/session-manager';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!sessionManager.isInitialized());

  // Logout function that properly handles state transitions
  const logout = useCallback(async () => {
    try {
      console.log('useAuth: Starting logout process...');
      setIsLoading(true);
      
      // Clear user immediately to prevent UI issues
      setUser(null);
      
      // Call auth service logout
      const result = await authService.signOut();
      
      if (result.success) {
        console.log('useAuth: Logout completed successfully');
        // Force a page reload to clear all state
        window.location.href = '/auth';
      } else {
        console.error('useAuth: Logout failed but continuing:', result.error);
        // Even if logout fails, still redirect to auth
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('useAuth: Logout error:', error);
      // Force redirect even on error
      window.location.href = '/auth';
    }
  }, []);

  useEffect(() => {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';

    if (isDemo) {
      // Fast-path for demo: no Supabase session involved
      authService.getCurrentUser()
        .then((u) => setUser(u))
        .finally(() => setIsLoading(false));
      // Also watch auth state changes (no-op unsubscribe for demo)
      const sub: any = authService.onAuthStateChange((u) => {
        console.log('useAuth: Demo user auth state changed:', u);
        setUser(u);
        setIsLoading(false);
      });
      return () => {
        try { (sub as any)?.data?.subscription?.unsubscribe?.(); } catch {}
      };
    }

    // Non-demo: use Supabase session manager and auth state
    const loadUser = async () => {
      try {
        const session = await sessionManager.initialize();
        if (session) {
          const current = await authService.getCurrentUser();
          setUser(current);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!sessionManager.isInitialized()) {
      loadUser();
    } else {
      // Already initialized; still try to fetch user once
      authService.getCurrentUser().then(setUser).finally(() => setIsLoading(false));
    }

    // Subscribe to Supabase session changes
    const unsubscribe = sessionManager.subscribe(async (session) => {
      console.log('useAuth: Session changed:', !!session);
      if (session) {
        const current = await authService.getCurrentUser();
        setUser(current);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Also subscribe to auth state (covers token refresh/user updates)
    const sub: any = authService.onAuthStateChange((u) => {
      console.log('useAuth: Auth state changed:', !!u);
      setUser(u);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      try { (sub as any)?.data?.subscription?.unsubscribe?.(); } catch {}
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    }
  };
}
