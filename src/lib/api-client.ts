// API client with authentication headers

interface ApiClientOptions {
  user?: { id: string } | null;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const { user } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  // Add user ID header if available
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }
  
  return {
    async post(url: string, data: any) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    
    async get(url: string) {
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
  };
}
