// hooks/useTaskTitles.ts
import { useCallback } from 'react';
import { useAllTasks } from '../useTaskActions';

export const useTaskTitles = () => {
  const { data: allTasks = [] } = useAllTasks();

  const getTaskTitleById = useCallback(
    (taskId: string): string => {
      if (!taskId) {
        return 'Неизвестная задача';
      }

      // Специальные типы задач
      if (taskId.startsWith('intermediate-')) {
        return 'Промежуточные дела';
      }
      if (taskId.startsWith('meeting-')) {
        return 'Встреча';
      }

      // Извлекаем числовой ID
      const numericId = parseInt(taskId.replace(/.*?(\d+)$/, '$1'));

      if (isNaN(numericId)) {
        return `Задача #${taskId}`;
      }

      // Ищем задачу в загруженном списке
      const foundTask = allTasks.find((task) => {
        const taskIdFromTask = task.id;
        if (!taskIdFromTask) {
          return false;
        }

        return (
          taskIdFromTask === numericId.toString() ||
          taskIdFromTask.toString() === numericId.toString()
        );
      });

      return foundTask?.title || `Задача #${taskId}`;
    },
    [allTasks]
  );

  return { getTaskTitleById };
};
