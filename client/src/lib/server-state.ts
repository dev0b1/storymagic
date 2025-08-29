// Utility to detect server restarts and clear stale authentication data
export const serverStateManager = {
  // Store server start timestamp to detect restarts
  setServerStartTime(timestamp: string) {
    localStorage.setItem('server-start-time', timestamp);
  },

  getServerStartTime(): string | null {
    return localStorage.getItem('server-start-time');
  },

  clearServerStartTime() {
    localStorage.removeItem('server-start-time');
  },

  // Check if server has restarted by comparing timestamps
  async hasServerRestarted(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 1500);

      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'x-quick-check': 'true' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return true; // Server not responding properly
      }

      const healthData = await response.json();
      const serverUptime = healthData.server?.uptime;
      
      if (typeof serverUptime === 'number') {
        const storedStartTime = this.getServerStartTime();
        const currentServerStart = Date.now() - (serverUptime * 1000);
        
        // If we have a stored start time and it's significantly different, server restarted
        if (storedStartTime) {
          const timeDiff = Math.abs(currentServerStart - parseInt(storedStartTime));
          if (timeDiff > 30000) { // 30 seconds difference indicates restart
            console.log('Server restart detected');
            this.setServerStartTime(currentServerStart.toString());
            return true;
          }
        } else {
          // First time, just store the start time
          this.setServerStartTime(currentServerStart.toString());
        }
      }

      return false;
    } catch (error: unknown) {
      // Check if it's an abort error (timeout) or actual server error
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log('Server connectivity check timed out');
      } else {
        console.log('Server connectivity check failed:', error);
      }
      return true; // Assume restart if we can't reach server
    }
  },

  // Clear only authentication-related data (selective clearing)
  async clearAuthenticationData() {
    console.log('Clearing authentication data due to server state change...');
    
    // Define specific keys that are safe to remove (authentication-related only)
    const authKeysToRemove = [
      'demo_user',
      'userId', 
      'userEmail',
      'userName',
      'is_premium',
      'stories_generated',
      'subscription_status'
    ];
    
    // Remove specific auth keys from localStorage
    authKeysToRemove.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        console.log(`Removing auth key: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Clear auth redirect paths
    sessionStorage.removeItem('redirectAfterAuth');
    
    // Clear Supabase session data (be more selective)
    const supabaseKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('.auth.token') ||
        key.includes('.auth.user') ||
        key.includes('.auth.session')
      )) {
        supabaseKeysToRemove.push(key);
      }
    }
    
    if (supabaseKeysToRemove.length > 0) {
      console.log(`Removing ${supabaseKeysToRemove.length} Supabase keys:`, supabaseKeysToRemove);
      supabaseKeysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    // Clear Supabase session data from sessionStorage
    const sessionSupabaseKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('.auth.token') ||
        key.includes('.auth.user') ||
        key.includes('.auth.session')
      )) {
        sessionSupabaseKeysToRemove.push(key);
      }
    }
    
    if (sessionSupabaseKeysToRemove.length > 0) {
      console.log(`Removing ${sessionSupabaseKeysToRemove.length} Supabase session keys:`, sessionSupabaseKeysToRemove);
      sessionSupabaseKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
    
    // Clear session manager state
    try {
      const { sessionManager } = await import('./session-manager');
      sessionManager.clearSession();
    } catch (error) {
      console.warn('Failed to clear session manager:', error);
    }
    
    console.log('Authentication data cleared successfully (selective clearing)');
  },
  
  // Add a method to validate if clearing is actually needed
  shouldClearAuthData(): boolean {
    const hasAuthData = (
      localStorage.getItem('demo_user') === 'true' ||
      localStorage.getItem('userId') !== null ||
      this.hasSupabaseSession()
    );
    
    console.log('Auth data check:', {
      hasDemo: localStorage.getItem('demo_user') === 'true',
      hasUserId: localStorage.getItem('userId') !== null,
      hasSupabaseSession: this.hasSupabaseSession(),
      shouldClear: hasAuthData
    });
    
    return hasAuthData;
  },
  
  // Check if there's any Supabase session data
  hasSupabaseSession(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') ||
        key.includes('.auth.token') ||
        key.includes('.auth.session')
      )) {
        return true;
      }
    }
    return false;
  }
};
