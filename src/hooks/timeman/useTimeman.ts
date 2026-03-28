// hooks/timeman/useTimeman.ts
import { useTimemanStore } from '@/store/timeman';

export function useTimeman() {
  const store = useTimemanStore();

  return {
    // Данные состояния
    status: store.status,
    elapsedTime: store.elapsedTime,
    lastReport: store.lastReport,

    // Состояние загрузки
    isLoading: store.isLoading,

    // Ошибки
    error: store.error,

    // Действия
    actions: {
      openWorkday: store.openWorkday,
      pauseWorkday: store.pauseWorkday,
      resumeWorkday: store.resumeWorkday,
      closeWorkday: store.closeWorkday,
      resetState: store.resetWorkday,
      clearError: () => store.setError(null),
    },
  };
}
