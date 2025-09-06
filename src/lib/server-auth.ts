import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getBearer(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) return token;
  return null;
}

export async function requireSupabaseUser(req: Request) {
  const token = getBearer(req);
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      throw new Error(`Authentication failed: ${error?.message || 'Invalid token'}`);
    }
    return data.user;
  } catch (error) {
    console.error('Supabase auth error:', error);
    throw new Error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


