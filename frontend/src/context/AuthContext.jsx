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
        await fetchUser({ silent: initialLoadDone.current });
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
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
