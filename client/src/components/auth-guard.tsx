import { ReactNode, useEffect, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { sessionManager } from '@/lib/session-manager';
import { useAuth } from '@/hooks/use-auth';
import { serverStateManager } from '@/lib/server-state';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';

  // Check if we're on the auth callback route
  const isAuthCallback = typeof window !== 'undefined' && window.location.pathname === '/auth/callback';

  useEffect(() => {
    // Skip all initialization logic for auth callback route
    if (isAuthCallback) {
      console.log('AuthGuard: Skipping initialization for auth callback route');
      setIsChecking(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        // Check for server restart and clear stale data if needed
        const serverRestarted = await serverStateManager.hasServerRestarted();
        if (serverRestarted && serverStateManager.shouldClearAuthData()) {
          console.log('AuthGuard: Server restart detected with authentication data, clearing selectively');
          await serverStateManager.clearAuthenticationData();
          
          // Force refresh to ensure clean state
          if (!requireAuth) {
            // If we're on a public page, just clear and continue
            setIsChecking(false);
            return;
          } else {
            // If we're on a protected page, redirect to auth
            setIsChecking(false);
            return;
          }
        } else if (serverRestarted) {
          console.log('AuthGuard: Server restart detected but no authentication data to clear');
        }
        
        // Initialize session on mount for non-demo; demo users skip Supabase session init
        const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';
        if (isDemo) {
          setIsChecking(false);
          return;
        }
        
        console.log('AuthGuard: Initializing session manager...');
        await sessionManager.initialize();
        console.log('AuthGuard: Session manager initialized');
        setIsChecking(false);
      } catch (error) {
        console.error('AuthGuard: Failed to initialize session:', error);
        
        // If initialization fails, it might be due to stale data
        console.log('AuthGuard: Clearing potentially stale data and retrying...');
        await serverStateManager.clearAuthenticationData();
        
        setInitializationError(error instanceof Error ? error.message : 'Authentication initialization failed');
        setIsChecking(false);
      }
    };

    initializeAuth();
  }, [requireAuth, isAuthCallback]);

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{initializationError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Handle authentication requirement
  if (requireAuth && !user && !isDemo) {
    // Store the attempted URL to redirect back after login
    const currentPath = window.location.pathname;
    if (currentPath !== '/auth') {
      sessionStorage.setItem('redirectAfterAuth', currentPath);
    }
    return <Redirect to={redirectTo} />;
  }

  // Handle authenticated users trying to access auth pages
  if (!requireAuth && user && !isAuthCallback) {
    // Get stored redirect path or default to dashboard
    const redirectPath = sessionStorage.getItem('redirectAfterAuth') || '/dashboard';
    sessionStorage.removeItem('redirectAfterAuth'); // Clear stored path
    return <Redirect to={redirectPath} />;
  }

  return <>{children}</>;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function WithAuthComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}
