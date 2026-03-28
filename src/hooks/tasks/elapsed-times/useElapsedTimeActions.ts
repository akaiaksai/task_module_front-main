import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateElapsedTimeData,
  CreateElapsedTimeResponse,
  UpdateElapsedTimeData,
} from '@/shared/types/elapsed-time';
import {
  createElapsedTime,
  updateElapsedTime,
  deleteElapsedTime,
} from '../../../lib/api/tasks/elapsed-time';

export function useElapsedTimeActions() {
  const queryClient = useQueryClient();

  const createMutation = useMutation<
    CreateElapsedTimeResponse,
    Error,
    { taskId: number } & CreateElapsedTimeData
  >({
    mutationFn: ({ taskId, ...elapsedTimeData }) =>
      createElapsedTime(taskId, elapsedTimeData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elapsed-times', variables.taskId],
      });
    },
  });

  const updateMutation = useMutation<
    void,
    Error,
    { taskId: string; itemId: number; elapsedTimeData: UpdateElapsedTimeData }
  >({
    mutationFn: ({ taskId, itemId, elapsedTimeData }) =>
      updateElapsedTime(taskId, itemId, elapsedTimeData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elapsed-times', variables.taskId],
      });
    },
  });

  const deleteMutation = useMutation<
    void,
    Error,
    { taskId: string; itemId: number }
  >({
    mutationFn: ({ taskId, itemId }) => deleteElapsedTime(taskId, itemId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['elapsed-times', variables.taskId],
      });
    },
  });

  return {
    createElapsedTime: createMutation.mutateAsync,
    updateElapsedTime: updateMutation.mutateAsync,
    deleteElapsedTime: deleteMutation.mutateAsync,

    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
