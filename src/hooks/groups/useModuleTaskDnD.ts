import { http } from '@/lib/http';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface DragTaskData {
  ID: number;
  TITLE: string;
  TIME_ESTIMATE: number;
  UF_CRM_TASK?: string[];
}

interface UseModuleTaskDnDOptions {
  userId: number | null;
  projectId?: string;
}

export function useModuleTaskDnD({
  userId,
  projectId,
}: UseModuleTaskDnDOptions) {
  const [dragTask, setDragTask] = useState<DragTaskData | null>(null);
  const queryClient = useQueryClient();

  const updateModuleTask = useCallback(async (taskId: number, payload: ANY) => {
    try {
      await http.post(`/tasks/update/${taskId}`, payload);
      return true;
    } catch (error: ANY) {
      console.error('Update error:', error);
      toast.error('Ошибка обновления задачи');
      return false;
    }
  }, []);

  const startDrag = useCallback((e: ANY, task: DragTaskData) => {
    setDragTask(task);
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const allowDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const dropTask = useCallback(
    async (e: React.DragEvent, newStart: Date, newResponsibleId?: number) => {
      e.preventDefault();
      if (!dragTask) {
        return;
      }

      const durationMs = dragTask.TIME_ESTIMATE * 1000;
      const newDeadline = new Date(newStart.getTime() + durationMs);

      const payload: ANY = {
        DEADLINE: toBitrix(newDeadline),
        TIME_ESTIMATE: dragTask.TIME_ESTIMATE,
        AUDITORS: [userId],
      };

      if (newResponsibleId) {
        payload.RESPONSIBLE_ID = newResponsibleId;
      }

      if (projectId && dragTask.UF_CRM_TASK?.length) {
        payload.UF_CRM_TASK = [dragTask.UF_CRM_TASK[0]];
      }

      const ok = await updateModuleTask(dragTask.ID, payload);

      if (ok) {
        toast.success('Задача обновлена');

        queryClient.invalidateQueries({ queryKey: ['module-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }

      setDragTask(null);
    },
    [dragTask, userId, projectId, updateModuleTask]
  );

  const resetDrag = useCallback(() => setDragTask(null), []);

  return {
    dragTask,
    startDrag,
    allowDrop,
    dropTask,
    resetDrag,
  };
}

function toBitrix(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(
    2,
    '0'
  )}:00:00`;
}
