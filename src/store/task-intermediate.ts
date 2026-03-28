import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  activeTaskId: string | null;
  expiresAt: number | null;
  requiresComment: boolean;

  start: (taskId: string, minutes: number) => void;
  expire: () => void;
  finish: () => void;
};

export const useIntermediateLockStore = create(
  persist<State>(
    (set) => ({
      activeTaskId: null,
      expiresAt: null,
      requiresComment: false,

      start: (taskId, minutes) => {
        set({
          activeTaskId: taskId,
          expiresAt: Date.now() + minutes * 60 * 1000,
          requiresComment: false,
        });
      },

      expire: () => {
        set({ requiresComment: true });
      },

      finish: () => {
        set({
          activeTaskId: null,
          expiresAt: null,
          requiresComment: false,
        });
      },
    }),
    {
      name: 'intermediate-lock',
    }
  )
);
