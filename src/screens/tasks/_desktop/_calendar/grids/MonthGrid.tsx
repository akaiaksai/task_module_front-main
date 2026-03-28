import { SandClock } from '@/components/icons/sandClock';
import { getGroupColor } from '@/screens/tasks/_mobile/_calendar/utils/colors';
import { Task } from '@/shared/types/task';
import { getRemainingMinutes, sumElapsedMinutes } from '@/shared/utils/helpers';

import Skeleton from '@/ui/Skeleton';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { memo, useCallback, useMemo } from 'react';

export const MonthGrid = memo(
  ({
    tasks,
    anchorDate,
    loading,
    onOpenDay,
    onOpenTask,
  }: {
    tasks: Task[];
    anchorDate: Date;
    loading?: boolean;
    onOpenDay: (d: Date) => void;
    onOpenTask: (id: string) => void;
  }) => {
    const { daysWithTasks, days } = useMemo(() => {
      const start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      const tasksWithDeadline = tasks.filter((task) => task.dueDate);

      const isDayInTaskRange = (task: Task, day: Date) => {
        if (!task.dueDate) {
          return false;
        }

        const dueDate = parseISO(task.dueDate);
        const timeEstimate = task.timeEstimate || 0;
        const startDate = new Date(dueDate.getTime() - timeEstimate * 1000);

        const dayStart = startOfDay(day);
        const taskStart = startOfDay(startDate);
        const taskEnd = startOfDay(dueDate);

        return dayStart >= taskStart && dayStart <= taskEnd;
      };

      const daysWithTasks = days.map((day) => {
        const dayTasks = tasksWithDeadline.filter((t) =>
          isDayInTaskRange(t, day)
        );
        return { day, dayTasks };
      });

      return { days, daysWithTasks };
    }, [tasks, anchorDate]);

    const desktopHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const dayCells = useMemo(
      () =>
        daysWithTasks.map(({ day, dayTasks }, index) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = format(day, 'M') === format(anchorDate, 'M');

          return (
            <MonthDayCell
              key={day.toISOString()}
              day={day}
              dayTasks={dayTasks}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
              loading={loading}
              onOpenDay={onOpenDay}
              onOpenTask={onOpenTask}
              index={index}
              totalDays={days.length}
            />
          );
        }),
      [daysWithTasks, anchorDate, loading, onOpenDay, onOpenTask]
    );

    return (
      <div className="overflow-x-auto w-full shadow-soft border rounded-2xl border-[#0000001A]">
        <div className="bg-white min-w-[1150px]">
          <div className="grid grid-cols-7 text-[12px] text-black">
            {/* Десктопные заголовки */}
            {desktopHeaders.map((h, index) => (
              <div
                key={`desktop-${h}-${index}`}
                className={`text-center py-[11.5px] px-[66.93px] border-b font-normal leading-[130%] tracking-[-0.5px] ${index !== desktopHeaders.length - 1 ? 'border-r border-gray-200' : ''}`}
              >
                {h}
              </div>
            ))}

            {/* Мобильные заголовки дней */}

            {dayCells}
          </div>
        </div>
      </div>
    );
  }
);

MonthGrid.displayName = 'MonthGrid';

const MonthDayCell = memo(
  ({
    day,
    dayTasks,
    isToday,
    isCurrentMonth,
    loading,
    onOpenDay,
    onOpenTask,
    index,
    totalDays,
  }: {
    day: Date;
    dayTasks: Task[];
    isToday: boolean;
    isCurrentMonth: boolean;
    loading?: boolean;
    onOpenDay: (d: Date) => void;
    onOpenTask: (id: string) => void;
    index: number;
    totalDays: number;
  }) => {
    const handleCellClick = useCallback(() => onOpenDay(day), [onOpenDay, day]);

    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

    const isLastCol = index % 7 === 6;
    const isLastRow = index >= totalDays - 7;

    const handleTaskClick = useCallback(
      (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        onOpenTask(taskId);
      },
      [onOpenTask]
    );

    const desktopTasks = useMemo(() => {
      if (loading) {
        return <Skeleton className="h-4 w-24 mt-2" />;
      }

      if (dayTasks.length === 1) {
        const t = dayTasks[0];
        const color = getGroupColor(t.groupId);

        const elapsedMin = sumElapsedMinutes(t.elapsed ?? []);
        const timeInfo = getRemainingMinutes(t, elapsedMin);

        return (
          <button
            onClick={(e) => handleTaskClick(e, t.id)}
            className="w-full mt-2 rounded-[10px] px-[9px] py-[10px] text-left text-[#2A2D61] transition-colors"
            style={{ backgroundColor: color.bg }}
          >
            <div className="text-[10px] font-normal leading-[130%] tracking-[-0.5px] line-clamp-2">
              {t.title}
            </div>

            <div className="my-[6px] h-[1px] w-full bg-[#2A2D611A]" />

            <div className="flex items-center text-[10px] text-[#2A2D61] gap-1">
              <SandClock />
              <span>
                {timeInfo.totalPlanMin} мин - {timeInfo.elapsedMin} мин ={' '}
                {timeInfo.remainingMin} мин
              </span>
            </div>
          </button>
        );
      }

      if (dayTasks.length === 2) {
        return (
          <>
            {dayTasks.map((t) => {
              const color = getGroupColor(t.groupId);
              return (
                <button
                  key={t.id}
                  onClick={(e) => handleTaskClick(e, t.id)}
                  className="w-full mt-1 rounded-[10px] px-[9px] py-[10px] text-left text-[#2A2D61] transition-colors"
                  style={{ backgroundColor: color.bg }}
                >
                  <div className="text-[10px] font-normal leading-[130%] tracking-[-0.5px] line-clamp-2">
                    {t.title}
                  </div>
                </button>
              );
            })}
          </>
        );
      }

      return (
        <>
          {dayTasks.slice(0, 3).map((t) => {
            const groupColor = getGroupColor(t.groupId);
            return (
              <button
                key={t.id}
                className={`mt-1 text-[10px] leading-[130%] tracking-[-0.5px] font-normal truncate w-full text-left hover:underline px-[9px] py-[3px] rounded-[10px] text-[#2A2D61] transition-colors`}
                style={{
                  backgroundColor: groupColor.bg,
                  borderColor: groupColor.border,
                }}
                onClick={(e) => handleTaskClick(e, t.id)}
              >
                {t.title}
              </button>
            );
          })}
          {dayTasks.length > 3 && (
            <div className="mt-1 ml-[9px] text-[10px] font-normal tracking-[-0.5px] leading-[130%] text-[#00000080]">
              Еще {dayTasks.length - 3} задач…
            </div>
          )}
        </>
      );
    }, [dayTasks, loading, handleTaskClick]);

    return (
      <div
        className={`min-h-[111px] min-w-[163.86px] bg-white px-[3px] py-[4px] cursor-pointer transition-colors hover:bg-gray-50 ${!isLastCol ? 'border-r' : ''}
    ${!isLastRow ? 'border-b' : ''}  ${
      !isCurrentMonth ? 'bg-gray-50 text-gray-400 ' : ''
    } ${isToday ? 'bg-blue-50 border border-blue-200' : ''} border-[#0000001A]`}
        onClick={handleCellClick}
      >
        <div
          className={`text-[12px] font-normal leading-[130%] tracking-[-0.5px] flex justify-end ${
            !isCurrentMonth ? 'text-gray-400' : 'text-black'
          }`}
        >
          <span
            className={`
        ${isToday ? 'font-bold text-blue-600' : ''}
        ${isWeekend && !isToday ? 'text-red-500' : ''}
      `}
          >
            {format(day, 'd')}
          </span>
        </div>

        {desktopTasks}
      </div>
    );
  }
);

MonthDayCell.displayName = 'MonthDayCell';
