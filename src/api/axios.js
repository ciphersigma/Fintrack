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

// On 401, only force logout if it's a persistent failure
let authFailCount = 0;
api.interceptors.response.use(
  (response) => {
    authFailCount = 0; // reset on success
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      authFailCount++;
      // Only force logout after 3 consecutive auth failures
      // This gives silent refresh time to work
      if (authFailCount >= 3) {
        authFailCount = 0;
        localStorage.removeItem("fintrack_user");
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
