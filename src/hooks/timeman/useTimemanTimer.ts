// hooks/useTimemanTimer.ts
import { useEffect } from 'react';
import { useTimemanStore } from '@/store/timeman';

export const useTimemanTimer = () => {
  const { status, updateElapsedTime } = useTimemanStore();

  useEffect(() => {
    if (status !== 'opened') {
      return;
    }

    const interval = setInterval(() => {
      updateElapsedTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, updateElapsedTime]);
};
