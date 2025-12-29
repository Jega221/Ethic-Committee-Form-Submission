// frontend/src/lib/api.ts
import axios from "axios";

// 1) Read the base URL from Vite env
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

// Optional sanity check
if (!API_BASE_URL) {
  console.warn(
    "VITE_API_BASE_URL is not defined. Check your frontend .env file."
  );
}

// 2) Generic fetch helper (for simple requests)
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

// 4) Axios instance (for advanced requests like file upload)
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically add token to axios requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("userProfile");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 5) Login helper
export async function login(email: string, password: string) {
  return authRequest<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// 6) Create application helper
export async function createApplication(payload: FormData) {
  return api.post("/api/applications", payload);
}

// 7) Get researcher applications
export async function getResearcherApplications(userId: string | number) {
  return api.get(`/api/applications/researcher/${userId}`);
}

// 8) Get all applications (for Faculty/Committee)
export async function getAllApplications() {
  return api.get('/api/applications');
}

// 9) Process Application (Approve/Reject)
export async function processApplication(applicationId: string | number, action: string, comment?: string) {
  return api.post('/api/process', { application_id: String(applicationId), action, comment });
}

// 10) Update Application Status (Approve/Reject/Revision with comments)
export async function updateApplicationStatus(applicationId: string | number, payload: { status: string, comment?: string, committee_id?: number }) {
  return api.patch(`/api/applications/${applicationId}/status`, payload);
}

// 11) Super Admin: User Management
export async function getUsers() {
  return api.get('/api/getData/users');
}

export async function createUser(data: { name: string, email: string, role: string }) {
  return api.post('/api/admin/users', data);
}

export async function deleteUser(id: string | number) {
  return api.delete(`/api/admin/users/${id}`);
}

// 12) Super Admin: Faculty Management
export async function getFaculties() {
  return api.get('/api/getData/faculty');
}

export async function createFaculty(name: string) {
  return api.post('/api/faculty', { faculty_name: name });
}

export async function updateFaculty(id: string | number, name: string) {
  return api.put(`/api/faculty/${id}`, { name });
}

export async function deleteFaculty(id: string | number) {
  return api.delete(`/api/faculty/${id}`);
}

// 12a) Public Faculty List (for Signup)
export async function getPublicFaculties() {
  return apiRequest<{ id: number; name: string }[]>('/api/faculty', {
    method: 'GET'
  });
}

// 13) Super Admin: Workflow Management
export async function getWorkflows() {
  return api.get('/api/workflow');
}

export async function createWorkflow(data: any) {
  return api.post('/api/workflow', data);
}

export async function setCurrentWorkflow(id: string | number) {
  return api.put(`/api/workflow/${id}/set-current`);
}

export async function updateWorkflow(id: string | number, data: any) {
  return api.put(`/api/workflow/${id}`, data);
}

export async function deleteWorkflow(id: string | number) {
  return api.delete(`/api/workflow/${id}`);
}

// 14) User Role & Faculty Management
export async function setUserRole(userId: string | number, roleId: string | number) {
  return api.put('/api/Role/setRole', { id: userId, role_id: roleId });
}

export async function setUserFaculty(userId: string | number, facultyId: string | number) {
  return api.put('/api/Role/setFaculty', { id: userId, faculty_id: facultyId });
}

// 15) Notifications
export async function getUserNotifications(userId: string | number) {
  return api.get(`/api/notifications/${userId}`);
}

export async function markNotificationAsRead(id: string | number) {
  return api.patch(`/api/notifications/${id}/read`);
}