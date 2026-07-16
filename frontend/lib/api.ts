import axios from 'axios';
import { decodeJwt } from 'jose';
import { isPublicRoute } from './public-routes';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.defaults.timeout = 30000;

export async function downloadCsv(url: string, filename = 'export.csv') {
  const previouslyFocused = document.activeElement as HTMLElement | null;
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const contentType = String(res.headers['content-type'] ?? '');
    if (!contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
      throw new Error('Unexpected response format');
    }
    const blob = new Blob([res.data], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    previouslyFocused?.focus();
  } catch (err) {
    previouslyFocused?.focus();
    const message =
      err instanceof Error
        ? err.message
        : 'Download failed. Please try again.';
    throw new Error(message);
  }
}

let accessTokenMemory: string | null = null;

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
}

function getAccessToken(): string | null {
  return accessTokenMemory;
}

// Track last returned access token from refresh to detect missing rotation
let lastRefreshAccessToken: string | null = null;

function checkTokenRotation(token: string) {
  if (token === lastRefreshAccessToken) {
    console.warn(
      '[Auth] Refresh returned same access token — refresh token may not be rotating',
    );
  }
  lastRefreshAccessToken = token;
}

// biome-ignore lint/suspicious/noExplicitAny: error type unknown
let refreshPromise: Promise<any> | null = null;

// Request interceptor — attach Bearer token, preemptively refresh if expired
api.interceptors.request.use(async (config) => {
  const token = getAccessToken();
  if (token) {
    try {
      const payload = decodeJwt(token);
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/v1/auth/refresh', {}, { withCredentials: true, timeout: 10000 })
            .then((r) => r.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const data = await refreshPromise;
        if (data.accessToken) {
          checkTokenRotation(data.accessToken);
          setAccessToken(data.accessToken);
          config.headers.Authorization = `Bearer ${data.accessToken}`;
        } else {
          const freshToken = getAccessToken();
          if (freshToken) {
            config.headers.Authorization = `Bearer ${freshToken}`;
          }
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      const freshToken = getAccessToken();
      if (freshToken) {
        config.headers.Authorization = `Bearer ${freshToken}`;
      }
    }
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/v1/auth/refresh', {}, { withCredentials: true, timeout: 10000 })
            .then((r) => r.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const data = await refreshPromise;
        if (data.accessToken) {
          checkTokenRotation(data.accessToken);
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch {
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !isAuthEndpoint &&
          !isPublicRoute(window.location.pathname)
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    // Normalize error
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.normalizedMessage = 'Request timed out. Please try again.';
      } else {
        error.normalizedMessage = 'Network error. Please check your connection.';
      }
    } else {
      const data = error.response?.data;
      if (typeof data === 'string') {
        error.normalizedMessage = data;
      } else {
        error.normalizedMessage =
          data?.error ?? data?.message ?? 'Something went wrong. Please try again.';
      }
    }
    return Promise.reject(error);
  }
);
