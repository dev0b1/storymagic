// Simple auth service for Next.js compatibility

export const authService = {
  async getCurrentUser() {
    // This would normally get the current user
    // In the Next.js version, we use Supabase auth instead
    return null;
  },
  
  async signOut() {
    // This would handle sign out
    // In the Next.js version, we use the AuthContext instead
    return;
  }
};
