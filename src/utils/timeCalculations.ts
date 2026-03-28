// utils/timeCalculations.ts
export class TimeCalculator {
  static calculateElapsedTime(
    startTime: number | null,
    totalElapsed: number,
    isRunning: boolean
  ): number {
    if (!startTime || !isRunning) {
      return totalElapsed;
    }

    const now = Date.now();
    return totalElapsed + (now - startTime);
  }

  static formatToReadable(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    }
    if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    }
    return `${secs}с`;
  }

  static validateTimeInput(time: number): boolean {
    return Number.isFinite(time) && time >= 0 && time < Number.MAX_SAFE_INTEGER;
  }
}
