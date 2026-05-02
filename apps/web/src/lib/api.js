// API client helper for making requests to the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (err) => {
  refreshSubscribers.forEach((cb) => cb(err));
  refreshSubscribers = [];
};

const customFetch = async (url, options = {}, { isFormData = false } = {}) => {
  const headers = isFormData
    ? { ...options.headers } // browser sets multipart boundary
    : { 'Content-Type': 'application/json', ...options.headers };

  const finalOptions = {
    ...options,
    credentials: 'include',
    headers,
  };

  let response = await fetch(`${API_URL}${url}`, finalOptions);

  if (response.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          isRefreshing = false;
          onRefreshed(null);
          response = await fetch(`${API_URL}${url}`, finalOptions);
        } else {
          isRefreshing = false;
          const error = new Error('Session expired');
          error.status = 401;
          onRefreshed(error);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw error;
        }
      } catch (error) {
        isRefreshing = false;
        onRefreshed(error);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (err) => {
          if (err) return reject(err);
          try {
            const retryRes = await fetch(`${API_URL}${url}`, finalOptions);
            resolve(retryRes);
          } catch (retryErr) {
            reject(retryErr);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = text;
    try {
      const parsed = JSON.parse(text);
      errorMsg = parsed.error || parsed.message || text;
    } catch (e) {}
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return {};
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const api = {
  get: (path) => customFetch(path, { method: 'GET' }),
  post: (path, body) => customFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => customFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => customFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => customFetch(path, { method: 'DELETE' }),
  upload: (path, formData, { method = 'POST' } = {}) => customFetch(path, { method, body: formData }, { isFormData: true }),
};
