import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useBreakWatcher() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startWatching = (endsAt: string | number) => {
    const end =
      typeof endsAt === 'string' ? new Date(endsAt).getTime() : endsAt;

    const delay = end - Date.now();

    if (delay <= 0) {
      toast.warning('Перерыв закончился', {
        description: 'Пора вернуться к работе!',
        duration: 8000,
      });
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      toast.warning('Перерыв закончился', {
        description: 'Пора вернуться к работе!',
        duration: 8000,
      });
    }, delay);
  };

  const stopWatching = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // cleanup при размонтировании
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    startWatching,
    stopWatching,
  };
}
