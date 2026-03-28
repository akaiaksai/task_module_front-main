import { Task } from '@/shared/types/task';

export function buildElapsedMap(records: ANY[]) {
  const map: Record<number, number> = {};

  records.forEach((r) => {
    const taskId = Number(r.TaskID);
    const seconds = Number(r.Seconds || 0);

    if (!taskId) {
      return;
    }

    map[taskId] = (map[taskId] || 0) + seconds;
  });

  return map;
}

export function calcProjectProgress(
  tasks: Task[],
  elapsedMap: Record<number, number>
) {
  let planned = 0;
  let elapsed = 0;

  tasks.forEach((task) => {
    const estimate = Number(task.timeEstimate || 0);
    planned += estimate;

    elapsed += elapsedMap[Number(task.id)] || 0;
  });

  if (planned === 0) {
    return 0;
  }

  // return Math.min(100, Math.round((elapsed / planned) * 100));
  return Math.round((elapsed / planned) * 100);
}
