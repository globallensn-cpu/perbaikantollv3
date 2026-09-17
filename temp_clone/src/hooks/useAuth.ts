import { syncHistoryAsync } from '../lib/history';
import { useState, useEffect, useCallback } from 'react';
import {
  getUserSession,
  setUserSession,
  logoutUser,
  verifyAccessCodeAsync,
  UserSession,
} from '../lib/auth';

export interface UseAuthReturn {
  session: UserSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  code: string;
  role: 'admin' | 'user' | null;
  name: string;
  email: string;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  login: (accessCode: string) => Promise<{ success: boolean; session?: UserSession; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => void;
  validateBackendSession: () => Promise<boolean>;
  setSession: (session: UserSession | null) => void;
  clearError: () => void;
}

/**
 * Custom React Hook for authentication and session management.
 * Follows the secure backend-first architecture, keeping state in sync
 * across components, windows, and tabs with robust error handling.
 */
export function useAuth(): UseAuthReturn {
  const [session, setSessionState] = useState<UserSession | null>(() => {
    const current = getUserSession();
    if (current && current.code === 'GUEST-ACCESS') {
      return null;
    }
    return current;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(() => {
    const current = getUserSession();
    if (current && current.code !== 'GUEST-ACCESS') {
      setSessionState(current);
    } else {
      setSessionState(null);
    }
  }, []);

  // Sync state on mount and subscribe to auth/storage events
  useEffect(() => {
    refreshSession();
    setIsLoading(false);

    const handleAuthEvent = () => {
      refreshSession();
    };

    window.addEventListener('satset_auth_updated', handleAuthEvent);
    window.addEventListener('satset_session_updated', handleAuthEvent);
    window.addEventListener('satset_clients_updated', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    return () => {
      window.removeEventListener('satset_auth_updated', handleAuthEvent);
      window.removeEventListener('satset_session_updated', handleAuthEvent);
      window.removeEventListener('satset_clients_updated', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
    };
  }, [refreshSession]);

  /**
   * Validate session with backend proxy endpoint
   */
  const validateBackendSession = useCallback(async (): Promise<boolean> => {
    const current = getUserSession();
    if (!current || !current.code || current.code === 'GUEST-ACCESS') {
      return false;
    }

    setIsValidating(true);
    try {
      const res = await verifyAccessCodeAsync(current.code);
      if (res.success && res.role) {
        const updatedSession: UserSession = {
          code: res.code || current.code,
          role: res.role,
          email: res.email || current.email,
          name: res.name || current.name,
          loginTime: current.loginTime || Date.now(),
        };
        setUserSession(updatedSession);
        setSessionState(updatedSession);
        setError(null);
        return true;
      } else {
        // Session invalid on backend
        logoutUser();
        setSessionState(null);
        setError(res.error || 'Sesi telah kedaluwarsa atau tidak valid.');
        return false;
      }
    } catch (err: any) {
      console.warn('[useAuth] Validation error:', err);
      return true; // Keep local on network glitch
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Secure login via backend verification
   */
  const login = useCallback(
    async (
      accessCode: string
    ): Promise<{ success: boolean; session?: UserSession; error?: string }> => {
      const cleaned = accessCode.trim();
      if (!cleaned) {
        const msg = 'Silakan masukkan Kode Akses.';
        setError(msg);
        return { success: false, error: msg };
      }

      setIsValidating(true);
      setError(null);

      try {
        const res = await verifyAccessCodeAsync(cleaned);
        if (res.success && res.role) {
          const newSession: UserSession = {
            code: res.code || cleaned.toUpperCase(),
            role: res.role,
            email: res.email,
            name: res.name || (res.role === 'admin' ? 'Administrator' : 'Klien Satset'),
            loginTime: Date.now(),
          };

          setUserSession(newSession);
          setSessionState(newSession);
          syncHistoryAsync(newSession.code);
          setError(null);
          return { success: true, session: newSession };
        } else {
          const errMsg = res.error || 'Kode Akses tidak valid atau telah kedaluwarsa.';
          setError(errMsg);
          return { success: false, error: errMsg };
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Gagal memverifikasi kode akses ke server.';
        setError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  /**
   * Secure logout notifying backend and clearing local state
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsValidating(true);
    try {
      logoutUser();
    } finally {
      setSessionState(null);
      setError(null);
      setIsValidating(false);
    }
  }, []);

  /**
   * Explicitly set session
   */
  const setSession = useCallback((newSession: UserSession | null) => {
    setUserSession(newSession);
    setSessionState(newSession);
    if (!newSession) {
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = Boolean(session && session.code && session.code !== 'GUEST-ACCESS');
  const isAdmin = Boolean(session?.role === 'admin');
  const isUser = Boolean(session?.role === 'user');

  return {
    session,
    isAuthenticated,
    isAdmin,
    isUser,
    code: session?.code || '',
    role: session?.role || null,
    name: session?.name || '',
    email: session?.email || '',
    isLoading,
    isValidating,
    error,
    login,
    logout,
    refreshSession,
    validateBackendSession,
    setSession,
    clearError,
  };
}

export default useAuth;
