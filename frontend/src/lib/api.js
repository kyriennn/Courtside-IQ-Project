// Thin wrapper around fetch that:
// 1. Prepends the base API URL
// 2. Attaches the Clerk JWT as a Bearer token
// 3. Parses JSON and throws on non-2xx responses

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Pass getToken from Clerk's useAuth hook: const { getToken } = useAuth()
export async function apiFetch(path, options = {}, getToken = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (getToken) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
