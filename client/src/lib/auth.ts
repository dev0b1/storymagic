// Simple auth service to replace Supabase
export interface User {
  id: string;
  email: string;
  name?: string;
  isPremium?: string;
  storiesGenerated?: string;
}

export const authService = {
  getCurrentUser(): User | null {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (!userId || !userEmail) return null;
    
    return {
      id: userId,
      email: userEmail,
      name: userName || undefined
    };
  },

  async signInWithMagicLink(email: string) {
    // In a real app, this would send an email
    // For now, we'll create a user directly
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: email.split('@')[0] })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sign in');
    }
    
    const user = await response.json();
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name || '');
    
    return { success: true };
  },

  async signOut() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    // Simple implementation - check localStorage
    const user = this.getCurrentUser();
    callback(user);
    
    // Return cleanup function
    return () => {};
  }
};