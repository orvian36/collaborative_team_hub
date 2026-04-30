// API client helper for making requests to the backend
// TODO: Implement with fetch, handle auth tokens, error handling

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  post: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  put: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  delete: async (path) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
