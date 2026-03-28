import { ElapsedTimeResponse } from '@/shared/types/elapsed-time';

export function computeElapsedSeconds(data?: ElapsedTimeResponse): number {
  if (!data?.result) {
    return 0;
  }

  return data.result.reduce((total, r) => total + r.Seconds, 0);
}
