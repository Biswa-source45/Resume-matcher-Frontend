// src/store/authStore.js
import { create } from "zustand";
import { supabase } from "../utils/supabaseClient";
import { api } from "../utils/api";

const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initializeAuth: async () => {
    try {
      const { loading } = get();
      if (!loading) return;

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      set({ session: data.session, user: data.session?.user ?? null, loading: false });

      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth Event:", event);

        if (event === "SIGNED_IN" && session) {
          set({ user: session.user, session });
          try {
            await api.setCookie(session);
          } catch (e) {
            console.error("Set cookie failed:", e);
          }
        }

        if (event === "SIGNED_OUT") {
          set({ user: null, session: null });
          try {
            await api.logout();
          } catch (e) {
            console.error("Logout cleanup failed:", e);
          }
        }
      });
    } catch (err) {
      console.error("Auth init error:", err);
      set({ error: err.message, loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) await api.setCookie(data.session);

      set({ user: data.user, session: data.session, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.session) await api.setCookie(data.session);

      set({ user: data.user, session: data.session, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await api.logout();
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => {
    const { user, session } = get();
    return !!user && !!session;
  },
}));

export default useAuthStore;
