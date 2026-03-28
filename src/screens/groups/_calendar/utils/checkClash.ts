import { getTaskTimeRange } from '@/screens/tasks/_mobile/_calendar/utils/timeRange';
import { TempPanelTask } from '../views/types';

export function checkClash(
  start: Date,
  end: Date,
  tasks: ANY[],
  temp: TempPanelTask[],
  currentTaskId?: number
) {
  const all = [
    ...tasks
      .filter((t) => String(t.id) !== String(currentTaskId))
      .map((t) => getTaskTimeRange(t)),
    ...temp.map((t) => ({ start: t.start, end: t.end })),
  ].filter(Boolean);

  return all.some((t) => t && start < t.end && end > t.start);
}
