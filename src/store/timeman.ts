import { closeWorkday, openWorkday, pauseWorkday } from '@/lib/api/timeman';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimemanState {
  status: 'opened' | 'paused' | 'closed';
  startTime: number | null; // timestamp
  pauseStartTime: number | null; // timestamp
  totalPausedTime: number; // in ms
  elapsedTime: number; // in ms
  lastReport: string;
  isLoading: boolean;
  error: string | null;

  openWorkday: () => Promise<void>;
  pauseWorkday: (breakMinutes: number) => Promise<void>;
  resumeWorkday: () => Promise<void>;
  closeWorkday: (report: string) => Promise<void>;
  updateElapsedTime: () => void;
  resetWorkday: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTimemanStore = create<TimemanState>()(
  persist(
    (set, get) => ({
      status: 'closed',
      startTime: null,
      pauseStartTime: null,
      totalPausedTime: 0,
      elapsedTime: 0,
      lastReport: '',
      isLoading: false,
      error: null,

      openWorkday: async () => {
        try {
          set({ isLoading: true, error: null });
          await openWorkday();

          set({
            status: 'opened',
            startTime: Date.now(),
            pauseStartTime: null,
            totalPausedTime: 0,
            elapsedTime: 0,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Ошибка при открытии рабочего дня',
          });
        }
      },

      pauseWorkday: async (breakMinutes: number) => {
        try {
          set({ isLoading: true, error: null });

          await pauseWorkday(breakMinutes);

          const now = Date.now();
          const state = get();

          if (state.status === 'opened' && state.startTime) {
            const elapsed = now - state.startTime - state.totalPausedTime;

            set({
              status: 'paused',
              pauseStartTime: now,
              elapsedTime: elapsed,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Ошибка при паузе рабочего дня',
          });
        }
      },

      resumeWorkday: async () => {
        try {
          set({ isLoading: true, error: null });
          // В Битриксе обычно нет отдельного API для возобновления,
          // но мы можем использовать openWorkday или просто обновить состояние
          await openWorkday(); // Или можно не вызывать API, если нет соответствующего endpoint

          const state = get();
          if (
            state.status === 'paused' &&
            state.pauseStartTime &&
            state.startTime
          ) {
            // Рассчитываем продолжительность паузы
            const pauseDuration = Date.now() - state.pauseStartTime;

            set({
              status: 'opened',
              pauseStartTime: null,
              totalPausedTime: state.totalPausedTime + pauseDuration,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Ошибка при возобновлении рабочего дня',
          });
        }
      },

      closeWorkday: async (report: string) => {
        try {
          set({ isLoading: true, error: null });
          await closeWorkday({ report });

          set({
            status: 'closed',
            startTime: null,
            pauseStartTime: null,
            totalPausedTime: 0,
            elapsedTime: 0,
            lastReport: report,
            isLoading: false,
          });
        } catch (error: ANY) {
          console.error('Ошибка при закрытии рабочего дня:', error);

          let userFriendlyError = 'Ошибка при закрытии рабочего дня';
          const message =
            error instanceof Error
              ? error.message.toLowerCase()
              : String(error);

          // Распознаем типичные кейсы Bitrix
          if (
            message.includes('failed to close workday') ||
            message.includes('already closed') ||
            message.includes('already active') ||
            message.includes('500') ||
            message.includes('internal server error')
          ) {
            userFriendlyError =
              '⚠️ Рабочий день уже закрыт или активен в Битриксе.';
          }

          set({
            isLoading: false,
            error: userFriendlyError,
          });
        }
      },

      updateElapsedTime: () => {
        const state = get();
        if (state.status === 'opened' && state.startTime) {
          const now = Date.now();
          const start = state.startTime;
          const elapsed = now - start - state.totalPausedTime;

          set({ elapsedTime: elapsed });
        }
        // При паузе время не обновляется - это правильно
      },

      resetWorkday: () => {
        set({
          status: 'closed',
          startTime: null,
          pauseStartTime: null,
          totalPausedTime: 0,
          elapsedTime: 0,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'timeman-storage',
      // Сохраняем только определенные поля
      partialize: (state) => ({
        status: state.status,
        startTime: state.startTime,
        pauseStartTime: state.pauseStartTime,
        totalPausedTime: state.totalPausedTime,
        elapsedTime: state.elapsedTime,
        lastReport: state.lastReport,
      }),
    }
  )
);
