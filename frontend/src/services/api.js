import axios from "axios";
import { supabase } from "./supabase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Token is kept in sync by AuthContext via setAccessToken().
// This avoids calling supabase.auth.getSession() on every request,
// which can hang when the token is expired and an internal refresh lock is held.
let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let isHandling401 = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isHandling401) {
      isHandling401 = true;
      try {
        await supabase.auth.signOut();
        // queryClient is set externally via setQueryClient
        if (api._queryClient) {
          api._queryClient.clear();
        }
        window.location.href = "/login";
      } finally {
        isHandling401 = false;
      }
    }
    return Promise.reject(error);
  },
);

// Allow setting the query client from main.jsx
export const setQueryClient = (qc) => {
  api._queryClient = qc;
};

export default api;
