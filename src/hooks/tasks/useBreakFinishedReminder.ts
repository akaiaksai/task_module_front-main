import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTaskTimerStore } from '@/store/task-timer';

export function useBreakFinishedReminder() {
  const lastTaskId = useTaskTimerStore((s) => s.lastTaskId);
  const startTask = useTaskTimerStore((s) => s.startTask);

  useEffect(() => {
    const handler = () => {
      toast.success('Перерыв закончился', {
        description: 'Пора возвращаться к работе',
        duration: Infinity,
      });
    };

    window.addEventListener('break-finished', handler);
    return () => window.removeEventListener('break-finished', handler);
  }, [lastTaskId, startTask]);
}
