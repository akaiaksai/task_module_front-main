import { useQuery } from '@tanstack/react-query';
import { getElapsedTimeForUser } from '@/lib/api/tasks/elapsed-time';

export function useUserElapsed(userId: number | null, start: Date, end: Date) {
  return useQuery({
    queryKey: ['elapsed-time', userId, start.toISOString(), end.toISOString()],
    queryFn: () => getElapsedTimeForUser(userId!, start, end),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
