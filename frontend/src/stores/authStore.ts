import { create } from 'zustand';
import { User } from '../types/auth.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const STORAGE_KEYS = {
  ACCESS: 'smart_billing_access_token',
  REFRESH: 'smart_billing_refresh_token',
  USER: 'smart_billing_user',
};

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
  let initialUser: User | null = null;
  try {
    initialUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
  const initialAccess = localStorage.getItem(STORAGE_KEYS.ACCESS);
  const initialRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH);

  return {
    user: initialUser,
    accessToken: initialAccess,
    refreshToken: initialRefresh,
    isAuthenticated: Boolean(initialAccess && initialUser),

    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ACCESS, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH, refreshToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    setTokens: (accessToken, refreshToken) => {
      localStorage.setItem(STORAGE_KEYS.ACCESS, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH, refreshToken);
      set({ accessToken, refreshToken });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACCESS);
      localStorage.removeItem(STORAGE_KEYS.REFRESH);
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },
  };
});
