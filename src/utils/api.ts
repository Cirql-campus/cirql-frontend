import { captureFrontendException } from './monitoring';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
const BASE_URL = `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;

interface FetchOptions extends RequestInit {
  isFormData?: boolean;
  timeoutMs?: number;
}

let isRefreshing = false;
let refreshSubscribers: ((error: unknown) => void)[] = [];

const onRefreshed = (error: unknown) => {
  refreshSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (error: unknown) => void) => {
  refreshSubscribers.push(callback);
};

export const getApiOrigin = () => API_ORIGIN.replace(/\/$/, '');

export const getErrorMessage = (err: unknown, fallback = 'Something went wrong') => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const getValidationMessage = (data: Record<string, unknown>, message?: string) => {
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const firstError = errors.find((entry): entry is { field?: string; message?: string } => (
    typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as { message?: unknown }).message === 'string'
  ));

  if (firstError?.message) {
    return firstError.field ? `${firstError.field}: ${firstError.message}` : firstError.message;
  }

  return message || 'Some information looks invalid. Please check and try again.';
};

const getFriendlyErrorMessage = (status: number, data: Record<string, unknown>) => {
  const message = typeof data.message === 'string' ? data.message : undefined;
  if (status === 422) return getValidationMessage(data, message);
  if (status === 400) return message || 'Some information looks invalid. Please check and try again.';
  if (status === 401) return message || 'Please log in again to continue.';
  if (status === 403) return message || 'You do not have permission for this action.';
  if (status === 404) return message || 'We could not find what you were looking for.';
  if (status === 409) return message || 'This action conflicts with existing data.';
  if (status === 413) return 'The upload is too large. Please choose a smaller file.';
  if (status === 429) return message || 'Too many attempts. Please wait a little and try again.';
  if (status === 503 || status === 504) return message || 'Server is busy or taking too long. Please try again.';
  if (status >= 500) return 'Something went wrong on the server. Please try again shortly.';
  return message || 'API request failed';
};

const readJsonSafely = async (response: Response): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const fetchAPI = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  const timeoutMs = options.timeoutMs ?? (options.isFormData ? 60000 : 25000);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  
  // Only set Content-Type to JSON if it is NOT FormData
  if (!options.isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
    signal: options.signal || controller.signal,
  };

  let response: Response;
  let data: Record<string, unknown>;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
    data = await readJsonSafely(response);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      captureFrontendException(err, { endpoint, timeoutMs });
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    captureFrontendException(err, { endpoint });
    throw new Error('Could not connect to the server. Please check your internet and try again.');
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status >= 500) {
      captureFrontendException(new Error(`API ${response.status}: ${endpoint}`), {
        endpoint,
        status: response.status,
        message: data.message,
      });
    }
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          const refreshData = await readJsonSafely(refreshRes);
          if (!refreshRes.ok) throw new Error(getFriendlyErrorMessage(refreshRes.status, refreshData));
          if (typeof refreshData.accessToken === 'string') {
            localStorage.setItem('cirql_token', refreshData.accessToken);
          }
          
          isRefreshing = false;
          onRefreshed(null);
          // Retry the original request
          return fetchAPI<T>(endpoint, options);
        } catch (err) {
          isRefreshing = false;
          onRefreshed(err);
          // Force logout redirect on full session expiry, prevent loop
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new Error('Session expired');
        }
      } else {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((err) => {
            if (err) return reject(err);
            resolve(fetchAPI<T>(endpoint, options));
          });
        });
      }
    }
    throw new Error(getFriendlyErrorMessage(response.status, data));
  }

  return data as T;
};

// Typed quick helpers
export const api = {
  get: <T>(endpoint: string) => fetchAPI<T>(endpoint),
  
  post: <T, TBody = unknown>(endpoint: string, body: TBody, isFormData = false) => 
    fetchAPI<T>(endpoint, { 
      method: 'POST', 
      body: isFormData ? body as BodyInit : JSON.stringify(body),
      isFormData
    }),
    
  put: <T, TBody = unknown>(endpoint: string, body: TBody, isFormData = false) => 
    fetchAPI<T>(endpoint, { 
      method: 'PUT', 
      body: isFormData ? body as BodyInit : JSON.stringify(body),
      isFormData
    }),

  patch: <T, TBody = unknown>(endpoint: string, body: TBody, isFormData = false) =>
    fetchAPI<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body as BodyInit : JSON.stringify(body),
      isFormData
    }),
    
  delete: <T>(endpoint: string) => 
    fetchAPI<T>(endpoint, { method: 'DELETE' })
};
