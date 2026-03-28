import type { Paginated, Task } from '@/shared/types/task';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  completeTask,
  createTask,
  deleteTask,
  fetchTasks,
  getTask,
  updateTask,
} from '../../lib/api/tasks/tasks';
import { useTaskSelectionModalStore } from '../../store/task-selection-modal';
import { useTaskTimerStore } from '../../store/task-timer';

// COMMENT
// type TaskResponse = Awaited<ReturnType<typeof getTask>>;

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: ANY) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  allTasks: () => [...taskKeys.all, 'all'] as const,
};

export function useAllTasks({
  isEnabled = true,
}: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: taskKeys.list({ all: true }),
    queryFn: () =>
      fetchTasks({
        perPage: 1000,
        page: 1,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    select: (data: Paginated<Task>) => data.items,
    enabled: isEnabled,
  });
}
export function useTasks(params: ANY = {}, options: ANY = {}) {
  return useQuery<Paginated<Task>, Error>({
    queryKey: [...taskKeys.list(params), params.selectedDate],
    queryFn: () => fetchTasks(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useTask(id: string) {
  const queryKey = taskKeys.detail(id);

  return useQuery<Task | undefined, Error>({
    queryKey,
    enabled: !!id,
    queryFn: async () => {
      try {
        const res = await getTask(id);
        return res?.core as Task;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          const timerStore = useTaskTimerStore.getState();
          const isStaleTimerTask =
            timerStore.activeTaskId === id || timerStore.lastTaskId === id;

          if (isStaleTimerTask) {
            timerStore.resetTaskTimer(id);
            return undefined;
          }
        }

        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTaskPrefetching() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const commonFilters = [
      { page: 1, perPage: 10, status: '-5' },
      { page: 1, perPage: 10 },
      { page: 1, perPage: 10, status: '2' },
    ];

    commonFilters.forEach((filters) => {
      queryClient.prefetchQuery({
        queryKey: taskKeys.list(filters),
        queryFn: () => fetchTasks(filters),
      });
    });
  }, [queryClient]);
}

export function useTaskActions() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: () => {
      toast.error('Не удалось создать задачу');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ANY }) =>
      updateTask(id, payload),

    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previous = queryClient.getQueriesData({
        queryKey: taskKeys.lists(),
      });

      const newDeadline =
        payload.DEADLINE === '' || payload.DEADLINE === null
          ? null
          : payload.DEADLINE;

      previous.forEach(([key, old]) => {
        if (!old) {
          return;
        }

        queryClient.setQueryData(key, (prev: ANY) => {
          if (!prev?.items) {
            return prev;
          }

          return {
            ...prev,
            items: prev.items.map((t: Task) =>
              t.id === id
                ? {
                    ...t,
                    dueDate: newDeadline,
                    assigneeId: payload.RESPONSIBLE_ID ?? t.assigneeId,
                  }
                : t
            ),
          };
        });
      });

      return { previous };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['module-tasks'],
        exact: false,
      });
    },

    onError: (_err, _variables, context) => {
      if (!context?.previous) {
        return;
      }

      context.previous.forEach(([key, old]) => {
        queryClient.setQueryData(key, old);
      });

      toast.error('Не удалось обновить задачу');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Задача удалена');
    },
    onError: () => {
      toast.error('Не удалось удалить задачу');
    },
  });

  return {
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { stopTask } = useTaskTimerStore();
  const { openModal } = useTaskSelectionModalStore();

  const mutation = useMutation({
    mutationFn: async ({ taskId }: { taskId: string; silent?: boolean }) =>
      await completeTask(taskId),
    onSuccess: (data, variables) => {
      // Останавливаем задачу в таймере (если она активна)
      stopTask(variables.taskId);

      // Открываем модалку выбора следующей задачи
      if (!variables.silent) {
        openModal();
      }

      toast.success('Задача успешно завершена');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: ANY) => {
      console.error('Ошибка при завершении задачи:', error);
      toast.error('Не удалось завершить задачу');
    },
  });

  return {
    completeTask: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

