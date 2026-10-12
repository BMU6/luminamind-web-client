import { useState, useEffect, useRef, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { login, me, logout, register, refresh } from "@/network";
import { setAccessToken, clearAccessToken, getAccessToken } from "@/storage";
import type { User, LoginData, RegisterData, AuthContextType } from "@/types";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkSession, setCheckSession] = useState(true);
  const manualLogin = useRef(false);

  const refreshSession = async () => {
    const { accessToken } = await refresh();
    setAccessToken(accessToken);
  };

  const loadUser = async () => {
    const data = await me();
    setUser(data);
    setSignedIn(true);
  };

  const clearSession = () => {
    clearAccessToken();
    setUser(null);
    setSignedIn(false);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // If there is no access token, try to refresh and store the state session
        if (!getAccessToken()) {
          await refreshSession();
        }
        if (isMounted) await loadUser();
      } catch (error) {
        console.error(
          "Initial authorization handshake failed, clearing stale context:",
          error,
        );

        // ✨ FIXED: Removed the second redundant try/catch loop that was causing overlapping background requests.
        // If the initial check fails, it safely clears the stale workspace immediately.
        if (isMounted && !manualLogin.current) {
          clearSession();
        }
      } finally {
        if (isMounted) setCheckSession(false);
      }
    };

    if (checkSession) initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [checkSession]);

  const handleSignIn = async ({ email, password }: LoginData) => {
    // ✨ FIXED: Set manualLogin.current to true IMMEDIATELY before starting the async fetch operation.
    // This securely blocks any lingering initialization tasks from clearing the session out from underneath you.
    manualLogin.current = true;
    try {
      const { accessToken } = await login({ email, password });
      setAccessToken(accessToken);
      await loadUser();
    } catch (err) {
      manualLogin.current = false; // Reset toggle if authorization inputs are invalid
      throw err;
    }
  };

  const handleRegister = async (formState: RegisterData) => {
    // ✨ FIXED: Set manualLogin.current to true immediately here as well
    manualLogin.current = true;
    try {
      const { accessToken } = await register(formState);
      setAccessToken(accessToken);
      await loadUser();
    } catch (err) {
      manualLogin.current = false;
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout network dispatch error:", err);
    } finally {
      manualLogin.current = false;
      clearSession();
    }
  };

  const value: AuthContextType = {
    signedIn,
    loading: checkSession,
    user,
    handleSignIn,
    handleSignOut,
    handleRegister,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
};

export default AuthProvider;
