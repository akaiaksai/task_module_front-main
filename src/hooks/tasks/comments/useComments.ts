import { useQuery } from '@tanstack/react-query';
import type { CommentsResponse } from '@/shared/types/comment';
import { fetchComments } from '../../../lib/api/tasks/comments';

export function useComments(taskId: string) {
  return useQuery<CommentsResponse, Error>({
    queryKey: ['comments', taskId],
    queryFn: () => fetchComments(taskId),
    enabled: Boolean(taskId),
  });
}
