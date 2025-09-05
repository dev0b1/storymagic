import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set - using demo mode');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set - using demo mode');
}

export const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function getBearer(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) return token;
  return null;
}

function getDemoUserId(req: Request): string | null {
  return req.headers.get('x-demo-user-id') || req.headers.get('x-user-id');
}

// Create a demo user object that matches Supabase user structure
function createDemoUser(userId: string) {
  return {
    id: userId,
    email: userId.includes('@') ? userId : `${userId}@demo.com`,
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function requireSupabaseUser(req: Request) {
  // First try demo user (for development/testing)
  const demoUserId = getDemoUserId(req);
  if (demoUserId) {
    console.log('Using demo user:', demoUserId);
    return createDemoUser(demoUserId);
  }
  
  // Then try Supabase auth
  const token = getBearer(req);
  if (!token || !supabaseAdmin) {
    console.log('No token or supabase admin client');
    return null;
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      console.log('Supabase auth failed:', error?.message);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Supabase auth error:', error);
    return null;
  }
}


