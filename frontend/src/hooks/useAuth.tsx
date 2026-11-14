import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type Session } from '../api/auth';
import { ApiError, getRole, getToken, isRemembered, setRole, setToken } from '../api/http';
import type { Role, User } from '../types/auth';

type AuthState = 'loading' | 'out' | 'in';

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  role: Role | null;
  login: (role: Role, email: string, password: string, remember: boolean) => Promise<void>;
  register: (role: Role, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  /** After the profile page changes the name or e-mail. */
  updateUser: (user: User) => void;
  /** After a password change: the server logged out old logins and sent a new one for this browser. */
  renewSession: (session: Session) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getToken() ? 'loading' : 'out');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role | null>(null);

  // On first load, check that a saved token is still valid for the role it was issued to.
  useEffect(() => {
    if (!getToken()) return;
    const saved = getRole();
    authApi
      .me(saved)
      .then((u) => {
        setUser(u);
        setRoleState(saved);
        setState('in');
      })
      .catch((e) => {
        // Only an explicit 401 means the token is bad; a down server shouldn't log anyone out.
        if (e instanceof ApiError && e.status === 401) {
          setToken(null);
          setRole(null);
        }
        setState('out');
      });
  }, []);

  const accept = useCallback((r: Role, s: Session, remember: boolean) => {
    setToken(s.token, remember);
    setRole(r, remember);
    setUser(s.user);
    setRoleState(r);
    setState('in');
  }, []);

  const login = useCallback(
    async (r: Role, email: string, password: string, remember: boolean) => accept(r, await authApi.login(r, email, password, remember), remember),
    [accept]
  );
  const register = useCallback(
    async (r: Role, email: string, password: string, displayName: string) => accept(r, await authApi.register(r, email, password, displayName), true),
    [accept]
  );
  const logout = useCallback(async () => {
    try {
      if (role) await authApi.logout(role);
    } catch {
      /* even if the server can't be reached, drop the local session */
    }
    setToken(null);
    setRole(null);
    setUser(null);
    setRoleState(null);
    setState('out');
  }, [role]);

  const updateUser = useCallback((u: User) => setUser(u), []);
  const renewSession = useCallback((s: Session) => {
    setToken(s.token, isRemembered());
    setUser(s.user);
  }, []);

  const value = useMemo(
    () => ({ state, user, role, login, register, logout, updateUser, renewSession }),
    [state, user, role, login, register, logout, updateUser, renewSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
