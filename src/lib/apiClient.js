// lib/apiClient.js — Client-side fetch helper with automatic JWT token attachment
export const apiClient = {
  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("skillswap_jwt_token");
  },

  setToken(token) {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("skillswap_jwt_token", token);
      else localStorage.removeItem("skillswap_jwt_token");
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "An error occurred");
    }
    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body: JSON.stringify(body) });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: "PATCH", body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },
};

export default apiClient;
