import type {
  CreateCommentData,
  CreateCommentResponse,
  UpdateCommentData,
} from '@/shared/types/comment';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createComment,
  deleteComment,
  updateComment,
} from '../../../lib/api/tasks/comments';

export function useCommentActions(taskId: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation<
    CreateCommentResponse,
    Error,
    CreateCommentData
  >({
    mutationFn: (commentData) => createComment(taskId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const updateMutation = useMutation<
    void,
    Error,
    { commentId: number; commentData: UpdateCommentData }
  >({
    mutationFn: ({ commentId, commentData }) =>
      updateComment(taskId, commentId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (commentId) => deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  return {
    createComment: createMutation.mutateAsync,
    updateComment: updateMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,

    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
