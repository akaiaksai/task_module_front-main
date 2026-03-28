import { useEffect, useCallback } from 'react';
import { useTaskTimerStore } from '../../store/task-timer';
import { useTimemanStore } from '../../store/timeman';
import { useAutoCloseWarningStore } from '../../store/auto-close-warning-store';

const AUTO_CLOSE_THRESHOLD = 20 * 60 * 1000;
const WARNING_THRESHOLD = 15 * 60 * 1000;

export const useAutoCloseWorkday = () => {
  const { status: workdayStatus, closeWorkday } = useTimemanStore();
  const { tasks } = useTaskTimerStore();
  const {
    updateLastActivity,
    openWarning,
    closeWarning,
    updateTimeLeft,
    reset,
    lastActivity,
    warningStartTime,
    isWarningOpen,
    setCalculatedTimeLeft,
  } = useAutoCloseWarningStore();

  const hasActiveTasks = useCallback(() => {
    return tasks.some((task) => task.isRunning);
  }, [tasks]);

  useEffect(() => {
    if (workdayStatus !== 'opened' || hasActiveTasks()) {
      closeWarning();
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivity;
    const timeUntilAutoClose = AUTO_CLOSE_THRESHOLD - timeSinceLastActivity;

    console.log('Восстановление состояния:', {
      timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000),
      timeUntilAutoClose: Math.round(timeUntilAutoClose / 1000),
      isWarningOpen,
      warningStartTime,
    });

    if (timeUntilAutoClose <= 0) {
      console.log('Автоматическое закрытие при восстановлении');
      closeWorkday('Автоматическое закрытие по истечении времени неактивности');
      reset();
      return;
    }

    if (timeSinceLastActivity >= WARNING_THRESHOLD) {
      const adjustedTimeLeft = timeUntilAutoClose;

      console.log(
        'Восстанавливаем предупреждение, оставшееся время:',
        Math.round(adjustedTimeLeft / 1000)
      );

      updateTimeLeft(adjustedTimeLeft);
      setCalculatedTimeLeft(adjustedTimeLeft);

      if (!isWarningOpen) {
        openWarning();
      }
    }
  }, [workdayStatus]); // Только при изменении статуса рабочего дня

  // Обновляем активность при изменении задач
  useEffect(() => {
    updateLastActivity(Date.now());
  }, [tasks, updateLastActivity]);

  // Основной интервал проверки
  useEffect(() => {
    if (workdayStatus !== 'opened' || hasActiveTasks()) {
      closeWarning();
      return;
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const { lastActivity: storedLastActivity } =
        useAutoCloseWarningStore.getState();
      const timeSinceLastActivity = currentTime - storedLastActivity;
      const timeUntilAutoClose = AUTO_CLOSE_THRESHOLD - timeSinceLastActivity;

      // Обновляем время
      updateTimeLeft(timeUntilAutoClose);
      setCalculatedTimeLeft(timeUntilAutoClose);

      if (timeUntilAutoClose <= 0) {
        console.log('Auto-closing workday due to inactivity');
        closeWorkday(
          'Автоматическое закрытие по истечении времени неактивности'
        );
        reset();
      } else if (timeSinceLastActivity >= WARNING_THRESHOLD) {
        if (!isWarningOpen) {
          console.log('Открываем предупреждение');
          openWarning();
        }
      } else {
        if (isWarningOpen) {
          console.log('Закрываем предупреждение - время активности');
          closeWarning();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    workdayStatus,
    hasActiveTasks,
    closeWorkday,
    openWarning,
    closeWarning,
    reset,
    updateTimeLeft,
    setCalculatedTimeLeft,
    isWarningOpen,
  ]);

  useEffect(() => {
    if (workdayStatus === 'closed') {
      reset();
    }
  }, [workdayStatus, reset]);

  return {
    resetInactivityData: reset,
    updateActivity: () => updateLastActivity(Date.now()),
  };
};

export const useWorkdayTime = () => {
  const { status } = useTimemanStore();
  const { tasks } = useTaskTimerStore();
  const { calculatedTimeLeft, lastActivity } = useAutoCloseWarningStore();

  const hasActiveTasks = useCallback(() => {
    return tasks.some((task) => task.isRunning);
  }, [tasks]);

  const getTimeUntilAutoClose = useCallback(() => {
    if (status !== 'opened' || hasActiveTasks()) {
      return AUTO_CLOSE_THRESHOLD;
    }
    return Math.max(0, calculatedTimeLeft);
  }, [status, hasActiveTasks, calculatedTimeLeft]);

  const isAutoCloseImminent = useCallback(() => {
    if (status !== 'opened' || hasActiveTasks()) {
      return false;
    }
    const timeUntilClose = getTimeUntilAutoClose();
    return timeUntilClose > 0 && timeUntilClose <= WARNING_THRESHOLD;
  }, [status, hasActiveTasks, getTimeUntilAutoClose]);

  return {
    getTimeUntilAutoClose,
    isAutoCloseImminent,
    hasActiveTasks,
    warningThreshold: WARNING_THRESHOLD,
    timeLeft: calculatedTimeLeft,
    lastActivity,
  };
};
// Упрощенная версия без расширенного store
export const useExtendedTaskTimerStore = () => {
  return useTaskTimerStore();
};
