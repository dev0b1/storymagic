import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface SessionStore {
  session: Session | null;
  initialized: boolean;
}

const defaultState: SessionStore = {
  session: null,
  initialized: false,
};

let store = { ...defaultState };
let listeners: ((session: Session | null) => void)[] = [];

export const sessionManager = {
  getSession: () => store.session,
  
  isInitialized: () => store.initialized,

  subscribe: (callback: (session: Session | null) => void) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(listener => listener !== callback);
    };
  },

  initialize: async () => {
    if (store.initialized) return store.session;

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      store = {
        session,
        initialized: true,
      };

      // Setup auth state change subscription
      supabase.auth.onAuthStateChange((_event, session) => {
        store.session = session;
        listeners.forEach(listener => listener(session));
      });

      return session;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      store.initialized = true;
      return null;
    }
  },

  setSession: (session: Session | null) => {
    store.session = session;
    listeners.forEach(listener => listener(session));
  },

  clearSession: () => {
    console.log('SessionManager: Clearing session and resetting state');
    store = { 
      session: null,
      initialized: false // Reset initialization state
    };
    // Notify all listeners that session is cleared
    listeners.forEach(listener => {
      try {
        listener(null);
      } catch (error) {
        console.warn('SessionManager: Error notifying listener during clearSession:', error);
      }
    });
  },
};
