import React, { useMemo } from 'react';
import { useElapsedTimeForPeriod } from '../../../hooks/tasks/elapsed-times/useElapsedTimeForPeriod';
import { WorkClock } from '@/components/icons/workClock';

interface WorkTimeCardProps {
  userId: number;
}

export const WorkTimeCard: React.FC<WorkTimeCardProps> = ({ userId }) => {
  const now = new Date();

  const { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd } =
    useMemo(() => {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(now);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      return { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd };
    }, [now]);

  const todayData = useElapsedTimeForPeriod(
    userId,
    todayStart,
    todayEnd,
    'day'
  );
  const weekData = useElapsedTimeForPeriod(userId, weekStart, weekEnd, 'week');
  const monthData = useElapsedTimeForPeriod(
    userId,
    monthStart,
    monthEnd,
    'month'
  );

  const calculateTotalHours = (data: ANY[]) => {
    if (!data || data.length === 0) {
      return 0;
    }

    const totalSeconds = data.reduce((sum, record) => {
      return sum + record.Seconds;
    }, 0);

    return totalSeconds / 3600;
  };

  const todayHours = calculateTotalHours(todayData.data || []);
  const weekHours = calculateTotalHours(weekData.data || []);
  const monthHours = calculateTotalHours(monthData.data || []);

  const getWorkingDaysInMonth = () => {
    const year = now.getFullYear();
    const month = now.getMonth();
    let count = 0;
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  };

  const todayNorm = 9;
  const weekNorm = 45;
  const monthNorm = 9 * getWorkingDaysInMonth();

  // Определяем статусы
  const getStatus = (
    hours: number,
    norm: number
  ): 'Выполнено' | 'Требует завершения' => {
    return hours >= norm ? 'Выполнено' : 'Требует завершения';
  };

  const todayStatus = getStatus(todayHours, todayNorm);
  const weekStatus = getStatus(weekHours, weekNorm);
  const monthStatus = getStatus(monthHours, monthNorm);

  const formatTime = (hours: number) => {
    const totalMinutes = hours * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-mobile-header rounded-[10.81px] px-[11.58px] py-[10.81px] text-white">
      <div className="flex items-center gap-3 mb-[10px] px-[4px] py-[3.5px]">
        <WorkClock width={18} height={20} />
        <span className="font-normal text-[18px] leading-[130%] tracking-[-0.5px]">
          Рабочее время
        </span>
      </div>

      <div className="mb-[28px]">
        <div className="font-normal text-[18px] leading-[130%] tracking-[-0.5px]">
          Выполнено
        </div>
        <div className="flex flex-wrap gap-2">
          {todayStatus === 'Выполнено' && (
            <div className="bg-green-500 rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span>Сегодня</span>
              <span className="font-medium">{formatTime(todayHours)}</span>
            </div>
          )}
          {weekStatus === 'Выполнено' && (
            <div className="bg-green-500 rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span>Неделя</span>
              <span className="font-medium">{formatTime(weekHours)}</span>
            </div>
          )}
          {monthStatus === 'Выполнено' && (
            <div className="bg-green-500 rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span>Месяц</span>
              <span className="font-medium">{formatTime(monthHours)}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="font-normal text-[18px] leading-[130%] tracking-[-0.5px] mb-[10px]">
          Требует завершения
        </div>
        <div className="flex flex-wrap gap-2">
          {todayStatus === 'Требует завершения' && (
            <div className="bg-white rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span className="text-gray-900">Сегодня</span>
              <span className="font-medium text-gray-900">
                {formatTime(todayHours)}
              </span>
            </div>
          )}
          {weekStatus === 'Требует завершения' && (
            <div className="bg-white rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span className="text-gray-900">Неделя</span>
              <span className="font-medium text-gray-900">
                {formatTime(weekHours)}
              </span>
            </div>
          )}
          {monthStatus === 'Требует завершения' && (
            <div className="bg-white rounded-[4px] px-[8px] py-[4px] inline-flex items-center gap-2 text-[14px] tracking-[-0.5px] font-normal">
              <span className="text-gray-900">Месяц</span>
              <span className="font-medium text-gray-900">
                {formatTime(monthHours)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
