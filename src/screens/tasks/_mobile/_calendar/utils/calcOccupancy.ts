// import { secondsToHours } from 'date-fns';
// import { calculateOccupancyPercentage } from '@/utils/occupancyCalculator';
// import { getPeriodNorm } from '@/utils/time';

import { calculateOccupancyPercentage } from '@/utils/occupancyCalculator';
import { getPeriodNorm } from '@/utils/time';
import { secondsToHours } from 'date-fns';

export interface OccupancyResult {
  percentage: number;
  estimatedHours: number;
  elapsedHours: number;
}

// export function calcOccupancy(
//   memberTasksInPeriod: ANY[],
//   elapsedTimes: ANY[],
//   viewMode: 'day' | 'week' | 'month'
// ): OccupancyResult | null {
//   if (!elapsedTimes || elapsedTimes.length === 0) {
//     return null;
//   }

//   const totalEstimatedS = memberTasksInPeriod.reduce(
//     (sum, t) => sum + (t.timeEstimate || 0),
//     0
//   );

//   const totalElapsedSeconds = elapsedTimes.reduce(
//     (sum, rec) => sum + (rec.Seconds || 0),
//     0
//   );

//   const periodNorm = getPeriodNorm(viewMode);
//   const percentage = calculateOccupancyPercentage(
//     totalEstimatedS,
//     totalElapsedSeconds,
//     periodNorm
//   );

//   return {
//     percentage,
//     estimatedHours: secondsToHours(totalEstimatedS),
//     elapsedHours: secondsToHours(totalElapsedSeconds),
//   };
// }

// НОВАЯ
export function calcOccupancy(
  memberTasksInPeriod: ANY[],
  elapsedTimes: ANY[],
  viewMode: 'day' | 'week' | 'month'
): OccupancyResult | null {
  if (!elapsedTimes) {
    return null;
  }

  // elapsed по задачам
  const elapsedByTask = new Map<number | string, number>();

  for (const rec of elapsedTimes) {
    const taskId = rec.TaskId ?? rec.taskId ?? rec.TASK_ID;
    if (!taskId) {
      continue;
    }

    const seconds = Number(rec.Seconds ?? 0);
    elapsedByTask.set(taskId, (elapsedByTask.get(taskId) ?? 0) + seconds);
  }

  // X = сумма остатков по задачам
  let remainingTaskSeconds = 0;
  let totalEstimatedSeconds = 0;

  for (const task of memberTasksInPeriod) {
    const taskId = task.id ?? task.ID;
    const estimated = Number(task.timeEstimate ?? 0);
    const elapsed = elapsedByTask.get(taskId) ?? 0;

    totalEstimatedSeconds += estimated;

    const diff = estimated - elapsed;
    if (diff > 0) {
      remainingTaskSeconds += diff;
    }
  }

  // НОРМА ПЕРИОДА (НЕ вычитаем elapsed!)
  const normSeconds = getPeriodNorm(viewMode) * 3600;

  const percentage = calculateOccupancyPercentage(
    remainingTaskSeconds,
    normSeconds
  );

  return {
    percentage,
    estimatedHours: secondsToHours(totalEstimatedSeconds),
    elapsedHours: secondsToHours(
      elapsedTimes.reduce((s, r) => s + Number(r.Seconds ?? 0), 0)
    ),
  };
}
