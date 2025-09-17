// src/api/axiosInstance.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:7071/api"; // ✅ single source

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or from cookies
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});