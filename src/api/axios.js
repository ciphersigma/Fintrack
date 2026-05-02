import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach Google credential token to every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("fintrack_user");
    if (stored) {
      const { credential } = JSON.parse(stored);
      if (credential) {
        config.headers.Authorization = `Bearer ${credential}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

// On 401, clear stored user and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fintrack_user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
