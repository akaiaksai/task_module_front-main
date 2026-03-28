import { TempPanelTask } from '../views/types';
import { checkClash } from './checkClash';

export function findFreeSlotForPanelTask(
  day: Date,
  requestedHour: number,
  durationHours: number,
  tasks: ANY[],
  tempTasks: TempPanelTask[]
): { start: Date; end: Date } | null {
  const durationMs = Math.round(durationHours * 60 * 60 * 1000);

  const dayStart = new Date(day);
  dayStart.setHours(9, 0, 0, 0);

  const dayEnd = new Date(day);
  dayEnd.setHours(19, 0, 0, 0);

  let candidate = new Date(day);
  candidate.setHours(requestedHour, 0, 0, 0);

  const minutes = candidate.getMinutes();
  if (minutes >= 30) {
    candidate.setMinutes(30, 0, 0);
  } else {
    candidate.setMinutes(0, 0, 0);
  }

  if (candidate < dayStart) {
    candidate = new Date(dayStart);
  }

  const lastStart = new Date(dayEnd.getTime() - durationMs);

  for (
    let start = new Date(candidate);
    start <= lastStart;
    start = new Date(start.getTime() + 30 * 60 * 1000)
  ) {
    const end = new Date(start.getTime() + durationMs);

    if (end > dayEnd) {
      continue;
    }

    if (!checkClash(start, end, tasks, tempTasks)) {
      return { start, end };
    }
  }

  return null;
}
