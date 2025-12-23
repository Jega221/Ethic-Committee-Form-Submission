// src/lib/api.ts

// 1) Read the base URL from Vite env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Optional sanity check (this will NOT cause the TDZ error)
if (!API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL is not defined. Check your frontend .env file."
  );
}

// 2) Generic request helper
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Request failed: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// 3) Authenticated helper (adds token if present)
export async function authRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  return apiRequest<T>(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
