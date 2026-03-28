import { useElapsedTimes } from '@/hooks/tasks/elapsed-times/useElapsedTimes';

import { computeElapsedSeconds } from './computeElapsedSeconds';
import { getTaskTimeStatus } from './taskStatus';
import { Task } from '@/shared/types/task';

export function useTaskTimeStatus(task: Task) {
  const { data, isLoading } = useElapsedTimes(String(task.id));

  const elapsedSeconds = computeElapsedSeconds(data);
  const timeStatus = getTaskTimeStatus(task, elapsedSeconds);

  return { timeStatus, elapsedSeconds, isLoading };
}
