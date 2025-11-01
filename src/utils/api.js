const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  async request(endpoint, options = {}, isFormData = false) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      credentials: "include", // ensures JWT cookies are sent
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // 🧠 Handle common errors cleanly
      if (response.status === 401) {
       
        // console.warn(`[AUTH] Session expired. Redirecting to login.`);
        return { error: "unauthorized" };
      }

      if (!response.ok) {
        let error = {};
        try {
          error = await response.json();
        } catch {
          /* ignore invalid JSON */
        }
        const message =
          error?.detail || error?.message || `Request failed: ${endpoint}`;
        return { error: message };
      }

      if (response.status === 204) return {};
      return await response.json();
    } catch (err) {
      console.warn(`[API] Network or unexpected error at ${endpoint}:`, err.message);
      return { error: "Network error. Please try again." };
    }
  }

  // ---------------------- AUTH ----------------------

  async setCookie(session) {
    if (!session?.access_token) {
      console.warn("[Auth] Invalid Supabase session");
      return { error: "Invalid session" };
    }

    const res = await this.request("/set-cookie", {
      method: "POST",
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      }),
    });

    if (res?.error) console.warn("[Auth] setCookie failed:", res.error);
    return res;
  }

  async logout() {
    const res = await this.request("/logout", { method: "POST" });
    if (res?.error && res.error !== "unauthorized") {
      console.warn("[Auth] Logout warning:", res.error);
    }
    return res;
  }

  async getCurrentUser() {
    const res = await this.request("/me");
    if (res?.error === "unauthorized") return null;
    return res;
  }

  // ---------------------- RESUME ----------------------

  async analyzeResume(file) {
    if (!file) return { error: "Please upload a PDF resume." };

    const formData = new FormData();
    formData.append("file", file);

    return this.request("/analyze-resume", { method: "POST", body: formData }, true);
  }

  async getSummaries() {
    const res = await this.request("/summaries");
    return res?.error ? [] : res;
  }

  async deleteSummary(analysisId) {
    if (!analysisId) return { error: "Analysis ID required" };
    return this.request(`/summaries/${analysisId}`, { method: "DELETE" });
  }

  // ---------------------- CHAT ----------------------

  async sendChatMessage(message) {
    if (!message?.trim()) return { error: "Message cannot be empty" };

    const res = await this.request("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    if (res?.error && res.error !== "unauthorized") {
      console.warn("[Chat] Error:", res.error);
    }

    return res;
  }

  // ---------------------- HEALTH ----------------------

  async healthCheck() {
    const res = await this.request("/health");
    return res?.error ? { status: "down", error: res.error } : res;
  }
}

export const api = new ApiClient();
