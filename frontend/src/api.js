const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const request = async (path, options = {}, canRefresh = true) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (response.status === 401 && canRefresh && !path.startsWith("/auth/")) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    if (refreshed.ok) return request(path, options, false);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed. Please try again.");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const api = {
  get: (path) => request(path),
  post: (path, body = {}) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" })
};
