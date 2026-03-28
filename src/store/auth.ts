// store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserLocal } from '../hooks/users/useUserLocal';
import { useCallback } from 'react';

interface AuthState {
  userId: number | null;
  role: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null;
  setAuth: (
    userId: number | null,
    role: string | null,
    sessionExpiresAt?: number | null
  ) => void;
  logout: () => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      role: null,
      isAdmin: false,
      isAuthenticated: false,
      sessionExpiresAt: null,

      setAuth: (
        userId: number | null,
        role: string | null,
        sessionExpiresAt = null
      ) => {
        const isAdmin = role === 'admin';
        const expiresAt = sessionExpiresAt || Date.now() + 2 * 60 * 60 * 1000;

        set({
          userId,
          role,
          isAdmin,
          isAuthenticated: true,
          sessionExpiresAt: expiresAt,
        });
      },

      logout: () => {
        set({
          userId: null,
          role: null,
          isAdmin: false,
          isAuthenticated: false,
          sessionExpiresAt: null,
        });
      },

      isSessionValid: () => {
        const state = get();
        return state.sessionExpiresAt
          ? state.sessionExpiresAt > Date.now()
          : false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        userId: state.userId,
        role: state.role,
        isAdmin: state.isAdmin,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    }
  )
);

export const useAuthWithUserData = () => {
  const {
    userId,
    role,
    sessionExpiresAt,
    setAuth: setStoreAuth,
    logout,
    isAuthenticated: storeIsAuthenticated,
  } = useAuthStore();

  const { isLoading: usersLoading, getDisplayNameById } =
    useUserLocal.useUsersMap();

  const fullName = userId ? getDisplayNameById(userId) : null;

  const isAdmin = role === 'admin';
  const isAuthenticated =
    storeIsAuthenticated &&
    (sessionExpiresAt ? sessionExpiresAt > Date.now() : false);

  const setAuthWithUserData = useCallback(
    (userId: number, role: string, sessionExpiresAt?: number | null) => {
      setStoreAuth(userId, role, sessionExpiresAt);
    },
    [setStoreAuth]
  );

  return {
    fullName,
    userId,
    role,
    isAdmin,
    isAuthenticated,
    setAuth: setAuthWithUserData,
    logout,
    isLoading: usersLoading,
  };
};

export const usePermissions = () => {
  const { isAdmin } = useAuthStore();

  return {
    canEditDescription: true,
    canEditTitle: isAdmin,
    canEditStatus: isAdmin,
    canEditPriority: isAdmin,
    canEditAssignee: isAdmin,
    canEditDeadline: isAdmin,
    canDeleteTasks: isAdmin,
    canAddComments: true,
    canViewAdminPanel: isAdmin,
    canManageUsers: isAdmin,
  };
};
