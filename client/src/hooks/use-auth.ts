import { useState, useEffect } from 'react';
import { User, authService } from '@/lib/auth';
import { sessionManager } from '@/lib/session-manager';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!sessionManager.isInitialized());

  useEffect(() => {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';

    if (isDemo) {
      // Fast-path for demo: no Supabase session involved
      authService.getCurrentUser()
        .then((u) => setUser(u))
        .finally(() => setIsLoading(false));
      // Also watch auth state changes (no-op unsubscribe for demo)
      const sub: any = authService.onAuthStateChange((u) => setUser(u));
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
    refreshUser: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    }
  };
}
