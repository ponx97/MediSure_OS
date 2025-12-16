// services/api.ts

const API_BASE_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

export const api = {
  get: async (endpoint: string) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        // keep backend error message if present
        console.error("API GET error:", response.status, data);
        return null;
      }

      return data;
    } catch (error: any) {
      if (
        error?.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.warn(
          `[Mock Mode] Backend unavailable for GET ${endpoint}. Using local data.`,
        );
        return null;
      }
      console.error("Fetch error:", error);
      return null;
    }
  },

  post: async (endpoint: string, body: any) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        console.error("API POST error:", response.status, data);
        return null;
      }

      return data;
    } catch (error: any) {
      if (
        error?.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.warn(
          `[Mock Mode] Backend unavailable. Simulating success for POST ${endpoint}`,
        );
        return null;
      }
      console.error("Fetch error:", error);
      return null;
    }
  },

  put: async (endpoint: string, body: any) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        console.error("API PUT error:", response.status, data);
        return null;
      }

      return data;
    } catch (error: any) {
      if (
        error?.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.warn(
          `[Mock Mode] Backend unavailable. Simulating success for PUT ${endpoint}`,
        );
        return null;
      }
      console.error("Fetch error:", error);
      return null;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        console.error("API DELETE error:", response.status, data);
        return null;
      }

      return data;
    } catch (error: any) {
      if (
        error?.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.warn(
          `[Mock Mode] Backend unavailable. Simulating success for DELETE ${endpoint}`,
        );
        return null;
      }
      console.error("Fetch error:", error);
      return null;
    }
  },
};
