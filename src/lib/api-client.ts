import { supabase } from "@/lib/supabase"; // adjust import if needed

interface ApiClientOptions {
  user?: { id: string } | null;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const { user } = options;

  // Helper: fetch latest session and prepare headers
  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // add custom user header if provided
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }

    // add supabase access token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  return {
    // ✅ GET requests
    async get(url: string, init?: RequestInit) {
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        ...init,
        headers: {
          ...headers,
          ...(init?.headers || {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Network error" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },

    // ✅ POST requests
    async post(url: string, data: any, init?: RequestInit) {
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        ...init,
        method: "POST",
        headers: {
          ...headers,
          ...(init?.headers || {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Network error" }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
  };
}
