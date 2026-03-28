import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTaskResults,
  addCommentAsResult,
  removeCommentFromResults,
} from '../../../lib/api/tasks/results';

export const useTaskResults = (taskId: string | number) => {
  return useQuery({
    queryKey: ['taskResults', taskId],
    queryFn: () => fetchTaskResults(taskId),
    enabled: !!taskId,
  });
};

export const useAddCommentAsResult = (taskId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => addCommentAsResult(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskResults', taskId] });
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
    },
  });
};

export const useRemoveCommentFromResults = (taskId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) =>
      removeCommentFromResults(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskResults', taskId] });
      queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
    },
  });
};
