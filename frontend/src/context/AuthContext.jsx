import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../services/supabase";
import { setAccessToken } from "../services/api";
import { getMe } from "../services/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const signingIn = useRef(false);

  const fetchUser = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      if (!silent) setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAccessToken(s?.access_token ?? null);
      if (s) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
        initialLoadDone.current = true;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setAccessToken(s?.access_token ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (signingIn.current) return;
        await fetchUser({ silent: initialLoadDone.current });
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  const signIn = useCallback(async (email, password) => {
    signingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setSession(data.session);
      setAccessToken(data.session.access_token);

      try {
        const userData = await getMe();
        setUser(userData);
        initialLoadDone.current = true;
      } catch (err) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setAccessToken(null);
        throw new Error(
          err.response?.data?.message ||
            err.message ||
            "Account is inactive or deleted.",
        );
      }
    } finally {
      signingIn.current = false;
    }
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    // supabase-js's signUp() can't distinguish a new signup from an
    // already-registered-but-unconfirmed email here: with "Confirm email"
    // on, GoTrue's response has no session and no `.user` wrapper, so the
    // SDK's parser always resolves data.user to null. Call the REST endpoint
    // directly so we can read the `identities` array Supabase actually sends.
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
          gotrue_meta_security: {},
        }),
      },
    );

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        body.msg || body.error_description || body.message || "Sign up failed.",
      );
    }

    if (body.identities?.length === 0) {
      throw new Error("User already registered");
    }

    // If a session came back (e.g. autoconfirm is enabled), hand it to the
    // SDK so it persists/refreshes it like a normal signUp() would.
    if (body.access_token && body.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });
      if (error) throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin: user?.role === "ADMIN",
    isMember: user?.role === "MEMBER" || user?.role === "ADMIN",
    isAuthenticated: !!session && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
