// ...existing code...
import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || "https://resume-matcher-backend-zpt3.onrender.com";

async function getSupabaseAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = await getSupabaseAccessToken();
  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type for FormData uploads
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Attach bearer token as fallback (cookie auth preferred)
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? "include",
    ...options,
    headers,
  });

  // handle no-content
  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const err = new Error(body?.detail || body?.message || (typeof body === "string" ? body : res.statusText) || "API error");
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export const api = {
  async setCookie(sessionOrData) {
    const payload = {
      access_token: sessionOrData?.access_token ?? sessionOrData?.session?.access_token,
      refresh_token: sessionOrData?.refresh_token ?? sessionOrData?.session?.refresh_token,
      user: sessionOrData?.user ?? sessionOrData?.session?.user,
    };
    return request("/set-cookie", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async logout() {
    // clear backend cookie
    return request("/logout", { method: "POST" });
  },

  async getSummaries() {
    return request("/summaries", { method: "GET" });
  },

  async analyzeResume(file) {
    const form = new FormData();
    form.append("file", file); 
    return request("/analyze-resume", {
      method: "POST",
      body: form,
    });
  },

  // NEW: send chat message to backend /chat
  async sendChatMessage(message) {
    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }
    return request("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  async getAnalysisById(id) {
    return request(`/analysis/${encodeURIComponent(id)}`, { method: "GET" });
  },

  raw(path, opts) {
    return request(path, opts);
  },
};

export default api;
// ...existing code...