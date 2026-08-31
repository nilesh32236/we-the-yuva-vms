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

api.defaults.timeout = 10000;

export async function downloadCsv(url: string, filename = 'export.csv') {
  // NOTE (audit #203): low-level, intentionally UNGUARDED helper — it serves
  // multiple pages whose callers live inside the (coordinator), (org-admin)
  // and (admin) route groups, so proxy.ts already enforces the JWT role
  // prefix before any page (and therefore this call) renders. Authorization
  // for the underlying endpoints is enforced server-side
  // (e.g. /events/export/csv requires EVENT_MANAGE; the volunteers export
  // requires USER_VOLUNTEERS_MANAGE), including org/tenant scoping.
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
      (err as { normalizedMessage?: string })?.normalizedMessage ??
      (err instanceof Error ? err.message : 'Download failed. Please try again.');
    throw new Error(message);
  }
}

// The access token is held ONLY in memory for the SPA lifetime. It is never
// persisted to sessionStorage/localStorage so the raw bearer JWT is not
// readable by arbitrary JavaScript (XSS / extensions). Auth on reload is
// restored from the HttpOnly access_token cookie via credentialed requests.
let accessTokenMemory: string | null = null;

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
  // A non-null token means a fresh session/refresh succeeded — clear the flag.
  if (token) refreshFailed = false;
}

function getAccessToken(): string | null {
  return accessTokenMemory;
}

// Track last returned access token from refresh to detect missing rotation
let lastRefreshAccessToken: string | null = null;
let rotationWarningFired = false;

function checkTokenRotation(token: string) {
  if (token === lastRefreshAccessToken) {
    if (!rotationWarningFired) {
      rotationWarningFired = true;
      console.warn('[Auth] Refresh returned same access token — refresh token may not be rotating');
    }
  }
  lastRefreshAccessToken = token;
}

// Set when a preemptive refresh fails; the response interceptor skips its own
// refresh attempt and goes straight to /login, avoiding a duplicate round-trip.
let refreshFailed = false;

// biome-ignore lint/suspicious/noExplicitAny: error type unknown
let refreshPromise: Promise<any> | null = null;

// Request interceptor — attach Bearer token, preemptively refresh if expired
api.interceptors.request.use(async (config) => {
  // Fix for file uploads: when body is FormData, delete the default
  // 'Content-Type: application/json' so the browser can set
  // 'multipart/form-data; boundary=...' automatically. Without this,
  // multer on the backend sees 'application/json' and leaves req.file
  // undefined, triggering the 'No file provided' 400 (see upload.controller.ts:12).
  // This handles all upload call sites (FileUpload, ProofUploadForm,
  // register-organization) without requiring each to remember the header hack.
  if (config.data instanceof FormData && config.headers) {
    const h = config.headers as unknown as { delete?: (k: string) => void } & Record<string, unknown>;
    if (typeof h.delete === 'function') h.delete('Content-Type');
    else {
      delete h['Content-Type'];
      delete h['content-type'];
    }
  }

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
      // Preemptive refresh failed (network / 5xx). The in-memory token is
      // expired — do not re-attach it as Bearer, or the doomed request would
      // 401 and trigger a duplicate refresh in the response interceptor. Drop
      // it so follow-up requests go out cookie-authenticated (withCredentials).
      setAccessToken(null);
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
    const isLoggedOut =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('logged_out') === 'true';

    const redirectToLoginIfProtected = () => {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !isAuthEndpoint &&
        !isPublicRoute(window.location.pathname)
      ) {
        window.location.href = '/login';
      }
    };

    // Fail closed: if the user believes they logged out (even if the /auth/logout
    // POST failed), never mint a fresh token via /auth/refresh on a stale cookie.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isLoggedOut
    ) {
      originalRequest._retry = true;

      if (refreshFailed) {
        // A preemptive refresh already failed — don't attempt a duplicate
        // refresh round-trip; go straight to the login redirect.
        redirectToLoginIfProtected();
        return Promise.reject(error);
      }

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
          setAccessToken(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch {
        refreshFailed = true;
        redirectToLoginIfProtected();
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
          data?.error ?? data?.message ?? `Request failed (status ${error.response.status}). Please try again.`;
      }
    }
    return Promise.reject(error);
  }
);
