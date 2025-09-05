"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Define the type of values the context will store
type AuthContextType = {
  user: User | null;
  demoUser: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setDemoUser: (email: string | null) => void;
};

// Create the context (empty at first)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component wraps the app and gives access to the context
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setDemoUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, demoUser, loading, signOut, setDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper hook for using the context anywhere
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
