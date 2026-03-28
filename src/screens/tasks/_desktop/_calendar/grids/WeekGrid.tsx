import { getGroupColor } from '@/screens/tasks/_mobile/_calendar/utils/colors';
import { getTaskTimeRange } from '@/screens/tasks/_mobile/_calendar/utils/timeRange';
import { Task } from '@/shared/types/task';

import Skeleton from '@/ui/Skeleton';
import { addDays, endOfDay, format, startOfDay, startOfWeek } from 'date-fns';
import { memo, useMemo } from 'react';

type TaskWithPosition = {
  task: Task;
  position: {
    top: string;
    height: string;
  };
  isSmall: boolean;
};

type TaskWithLayout = TaskWithPosition & {
  layout: {
    column: number;
    totalColumns: number;
  };
};

export const WeekGrid = memo(
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
    const { days, hours, daysWithTaskData } = useMemo(() => {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

      const hours = Array.from({ length: 15 }, (_, i) => {
        const hour = new Date(anchorDate);
        hour.setHours(i + 9, 0, 0, 0);
        return hour;
      });

      const tasksWithDeadline = tasks.filter((task) => task.dueDate);

      function overlaps(a: TaskWithPosition, b: TaskWithPosition) {
        const aTop = parseFloat(a.position.top);
        const aBottom = aTop + parseFloat(a.position.height);

        const bTop = parseFloat(b.position.top);
        const bBottom = bTop + parseFloat(b.position.height);

        return aTop < bBottom && bTop < aBottom;
      }

      function groupOverlappingTasks(tasks: TaskWithPosition[]) {
        const groups: TaskWithPosition[][] = [];

        tasks.forEach((task) => {
          let placed = false;

          for (const group of groups) {
            if (group.some((t) => overlaps(t, task))) {
              group.push(task);
              placed = true;
              break;
            }
          }

          if (!placed) {
            groups.push([task]);
          }
        });

        return groups;
      }

      const isDayInTaskRange = (task: Task, day: Date) => {
        const range = getTaskTimeRange(task);
        if (!range) {
          return false;
        }

        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        return dayStart <= range.end && dayEnd >= range.start;
      };

      const getTaskPositionInDay = (task: Task, day: Date) => {
        const range = getTaskTimeRange(task);
        if (!range) {
          return null;
        }

        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const start = range.start < dayStart ? dayStart : range.start;
        const end = range.end > dayEnd ? dayEnd : range.end;

        const calendarStartHour = 8;
        const calendarEndHour = 23;

        if (end.getHours() < calendarStartHour) {
          return null;
        }

        if (start.getHours() > calendarEndHour) {
          return null;
        }

        const slots = calendarEndHour - calendarStartHour + 1;

        const getY = (date: Date) => {
          let h = date.getHours();
          let m = date.getMinutes();

          if (h < calendarStartHour) {
            h = calendarStartHour;
            m = 0;
          }
          if (h > calendarEndHour) {
            h = calendarEndHour;
            m = 59;
          }

          const hourIndex = h - calendarStartHour;
          const fraction = m / 60;

          return ((hourIndex + fraction) / slots) * 100;
        };

        const top = getY(start);
        const bottom = getY(end);

        if (bottom <= top) {
          return null;
        }

        return {
          top: `${top}%`,
          height: `${bottom - top}%`,
        };
      };

      const daysWithTaskData = days.map((day) => {
        const dayTasks = tasksWithDeadline.filter((task) =>
          isDayInTaskRange(task, day)
        );

        const tasksWithPositions: TaskWithPosition[] = dayTasks
          .map((task) => {
            const position = getTaskPositionInDay(task, day);
            if (!position) {
              return null;
            }

            return {
              task,
              position,
              isSmall: parseFloat(position.height) < 14.3,
            };
          })
          .filter(Boolean) as TaskWithPosition[];

        const tasksWithLayout: TaskWithLayout[] = [];

        const overlapGroups = groupOverlappingTasks(tasksWithPositions);

        overlapGroups.forEach((group) => {
          const totalColumns = group.length;

          group.forEach((item, index) => {
            tasksWithLayout.push({
              ...item,
              layout: {
                column: index,
                totalColumns,
              },
            });
          });
        });

        return { day, tasks: tasksWithLayout };
      });

      return { days, hours, tasksWithDeadline, daysWithTaskData };
    }, [tasks, anchorDate]);

    const calculateZIndex = (height: string, column: number) => {
      const heightValue = parseFloat(height);
      const baseZIndex = 10 + column;

      if (heightValue <= 15) {
        return baseZIndex + 10;
      }
      if (heightValue <= 25) {
        return baseZIndex + 5;
      }
      if (heightValue <= 40) {
        return baseZIndex + 1;
      }
      return baseZIndex;
    };

    return (
      <div className="rounded-[14px] shadow-soft border border-[#0000001A]">
        <div className="bg-white rounded-[14px] overflow-hidden">
          <div className="overflow-auto">
            <div
              className="grid min-w-[800px] lg:min-w-0 relative"
              style={{
                gridTemplateColumns: '71px repeat(7, minmax(120px,1fr))',
              }}
            >
              <div className="bg-white border-r" />

              {days.map((d, i) => (
                <div
                  key={`dh-${i}`}
                  className={`text-center min-h-[39px] flex items-center justify-center text-[12px] font-normal leading-[130%] cursor-pointer hover:bg-neutral-50 ${
                    i !== days.length - 1 ? 'border-r' : ''
                  }`}
                  onClick={() => onOpenDay(d)}
                >
                  {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()]}{' '}
                  {format(d, 'd')}
                </div>
              ))}

              <div
                className="col-span-8 relative"
                style={{ gridColumn: '1 / -1' }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '71px repeat(7, minmax(120px,1fr))',
                  }}
                >
                  <div className="contents">
                    <div className="border-r min-h-[37px] border-t bg-white" />
                    {days.map((_, di) => (
                      <div
                        key={`empty-${di}`}
                        className={`min-h-[37px] bg-white border-t ${
                          di === days.length - 1 ? '' : 'border-r'
                        }`}
                      />
                    ))}
                  </div>
                  {hours.map((h, hi) => (
                    <div key={hi} className="contents">
                      <div className="relative border-t border-r min-h-[37px]">
                        <span className="absolute left-[20px] -top-[8px] text-[12px] font-normal leading-[130%] text-[#00000080] bg-white">
                          {format(h, 'HH:00')}
                        </span>
                      </div>

                      {days.map((d, di) => (
                        <div
                          key={`c-${hi}-${di}`}
                          className={`border-t min-h-[37px] relative bg-white ${
                            di === days.length - 1 ? '' : 'border-r'
                          }`}
                        >
                          {loading && hi === 0 && di === 0 && (
                            <Skeleton className="h-4 w-24" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ marginLeft: '71px' }}
                >
                  <div
                    className="grid h-full w-full"
                    style={{
                      gridTemplateColumns: 'repeat(7, minmax(120px,1fr))',
                    }}
                  >
                    {daysWithTaskData.map(({ day, tasks }, di) => (
                      <div
                        key={`task-day-${di}`}
                        className="relative pointer-events-auto"
                      >
                        {!loading &&
                          tasks.map(({ task, position, layout }) => {
                            const groupColor = getGroupColor(task.groupId);
                            if (!position) {
                              return null;
                            }

                            const columnWidth = 100 / layout.totalColumns;
                            const left = layout.column * columnWidth;

                            return (
                              <button
                                key={`task-${task.id}-${day.getTime()}`}
                                className={`absolute cursor-pointer text-xs overflow-hidden`}
                                style={{
                                  top: position.top,
                                  height: position.height,
                                  left: `${left}%`,
                                  width: `${columnWidth}%`,
                                  zIndex: calculateZIndex(
                                    position.height,
                                    layout.column
                                  ),
                                  minHeight: '20px',
                                  margin: 0,
                                  padding: 0,
                                  backgroundColor: groupColor.bg,
                                  border: `1px solid ${groupColor.border}`,
                                  color: groupColor.text,
                                }}
                                onClick={() => onOpenTask(task.id)}
                              >
                                <div
                                  className={`h-full flex ${
                                    parseFloat(position.height) > 30
                                      ? 'items-start justify-start p-0.5'
                                      : parseFloat(position.height) > 15
                                        ? 'items-start justify-center p-0.5'
                                        : 'items-start justify-center p-0.5'
                                  }`}
                                >
                                  <span
                                    className={`${
                                      parseFloat(position.height) > 30
                                        ? 'text-[7px] line-clamp-2 text-left leading-tight break-words'
                                        : parseFloat(position.height) > 15
                                          ? 'text-[7px] truncate text-left leading-tight w-full'
                                          : 'text-[7px] truncate text-left leading-tight w-full'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

WeekGrid.displayName = 'WeekGrid';
