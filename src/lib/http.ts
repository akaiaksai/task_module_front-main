// lib/http.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const stripWrappingQuotes = (value: string) =>
  value.trim().replace(/^["']|["']$/g, '');

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/g, '');

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const API_BASE = stripWrappingQuotes(import.meta.env.VITE_API_BASE || '');
const API_PREFIX = trimSlashes(
  stripWrappingQuotes(import.meta.env.VITE_API_PREFIX || '')
);

const buildBaseUrl = () => {
  const cleanBase = trimTrailingSlashes(API_BASE);

  if (cleanBase) {
    return API_PREFIX ? `${cleanBase}/${API_PREFIX}` : cleanBase;
  }

  return API_PREFIX ? `/${API_PREFIX}` : '';
};

const API_ROOT = buildBaseUrl();

export const http = axios.create({
  baseURL: API_ROOT || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      const currentPath = window.location.pathname;

      if (currentPath === '/login') {
        return Promise.reject(err);
      }

      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
