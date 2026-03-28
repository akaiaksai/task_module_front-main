// src/components/smart/meetingCalendar/utils.ts

/**
 * Утилиты для работы с календарем встреч
 */

import { parseISO } from 'date-fns';

/**
 * Статус встречи в зависимости от времени до дедлайна
 */
export interface MeetingStatus {
  backgroundColor: string;
  textColor: string;
}

/**
 * Вычисляет статус встречи на основе времени до дедлайна
 * 🔴 Красный - просрочена или осталось < 15 мин
 * 🟠 Оранжевый - осталось < 30 мин
 * 🟡 Золотой - есть время
 */
export function calculateMeetingStatus(dueDate: string | null): MeetingStatus {
  if (!dueDate) {
    return {
      backgroundColor: '#D4AF37',
      textColor: '#FFFFFF',
    };
  }

  const now = new Date();
  const deadline = parseISO(dueDate);
  const timeUntilDeadline = deadline.getTime() - now.getTime();

  // Просрочена
  if (timeUntilDeadline < 0) {
    return {
      backgroundColor: '#EF4444',
      textColor: '#FFFFFF',
    };
  }

  const minutesUntilDeadline = timeUntilDeadline / (1000 * 60);

  // Критично - меньше 15 минут
  if (minutesUntilDeadline < 15) {
    return {
      backgroundColor: '#ba6c6c',
      textColor: '#FFFFFF',
    };
  }

  // Нужно поторопиться - меньше 30 минут
  if (minutesUntilDeadline < 30) {
    return {
      backgroundColor: '#F59E0B',
      textColor: '#FFFFFF',
    };
  }

  // Есть время
  return {
    backgroundColor: '#E5B702',
    textColor: '#FFFFFF',
  };
}
