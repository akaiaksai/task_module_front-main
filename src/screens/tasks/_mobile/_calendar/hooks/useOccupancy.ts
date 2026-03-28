import { useMemo } from 'react';
import { calcOccupancy, OccupancyResult } from '../utils/calcOccupancy';
import { getPeriodRange } from '@/utils/occupancyCalculator';
import { useElapsedTimeForPeriod } from '@/hooks/tasks/elapsed-times/useElapsedTimeForPeriod';

export function useOccupancy(
  userId: number,
  tasks: ANY[],
  currentDate: Date,
  viewMode: 'day' | 'week' | 'month'
): OccupancyResult {
  const periodRange = getPeriodRange(currentDate, viewMode);

  const { data: elapsedTimes } = useElapsedTimeForPeriod(
    userId,
    periodRange.start,
    periodRange.end,
    viewMode
  );

  const memberTasksInPeriod = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      const date = new Date(task.dueDate);
      return date >= periodRange.start && date <= periodRange.end;
    });
  }, [tasks, currentDate, viewMode]);

  return useMemo(() => {
    const result = calcOccupancy(
      memberTasksInPeriod,
      elapsedTimes || [],
      viewMode
    );

    if (!result) {
      return {
        percentage: 0,
        estimatedHours: 0,
        elapsedHours: 0,
      };
    }

    return result;
  }, [elapsedTimes, memberTasksInPeriod, viewMode]);
}
