// import { secondsToHours } from './time';

// export const calculateOccupancyPercentage = (
//   timeEstimateMs: number,
//   elapsedTimeSeconds: number,
//   periodNorm: number
// ): number => {
//   const estimatedHours = secondsToHours(timeEstimateMs);
//   const elapsedHours = secondsToHours(elapsedTimeSeconds);

//   const percentage = ((estimatedHours - elapsedHours) * 100) / periodNorm;

//   return Math.abs(Math.round(percentage * 100) / 100);
// };

// // Получаем цвет индикатора занятости
// export const getOccupancyColor = (percentage: number): string => {
//   if (percentage < 60) {
//     return 'bg-[#53C41A] border-[#C9FFCB52] text-black';
//   }
//   if (percentage < 90) {
//     return 'bg-[#E5B702] border-yellow-200 text-black';
//   }
//   if (percentage < 110) {
//     return 'bg-[#E57002] border-orange-200 text-black';
//   }
//   return 'bg-[#EF4642] border-red-200 text-black';
// };

// // Получаем текст для тултипа
// export const getOccupancyText = (
//   percentage: number,
//   estimatedHours: number,
//   elapsedHours: number
// ): string => {
//   return `Занятость: ${percentage}% (Заявлено: ${estimatedHours.toFixed(
//     1
//   )}ч, Затрачено: ${elapsedHours.toFixed(1)}ч)`;
// };

// НОВАЯ
export const calculateOccupancyPercentage = (
  remainingTaskSeconds: number,
  normSeconds: number
): number => {
  if (normSeconds <= 0) {
    return 0;
  }
  return Math.round((remainingTaskSeconds * 100) / normSeconds);
};

export const getOccupancyColor = (percentage: number): string => {
  if (percentage < 60) {
    return 'bg-[#53C41A] border-[#C9FFCB52] text-black';
  }
  if (percentage < 90) {
    return 'bg-[#E5B702] border-yellow-200 text-black';
  }
  if (percentage < 110) {
    return 'bg-[#E57002] border-orange-200 text-black';
  }
  return 'bg-[#EF4642] border-red-200 text-black';
};

export const getOccupancyText = (
  percentage: number,
  remainingTaskHours: number,
  remainingNormHours: number
): string => {
  return `Занятость: ${percentage}% (Осталось по задачам: ${remainingTaskHours.toFixed(
    1
  )}ч, Осталось нормы: ${remainingNormHours.toFixed(1)}ч)`;
};

// Получаем диапазон дат для периода
export const getPeriodRange = (
  currentDate: Date,
  viewMode: 'day' | 'week' | 'month'
): { start: Date; end: Date } => {
  const start = new Date(currentDate);
  const end = new Date(currentDate);

  switch (viewMode) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week': {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Понедельник как начало недели
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};
