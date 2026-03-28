// store/auto-close-warning-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AutoCloseWarningState {
  isWarningOpen: boolean;
  showCompactMode: boolean;
  timeLeft: number;
  lastActivity: number;
  warningStartTime: number | null;
  calculatedTimeLeft: number; // Добавляем вычисленное время

  // Actions
  openWarning: () => void;
  closeWarning: () => void;
  toggleCompactMode: (show: boolean) => void;
  updateTimeLeft: (time: number) => void;
  updateLastActivity: (timestamp: number) => void;
  setWarningStartTime: (timestamp: number | null) => void;
  setCalculatedTimeLeft: (time: number) => void;
  reset: () => void;
}

export const useAutoCloseWarningStore = create<AutoCloseWarningState>()(
  persist(
    (set) => ({
      isWarningOpen: false,
      showCompactMode: false,
      timeLeft: 0,
      lastActivity: Date.now(),
      warningStartTime: null,
      calculatedTimeLeft: 0,

      openWarning: () =>
        set({
          isWarningOpen: true,
          warningStartTime: Date.now(),
        }),
      closeWarning: () =>
        set({
          isWarningOpen: false,
          showCompactMode: false,
          warningStartTime: null,
        }),
      toggleCompactMode: (show) => set({ showCompactMode: show }),
      updateTimeLeft: (time) => set({ timeLeft: time }),
      updateLastActivity: (timestamp) => set({ lastActivity: timestamp }),
      setWarningStartTime: (timestamp) => set({ warningStartTime: timestamp }),
      setCalculatedTimeLeft: (time) => set({ calculatedTimeLeft: time }),
      reset: () =>
        set({
          isWarningOpen: false,
          showCompactMode: false,
          timeLeft: 0,
          lastActivity: Date.now(),
          warningStartTime: null,
          calculatedTimeLeft: 0,
        }),
    }),
    {
      name: 'auto-close-warning-storage',
    }
  )
);
