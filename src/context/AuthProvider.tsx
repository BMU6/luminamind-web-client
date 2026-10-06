import { useState, useEffect, useRef, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { login, me, logout, register, refresh } from '@/network';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/storage';
import type { User, LoginData, RegisterData, AuthContextType } from '@/types';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkSession, setCheckSession] = useState(true);
  // true as soon as the user has logged in by hand. The start-up session check (below) must then
  // not throw the new token away, even if it was still running and fails afterwards.
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
    const initializeAuth = async () => {
      try {
        // if there is no access token try to refresh and store and then get the profile otherwise if there is a token just fetch the profile
        if (!getAccessToken()) {
          await refreshSession();
        }
        await loadUser();
      } catch (error) {
        console.error(error);
        // if the fetching fails that might be expired token so we try to refresh and fetch one more time
        try {
          await refreshSession();
          await loadUser();
        } catch (refreshError) {
          // if we didn't get the user then we remove the accessToken if any and set the user to null
          // (not if the user has logged in in the meantime: that session is valid)
          console.error(refreshError);
          if (!manualLogin.current) clearSession();
        }
      } finally {
        setCheckSession(false);
      }
    };

    if (checkSession) initializeAuth();
  }, [checkSession]);

  const handleSignIn = async ({ email, password }: LoginData) => {
    const { accessToken } = await login({ email, password });
    manualLogin.current = true;
    setAccessToken(accessToken);
    // load the profile right here, so the page can switch as soon as the login worked
    await loadUser();
  };

  const handleRegister = async (formState: RegisterData) => {
    const { accessToken } = await register(formState);
    manualLogin.current = true;
    setAccessToken(accessToken);
    await loadUser();
  };

  const handleSignOut = async () => {
    await logout();
    manualLogin.current = false;
    clearSession();
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
