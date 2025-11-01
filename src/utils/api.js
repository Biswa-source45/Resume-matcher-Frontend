import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || "https://resume-matcher-backend-zpt3.onrender.com";

async function getAuthToken() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = await getAuthToken();
  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type for FormData uploads (browser will set the correct boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? "same-origin", // use "include" if backend uses cookies
    ...options,
    headers,
  });

  // handle no-content
  if (res.status === 204) return null;

  // parse response safely
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error(body?.message || res.statusText || "API error");
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export const api = {
  // GET /summaries (protected)
  async getSummaries() {
    return request("/summaries", { method: "GET" });
  },

  // POST /resumes/analyze (file upload)
  async analyzeResume(file) {
    const form = new FormData();
    form.append("resume", file);
    return request("/resumes/analyze", {
      method: "POST",
      body: form,
      // DO NOT set Content-Type for FormData
    });
  },

  // helper to fetch analysis by id
  async getAnalysisById(id) {
    return request(`/analysis/${encodeURIComponent(id)}`, { method: "GET" });
  },

  // generic request pass-through
  raw(path, opts) {
    return request(path, opts);
  },
};

export default api;