import axios, { AxiosError, type AxiosRequestConfig } from "axios";

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(`API Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // send cookies (JWT auth)
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Response Interceptor — 401 token refresh ─────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

// Auth endpoints must never trigger the refresh flow.
const AUTH_PATHS = [
  "/api/auth/login/",
  "/api/auth/refresh/",
  "/api/auth/google/",
  "/api/auth/logout/",
];

function isAuthPath(url?: string) {
  return !!url && AUTH_PATHS.some((path) => url.includes(path));
}

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthPath(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/api/auth/refresh/");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Redirect to login if refresh also failed
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.replace("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise to ApiError
    const status = error.response?.status ?? 0;
    const body =
      (error.response?.data as Record<string, unknown> | undefined) ?? {};
    return Promise.reject(new ApiError(status, body));
  },
);

// ─── Typed Fetcher ────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  config: AxiosRequestConfig = {},
): Promise<T> {
  try {
      const response = await apiClient<T>(path, config);
      return response.data;
  } catch (error) {
    throw error
  }
}

// ─── FormData Upload (no Content-Type override) ───────────────────────────────

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await apiClient.post<T>(path, formData, {
    headers: { "Content-Type": undefined }, // let browser set multipart boundary
  });
  return response.data;
}

export default apiClient;

// ─── Error Message Helper ─────────────────────────────────────────────────────

function messageFromValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const messages = value.filter((item) => typeof item === "string");
    if (messages.length > 0) return messages.join(" ");
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Service errors use `detail` as a list; field errors use arrays too.
    const detail = messageFromValue(error.body.detail);
    if (detail) return detail;

    const nonField = messageFromValue(error.body.non_field_errors);
    if (nonField) return nonField;

    for (const value of Object.values(error.body)) {
      const message = messageFromValue(value);
      if (message) return message;
    }

    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (error.status === 404) {
      return "This resource could not be found.";
    }
  }

  return "Something went wrong. Please try again.";
}

/**
 * Per-field DRF validation messages, ready to merge into form error state.
 * Service-level errors (`detail`, `non_field_errors`) are left for the toast.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};

  const errors: Record<string, string> = {};
  for (const [field, value] of Object.entries(error.body)) {
    if (field === "detail" || field === "non_field_errors") continue;
    const message = messageFromValue(value);
    if (message) errors[field] = message;
  }
  return errors;
}
