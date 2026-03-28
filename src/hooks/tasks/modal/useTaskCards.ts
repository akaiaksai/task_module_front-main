import { useMemo } from 'react';
import { useTask } from '@/hooks/tasks/useTaskActions';
import { useElapsedTimes } from '@/hooks/tasks/elapsed-times/useElapsedTimes';
import { ElapsedTimeRecord } from '@/hooks/tasks/elapsed-times/useElapsedTimeForPeriod';

function calcElapsedMsFromApi(records: ElapsedTimeRecord[] = []) {
  return records.reduce((sum, r) => sum + Number(r.Seconds ?? 0) * 1000, 0);
}

export function useTaskCard(task: ANY) {
  const { data: fullTask } = useTask(task.id);
  const { data: elapsedResp } = useElapsedTimes(task.id);

  const elapsedMs = useMemo(
    () => calcElapsedMsFromApi(elapsedResp?.result),
    [elapsedResp]
  );

  const previewImage = useMemo(() => {
    const files = fullTask?.files;
    if (!Array.isArray(files)) {
      return undefined;
    }
    return files.find((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name));
  }, [fullTask]);

  const plannedMs = task?.timeEstimate ? task.timeEstimate * 1000 : 0;

  function mapTaskToActiveCard(task: ANY, usersMap: Map<number, ANY>) {
    return {
      task,
      elapsedMs: 0,
      assignee: usersMap.get(task.assigneeId),
      createdBy: usersMap.get(task.createdBy),
      onPause: undefined,
      onComplete: undefined,
    };
  }

  return {
    fullTask,
    elapsedMs,
    plannedMs,
    previewImage,
    mapTaskToActiveCard,
  };
}
