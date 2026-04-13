// API configuration utility
// This handles the API base URL for different environments

interface ApiConfig {
  baseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const getApiConfig = (): ApiConfig => {
  // In development, use the separate dev server
  // In production, API routes are served from the same domain
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  return {
    baseUrl,
    isDevelopment,
    isProduction,
  };
};

const apiConfig = getApiConfig();

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (apiConfig.isDevelopment) {
    // Development: use full URL to dev server
    return `${apiConfig.baseUrl}/${cleanEndpoint}`;
  } else {
    // Production: use relative path (same domain)
    return `/${cleanEndpoint}`;
  }
};

// Convenient API client
export const api = {
  // GET request
  get: async (endpoint: string) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API GET ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  },

  // POST request
  post: async (endpoint: string, data?: unknown) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API POST ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  },

  // PUT request
  put: async (endpoint: string, data?: unknown) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API PUT ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  },

  // DELETE request
  delete: async (endpoint: string) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`API DELETE ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  },
};

export { apiConfig };
