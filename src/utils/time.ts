// utils/timeFormat.ts
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTimeHMS = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
};

// Альтернативная версия для дебаггинга
export const formatTimeDebug = (milliseconds: number): string => {
  const totalSeconds = milliseconds / 1000;
  return `${totalSeconds.toFixed(1)}s (${milliseconds}ms)`;
};

export const msToHours = (ms: number): number => {
  return ms / (1000 * 60 * 60);
};

// Конвертируем секунды в часы
export const secondsToHours = (seconds: number): number => {
  return seconds / (60 * 60);
};

// Рассчитываем норму часов для периода
export const getPeriodNorm = (viewMode: 'day' | 'week' | 'month'): number => {
  switch (viewMode) {
    case 'day':
      return 9; // 8 часов в день (45/5.5 дней в неделю)
    case 'week':
      return 45; // 45 часов в неделю
    case 'month':
      return 180; // 45 * 4 недели
    default:
      return 45;
  }
};
