import axios from 'axios';
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
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// In-memory token — set immediately after login so next request has it
let memoryToken: string | null = null;

export function setAccessToken(token: string | null) {
  memoryToken = token;
}

// Read access_token: memory first, then cookie fallback
function getAccessToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Request interceptor — attach Bearer token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// biome-ignore lint/suspicious/noExplicitAny: error type unknown
let refreshPromise: Promise<any> | null = null;

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Don't auto-refresh if user just logged out
      if (
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('logged_out') === 'true'
      ) {
        sessionStorage.removeItem('logged_out');
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              '/api/v1/auth/refresh',
              {},
              { withCredentials: true, timeout: 10000 }
            )
            .then((r) => r.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const data = await refreshPromise;
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          if (typeof document !== 'undefined') {
            const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
            // biome-ignore lint/suspicious/noDocumentCookie: required for Edge middleware access
            document.cookie = `access_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=604800; SameSite=Strict${secureFlag}`;
          }
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !isAuthEndpoint && !isPublicRoute(window.location.pathname)) {
          sessionStorage.setItem('logged_out', 'true');
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
          data?.error ??
          data?.message ??
          'Something went wrong. Please try again.';
      }
    }
    return Promise.reject(error);
  }
);
