
// NOTE: Change this URL to match your VPS IP or Domain in production
const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  get: async (endpoint: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        // Suppress network errors for demo/offline mode
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            console.warn(`[Mock Mode] Backend unavailable for ${endpoint}. Using local data.`);
            return null;
        }
        console.error('Fetch error:', error);
        return null;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            console.warn(`[Mock Mode] Backend unavailable. Simulating success for POST ${endpoint}`);
            return null;
        }
        console.error('Fetch error:', error);
        return null;
    }
  },

  put: async (endpoint: string, body: any) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            console.warn(`[Mock Mode] Backend unavailable. Simulating success for PUT ${endpoint}`);
            return null;
        }
        console.error('Fetch error:', error);
        return null;
    }
  },

  delete: async (endpoint: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            console.warn(`[Mock Mode] Backend unavailable. Simulating success for DELETE ${endpoint}`);
            return null;
        }
        console.error('Fetch error:', error);
        return null;
    }
  }
};
