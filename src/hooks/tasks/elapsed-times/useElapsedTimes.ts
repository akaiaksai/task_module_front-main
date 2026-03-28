import { useQuery } from '@tanstack/react-query';
import type { ElapsedTimeResponse } from '@/shared/types/elapsed-time';
import { fetchElapsedTimes } from '../../../lib/api/tasks/elapsed-time';

export function useElapsedTimes(taskId: string) {
  return useQuery<ElapsedTimeResponse, Error>({
    queryKey: ['elapsed-times', taskId],
    queryFn: () => fetchElapsedTimes(taskId),
    enabled: !!taskId,
  });
}
