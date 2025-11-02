// ...existing code...
import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || "https://resume-matcher-backend-zpt3.onrender.com";
const REQUEST_TIMEOUT_MS = 30_000;

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

  // Attach bearer token as fallback (helps on mobile when cookies are blocked)
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: options.credentials ?? "include", // include cookies, but also send Authorization
      ...options,
      headers,
      signal: controller.signal,
    });

    if (res.status === 204) return null;

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const detail = (body && body.detail) || (body && body.message) || body || res.statusText;
      const err = new Error(detail || "API error");
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body;
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error("Request timed out. Try again.");
      e.status = 408;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  // Called by authStore after Supabase sign-in to set backend cookie
  async setCookie(sessionOrData) {
    const payload = {
      access_token: sessionOrData?.access_token ?? sessionOrData?.session?.access_token,
      refresh_token: sessionOrData?.refresh_token ?? sessionOrData?.session?.refresh_token,
      user: sessionOrData?.user ?? sessionOrData?.session?.user,
      session: sessionOrData?.session ?? null,
    };
    return request("/set-cookie", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async logout() {
    return request("/logout", { method: "POST" });
  },

  async getSummaries() {
    return request("/summaries", { method: "GET" });
  },

  async analyzeResume(file) {
    const form = new FormData();
    form.append("file", file); // backend expects 'file'
    return request("/analyze-resume", {
      method: "POST",
      body: form,
      // DO NOT set Content-Type for FormData
    });
  },

  async sendChatMessage(message) {
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