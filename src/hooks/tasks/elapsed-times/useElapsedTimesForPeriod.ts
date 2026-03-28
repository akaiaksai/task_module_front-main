// hooks/tasks/useElapsedTimesForPeriod.ts
import { useMemo } from 'react';
import { useElapsedTimeForPeriod } from './useElapsedTimeForPeriod';

export const useElapsedTimesForPeriod = (
  userId: number,
  startDate: Date,
  endDate: Date
) => {
  const {
    data: elapsedTimeData,
    isLoading,
    error,
  } = useElapsedTimeForPeriod(userId, startDate, endDate, 'week');

  // Преобразуем данные в карту taskId -> totalSeconds
  const elapsedTimesMap = useMemo(() => {
    const map: Record<number, number> = {};

    if (elapsedTimeData) {
      elapsedTimeData.forEach((record) => {
        const taskId = record.TaskID;
        const totalSeconds = record.Minutes * 60 + record.Seconds;

        if (map[taskId]) {
          map[taskId] += totalSeconds;
        } else {
          map[taskId] = totalSeconds;
        }
      });
    }

    return map;
  }, [elapsedTimeData]);

  return {
    elapsedTimesMap,
    isLoading,
    error,
  };
};
