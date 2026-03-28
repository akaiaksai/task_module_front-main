// hooks/tasks/elapsed-times/useElapsedTimeForPeriod.ts
import { useQuery } from '@tanstack/react-query';
import { getElapsedTimeForUser } from '../../../lib/api/tasks/elapsed-time';

export interface ElapsedTimeRecord {
  ID: number;
  CreatedDate: string;
  DateStart: string;
  DateStop: string;
  UserID: number;
  TaskID: number;
  Minutes: number;
  Seconds: number;
  CommentText: {
    String: string;
    Valid: boolean;
  };
}

// Интерфейс для ответа API
export interface ElapsedTimeResponse {
  result: ElapsedTimeRecord[];
}

export const useElapsedTimeForPeriod = (
  userId: number,
  startDate: Date,
  endDate: Date,
  viewMode: 'day' | 'week' | 'month'
) => {
  return useQuery<ElapsedTimeResponse, Error, ElapsedTimeRecord[]>({
    queryKey: [
      'elapsedTime',
      userId,
      startDate.toISOString(),
      endDate.toISOString(),
      viewMode,
    ],
    queryFn: () => getElapsedTimeForUser(userId, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 минут
    // Преобразуем ответ API в массив
    select: (data) => data.result || [],
  });
};
