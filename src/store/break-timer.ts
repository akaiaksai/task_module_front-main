import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BreakTimerState {
  breakEndsAt: number | null;
  startBreak: (minutes: number) => void;
  clearBreak: () => void;
}

export const useBreakTimerStore = create(
  persist<BreakTimerState>(
    (set, get) => ({
      breakEndsAt: null,

      startBreak: (minutes) => {
        const endsAt = Date.now() + minutes * 60 * 1000;

        if (get().breakEndsAt) {
          set({ breakEndsAt: null });
        }

        set({ breakEndsAt: endsAt });
      },

      clearBreak: () => {
        set({ breakEndsAt: null });
      },
    }),
    {
      name: 'break-timer',
    }
  )
);
