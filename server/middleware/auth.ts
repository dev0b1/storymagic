import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';
import { db } from '../db';
import { User } from '@supabase/supabase-js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  try {
    // Verify the JWT token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      if (error.message.includes('expired')) {
        // Token expired, try to refresh
        const refreshToken = req.headers['x-refresh-token'];
        if (refreshToken) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken as string
          });
          
          if (refreshError || !refreshData.user) {
            return res.status(401).json({ 
              message: 'Session expired. Please log in again.',
              code: 'TOKEN_EXPIRED'
            });
          }
          
          // Successfully refreshed
          req.user = refreshData.user;
          // Send new tokens in response headers
          res.setHeader('x-new-access-token', refreshData.session?.access_token || '');
          res.setHeader('x-new-refresh-token', refreshData.session?.refresh_token || '');
          return next();
        }
      }
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Store user info for route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// Optional auth - allows both authenticated and anonymous access
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user;
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
  }

  next();
}

// Demo user middleware
export async function handleDemoUser(req: Request, res: Response, next: NextFunction) {
  const isDemoUser = req.headers['x-demo-user'] === 'true';
  
  if (isDemoUser) {
    req.user = {
      id: 'demo@gmail.com',
      email: 'demo@gmail.com',
      user_metadata: { name: 'Demo User' },
      app_metadata: { provider: 'demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'authenticated',
      phone: '',
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      factor_confirmed_at: null
    } as User;
  }
  
  next();
}
