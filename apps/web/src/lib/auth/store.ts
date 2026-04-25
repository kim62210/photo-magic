'use client';

/**
 * Auth state — Zustand store with localStorage persistence.
 *
 * Mock-first: 실제 NextAuth/JWT 세션 대신 클라이언트 localStorage에만 저장한다.
 * TODO: 실제 NextAuth v5 통합 시 server session + refresh token rotation 으로 교체.
 */

import type { SubscriptionTier, User } from '@photo-magic/shared-types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'photo-magic:auth:v1';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setTier: (tier: SubscriptionTier) => void;
  signOut: () => void;
  restore: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      hydrated: false,

      setUser: (user) => set({ user, isLoading: false }),

      setTier: (tier) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, tier } });
      },

      signOut: () => set({ user: null, isLoading: false }),

      restore: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.restore();
      },
    },
  ),
);

/** SSR/SSG 안전 셀렉터 — 빌드 타임에 user 를 항상 null 로 보고, 마운트 후 hydrate. */
export function useAuthUser(): User | null {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  return hydrated ? user : null;
}

export function useIsSignedIn(): boolean {
  return useAuthUser() !== null;
}
