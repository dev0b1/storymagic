export async function buildAuthHeaders(opts?: { userId?: string; includeContentType?: boolean }) {
  const headers: Record<string, string> = {};

  const includeContentType = opts?.includeContentType ?? true;
  if (includeContentType) headers['Content-Type'] = 'application/json';

  // No demo users supported. Only attach Supabase session headers when available.

  // Resolve user id (prefer explicit, then auth service, then localStorage, then 'demo')
  try {
    const { authService } = await import('@/lib/auth');
    const user = await authService.getCurrentUser();
  headers['x-user-id'] = opts?.userId || user?.id || localStorage.getItem('userId') || '';
  } catch (e) {
    headers['x-user-id'] = opts?.userId || localStorage.getItem('userId') || 'demo';
  }

  // Best-effort: attach supabase session tokens when available and not demo
  if (true) {
    try {
      const supabaseModule = await import('@/lib/supabase');
      if (supabaseModule.isSupabaseConfigured) {
        const { supabase } = supabaseModule;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          if (session.refresh_token) headers['x-refresh-token'] = session.refresh_token;
        }
      }
    } catch (e) {
      // ignore - best-effort only
    }
  }

  return headers;
}
