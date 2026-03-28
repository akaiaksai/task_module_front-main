import { useEffect } from 'react';
import { useTaskTimerStore } from '@/store/task-timer';
import { useBreakTimerStore } from '@/store/break-timer';

export function useBreakAutoCancelOnTaskStart() {
  const activeTaskId = useTaskTimerStore((s) => s.activeTaskId);
  const breakEndsAt = useBreakTimerStore((s) => s.breakEndsAt);
  const clearBreak = useBreakTimerStore((s) => s.clearBreak);

  useEffect(() => {
    if (activeTaskId && breakEndsAt) {
      clearBreak();
    }
  }, [activeTaskId, breakEndsAt, clearBreak]);
}
