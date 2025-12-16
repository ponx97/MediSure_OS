// Relative URL to leverage the proxy set up in vite.config.ts
const API_BASE_URL = '/api';

interface ApiConfig extends RequestInit {
  headers?: Record<string, string>;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Helpers
const getToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access: string, refresh?: string) => {
  if (access) localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
};
const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const handleResponse = async (response: Response) => {
  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || response.statusText || 'Unknown Error';
    throw new Error(errorMsg);
  }
  
  return data;
};

// Main request function
const request = async (endpoint: string, options: ApiConfig = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 / Token Refresh
    if (response.status === 401) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuth();
        // Only reload if we are not already on the login page/booting
        if (window.location.pathname !== '/') {
             window.location.reload(); 
        }
        throw new Error('Session expired');
      }

      // Attempt Refresh
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json() as TokenResponse;
          // Robust check for accessToken
          const newAccessToken = data.accessToken || (data as any).token;
          
          if (newAccessToken) {
            setTokens(newAccessToken, data.refreshToken);
            
            // Retry original request with new token
            if (config.headers) {
                config.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
            response = await fetch(`${API_BASE_URL}${endpoint}`, config);
          } else {
             throw new Error('No access token returned from refresh');
          }
        } else {
          // Refresh failed
          clearAuth();
          window.location.reload();
          throw new Error('Session expired');
        }
      } catch (refreshError) {
        clearAuth();
        window.location.reload();
        throw refreshError;
      }
    }

    return await handleResponse(response);
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
