// Utility functions for handling request headers in Next.js

export function getAuthHeader(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  return authHeader;
}

export function getBearerToken(req: Request): string | null {
  const authHeader = getAuthHeader(req);
  if (!authHeader) return null;
  
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }
  
  return null;
}

export function getUserIdFromHeaders(req: Request): string | null {
  return req.headers.get('x-user-id') || null;
}

export function getClientIP(req: Request): string | null {
  // Try various headers for client IP
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || 
         null;
}

// Build auth headers for API requests
export async function buildAuthHeaders(options?: { userId?: string }): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (options?.userId) {
    headers['x-user-id'] = options.userId;
  }
  
  return headers;
}
