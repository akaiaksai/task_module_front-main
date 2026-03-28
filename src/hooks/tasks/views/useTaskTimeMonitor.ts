import { useTaskExtensionModal } from '@/store/task-extension-modal';
import { useTaskTimerStore } from '@/store/task-timer';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useTaskTimeMonitor() {
  const { tasks, getCurrentElapsed } = useTaskTimerStore(); // Убираем pauseTask
  const { openModal, markAsShown, isTaskShown } = useTaskExtensionModal();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkTimeExceeded = async () => {
      const activeTasks = tasks.filter((task) => task.isRunning);

      for (const timerTask of activeTasks) {
        if (isTaskShown(timerTask.taskId)) {
          continue;
        }

        try {
          const elapsedTimesData = queryClient.getQueryData<ANY>([
            'elapsed-times',
            timerTask.taskId,
          ]);

          const savedElapsedMs =
            elapsedTimesData?.result?.reduce(
              (total: number, item: ANY) => total + (item.Seconds || 0) * 1000,
              0
            ) || 0;

          const currentElapsed = getCurrentElapsed(timerTask.taskId);
          const totalElapsedMs = savedElapsedMs + currentElapsed;

          // ПОЛУЧАЕМ ДАННЫЕ ЗАДАЧИ
          const taskData = queryClient.getQueryData<ANY>([
            'task',
            timerTask.taskId,
          ]);

          // ЕСЛИ ДАННЫХ ЗАДАЧИ НЕТ - ПРОПУСКАЕМ ПРОВЕРКУ
          if (!taskData) {
            console.log(`No task data for ${timerTask.taskId}, skipping check`);
            continue;
          }

          // ЕСЛИ НЕТ timeEstimate - ПРОПУСКАЕМ ПРОВЕРКУ
          if (!taskData.timeEstimate) {
            console.log(
              `No timeEstimate for task ${timerTask.taskId}, skipping check`
            );
            continue;
          }

          const plannedTimeMs = taskData.timeEstimate * 1000;

          console.log(`Active Task ${timerTask.taskId}:`, {
            title: taskData.title,
            timeEstimate: taskData.timeEstimate,
            plannedTimeHours: (taskData.timeEstimate / 3600).toFixed(1) + 'h',
            savedElapsedMs: (savedElapsedMs / 1000).toFixed(0) + 's',
            currentElapsed: (currentElapsed / 1000).toFixed(0) + 's',
            totalElapsedMs: (totalElapsedMs / 1000).toFixed(0) + 's',
            isExceeded: totalElapsedMs > plannedTimeMs,
          });

          if (totalElapsedMs > plannedTimeMs) {
            console.log(
              `⏰ TIME EXCEEDED for task ${timerTask.taskId}: ${taskData.title}`
            );
            markAsShown(timerTask.taskId);
            openModal(timerTask.taskId, taskData);
          }
        } catch (error) {
          console.error(
            `Error checking time for task ${timerTask.taskId}:`,
            error
          );
        }
      }
    };

    const interval = setInterval(checkTimeExceeded, 5000);
    return () => clearInterval(interval);
  }, [
    tasks,
    getCurrentElapsed,
    openModal,
    markAsShown,
    isTaskShown,
    queryClient,
  ]);
}
