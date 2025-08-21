import { ReactNode, useEffect, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { sessionManager } from '@/lib/session-manager';
import { useAuth } from '@/hooks/use-auth';

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
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';

  useEffect(() => {
    // Initialize session on mount for non-demo; demo users skip Supabase session init
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_user') === 'true';
    if (isDemo) {
      setIsChecking(false);
      return;
    }
    sessionManager.initialize().then(() => {
      setIsChecking(false);
    });
  }, []);

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
  if (!requireAuth && user) {
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
