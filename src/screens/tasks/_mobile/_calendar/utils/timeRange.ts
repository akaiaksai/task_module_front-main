import { Task } from '@/shared/types/task';
import { parseISO } from 'date-fns';

const cache = new Map<string, { start: Date; end: Date }>();

export const getTaskTimeRange = (task: Task) => {
  if (!task.dueDate) {
    return null;
  }

  const key = `${task.id}-${task.dueDate}-${task.timeEstimate}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const due = parseISO(task.dueDate);
  const est = task.timeEstimate || 3600;
  const start = new Date(due.getTime() - est * 1000);

  const range = { start, end: due };
  cache.set(key, range);

  return range;
};
