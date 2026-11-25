/*
 * ============================================================
 * File Name     : api.js
 * Description   : Configures authenticated requests to the CodeMaster API.
 * Module        : Frontend Services
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const apiBaseURL = /\/api\/?$/.test(configuredApiUrl)
  ? configuredApiUrl.replace(/\/$/, "")
  : `${configuredApiUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("codemaster-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("codemaster-token")) {
      localStorage.removeItem("codemaster-token");
      window.dispatchEvent(new Event("codemaster:session-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
