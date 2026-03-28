import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PreviewTask, TempPanelTask } from './types';
import { useAutoScrollOnDrag } from '@/hooks/groups/useDragAutoScroll';
import { useCalendarDragStore } from '@/store/calendarDrag';
import { toast } from 'sonner';
import { checkClash } from '../utils/checkClash';
import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';

type OccupiedCell = {
  taskId: string;
  projectId: number;
  groupId: number | null;
  title: string;
  color: {
    bg?: string;
    text?: string;
    border: string;
  };
};

export default function WeekView({
  tasks,
  currentDate,
  onDayClick,
  onCellDrop,
  tempTasks,
  previewTask,
  projectTaskIds,
  userId,
}: {
  tasks: ANY[];
  projectTaskIds: Set<string>;
  currentDate: Date;
  onTaskClick: (taskId: string) => void;
  onDayClick: (day: Date, dayTasks: ANY[]) => void;
  onCellDrop: (start: Date) => void;
  onDragOver: (e: React.DragEvent) => void;
  tempTasks: TempPanelTask[];
  previewTask: PreviewTask | null;
  setPreviewTask: (p: PreviewTask | null) => void;
  userId: number;
}) {
  const { stopAutoScroll } = useAutoScrollOnDrag();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const setDragPayload = useCalendarDragStore((s) => s.setPayload);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const [hoverChunks, setHoverChunks] = useState<TaskChunk[]>([]);

  const GRID_START = 9;
  const WORK_START = 9;
  const WORK_END = 23;

  const hours = Array.from(
    { length: WORK_END - GRID_START },
    (_, i) => i + GRID_START
  );

  const hourRowHeight =
    'h-[32.82px] min-h-[32.82px] lg:min-h-[20.06px] lg:h-[20.06px] lg:w-[30.56px]';
  const gridMinWidth = 'w-full';

  const isPastTime = useCallback((dateTime: Date): boolean => {
    return dateTime < new Date();
  }, []);

  type TaskChunk = {
    day: Date;
    startHour: number;
    endHour: number;
  };

  function splitTaskByWorkDays(
    dueDate: Date,
    durationHours: number
  ): TaskChunk[] {
    if (!durationHours || durationHours <= 0) {
      return [];
    }

    const chunks: TaskChunk[] = [];
    let remaining = Math.ceil(durationHours);

    const cursor = new Date(dueDate);

    if (cursor.getHours() > WORK_END) {
      cursor.setHours(WORK_END, 0, 0, 0);
    }

    if (cursor.getHours() < WORK_START) {
      cursor.setDate(cursor.getDate() - 1);
      cursor.setHours(WORK_END, 0, 0, 0);
    }

    while (remaining > 0) {
      const day = new Date(cursor);
      day.setHours(0, 0, 0, 0);

      const endHour = cursor.getHours();
      const startHour = Math.max(WORK_START, endHour - remaining);

      if (endHour > WORK_START) {
        chunks.push({ day, startHour, endHour });
        remaining -= endHour - startHour;
      }

      cursor.setDate(cursor.getDate() - 1);
      cursor.setHours(WORK_END, 0, 0, 0);
    }

    return chunks;
  }

  function splitForwardByWorkHours(
    start: Date,
    durationHours: number
  ): TaskChunk[] {
    const chunks: TaskChunk[] = [];
    let remaining = Math.ceil(durationHours);
    const cursor = new Date(start);

    if (cursor.getHours() < WORK_START) {
      cursor.setHours(WORK_START, 0, 0, 0);
    }

    if (cursor.getHours() >= WORK_END) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START, 0, 0, 0);
    }

    while (remaining > 0) {
      const day = new Date(cursor);
      day.setHours(0, 0, 0, 0);

      const startHour = cursor.getHours();

      const availableToday = WORK_END - startHour;
      const used = Math.min(availableToday, remaining);

      chunks.push({
        day,
        startHour,
        endHour: startHour + used,
      });

      remaining -= used;

      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START, 0, 0, 0);
    }

    return chunks;
  }

  const getDayOccupiedIntervals = useCallback(
    (day: Date) => {
      const occupiedHours: (OccupiedCell | null)[] = new Array(
        WORK_END - WORK_START
      ).fill(null);

      tasks.forEach((task) => {
        if (!task.dueDate) {
          return;
        }
        if (task.assigneeId !== userId && task.RESPONSIBLE_ID !== userId) {
          return;
        }

        const durationHours = Math.max(
          1,
          Math.ceil((task.timeEstimate ?? 0) / 3600)
        );

        const chunks = splitTaskByWorkDays(
          parseISO(task.dueDate),
          durationHours
        );

        chunks.forEach((chunk) => {
          if (!isSameDay(chunk.day, day)) {
            return;
          }

          for (let h = chunk.startHour; h < chunk.endHour; h++) {
            const index = h - WORK_START;
            if (index >= 0 && index < occupiedHours.length) {
              const groupId = task.groupId ?? task.GROUP_ID ?? null;
              const isFromProject = projectTaskIds.has(task.id);
              const projectId = task.project?.ID ?? task.projectId;

              const color = isFromProject
                ? {
                    bg: getProjectColorById(projectId) + '22',
                    border: getProjectColorById(projectId),
                    text: '#FFFFFF',
                  }
                : {
                    bg: '#F2F2F2',
                    border: '#BDBDBD',
                    text: '#666666',
                  };
              occupiedHours[index] = {
                projectId: task.project?.ID,
                taskId: task.id,
                groupId,
                title: task.title ?? 'Без названия',
                color,
              };
            }
          }
        });
      });

      // tempTasks.forEach((t) => {
      //   if (!isSameDay(t.start, day)) {
      //     return;
      //   }

      //   const startHour = Math.max(WORK_START, t.start.getHours());
      //   const endHour = Math.min(WORK_END, t.end.getHours());

      //   for (let h = startHour; h < endHour; h++) {
      //     const index = h - WORK_START;
      //     if (index >= 0 && index < occupiedHours.length) {
      //       occupiedHours[index] = {
      //         taskId: t.id,
      //         projectId: t.projectId,
      //         color: t.projectColor,
      //       };
      //     }
      //   }
      // });

      return occupiedHours;
    },
    [tasks, tempTasks, userId]
  );

  const daysWithOccupiedHours = useMemo(() => {
    return days.map((day) => ({
      day,
      occupiedHours: getDayOccupiedIntervals(day),
      dayTasks: tasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }

        if (task.assigneeId !== userId && task.RESPONSIBLE_ID !== userId) {
          return false;
        }

        const taskDate = parseISO(task.dueDate);
        return isSameDay(taskDate, day);
      }),
    }));
  }, [days, getDayOccupiedIntervals, tasks]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[400px] h-fit lg:h-fit lg:w-[244.44px] border-t border-l rounded-[2.44px] border-black shadow-md"
    >
      <div
        className={`grid ${gridMinWidth} text-[10px] grid-cols-[50px_repeat(7,minmax(40px,1fr))] lg:grid-cols-[30.56px_repeat(7,minmax(30.56px,1fr))]`}
      >
        <div className="w-[50px] h-[39px] lg:w-[30.56px] lg:h-[23.83px] border-r border-b border-black" />
        {daysWithOccupiedHours.map(({ day, dayTasks }, i) => (
          <div
            key={`dh-${i}`}
            className={`group relative lg:w-[30.56px] lg:h-[23.83px] border-r border-b border-black py-1 cursor-pointer hover:bg-gray-300 transition-all duration-200 flex justify-center items-center ${i === daysWithOccupiedHours.length - 1 ? 'rounded-tr-[2.44px]' : ''}`}
            onClick={() => onDayClick(day, dayTasks)}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="text-[12px] lg:text-[7.33px] font-normal leading-[130%] tracking-[-0.5px] lg:tracking-[-0.31px]">
              {format(day, 'EEEEEE', { locale: ru }).replace(/^./, (c) =>
                c.toUpperCase()
              )}{' '}
              {format(day, 'd')}
            </span>
          </div>
        ))}

        {hours.map((hour, hi) => (
          <div key={hi} className="contents">
            <div
              className={`relative border-b border-r border-black h-[32.82px] w-[50px] lg:h-[20.06px] lg:w-[30.56px] flex items-center  ${hi === hours.length - 1 ? 'rounded-bl-[2.44px]' : ''}`}
            >
              {hour !== GRID_START && (
                <span className="absolute left-2 -top-[10px] lg:left-[5px] lg:-top-[6px] text-[12px] lg:text-[7.33px] text-[#00000080] bg-[#f7f9fa]">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              )}
            </div>

            {daysWithOccupiedHours.map(({ day, occupiedHours }, di) => {
              const cellDateTime = new Date(day);
              cellDateTime.setHours(hour, 0, 0, 0);

              const index = hour - WORK_START;
              const occupiedCell =
                index >= 0 && index < occupiedHours.length
                  ? occupiedHours[index]
                  : null;

              const isOccupied = Boolean(occupiedCell);
              const isSelected = occupiedCell?.taskId === selectedTaskId;
              const isPast = isPastTime(cellDateTime);
              const isPlacedFromProjectPanel =
                occupiedCell !== null &&
                projectTaskIds.has(occupiedCell?.taskId);

              const isDisabled =
                isPast || (isOccupied && !isPlacedFromProjectPanel);

              let isPreviewCell = false;

              if (
                previewTask &&
                previewTask.assigneeId === userId &&
                isSameDay(previewTask.day, day)
              ) {
                const blockStart = previewTask.start.getHours();
                const blockEnd = previewTask.end.getHours();

                if (hour >= blockStart && hour < blockEnd) {
                  isPreviewCell = true;
                }
              }

              const isHoverRange = hoverChunks.some(
                (chunk) =>
                  isSameDay(chunk.day, day) &&
                  hour >= chunk.startHour &&
                  hour < chunk.endHour
              );

              const getCellStyles = () => {
                if (isHoverRange) {
                  return 'bg-green-200 border-green-500 cursor-copy';
                }
                if (isPreviewCell) {
                  return 'bg-blue-100 border-blue-300l';
                }
                if (isPast) {
                  return 'bg-[#969696] cursor-not-allowed';
                }
                if (isDisabled) {
                  return 'bg-[#969696] cursor-not-allowed';
                }
                if (isOccupied) {
                  return 'cursor-pointer';
                }
                return 'hover:bg-gray-50';
              };

              const getTitle = () => {
                if (isPast) {
                  return `Прошедшее время: ${hour}:00`;
                }
                if (isOccupied && occupiedCell) {
                  return `${occupiedCell.title}\n${hour}:00 – ${hour + 1}:00`;
                }
                if (isPreviewCell) {
                  return `Предварительно: занять ${previewTask?.duration} ч`;
                }
                return `Свободно в ${hour}:00`;
              };

              return (
                <div
                  key={`c-${hi}-${di}`}
                  className={`border-b border-r border-black ${hourRowHeight} p-1 transition-all duration-150 ${getCellStyles()} ${
                    hi === hours.length - 1 &&
                    di === daysWithOccupiedHours.length - 1
                      ? 'rounded-br-[2.44px]'
                      : ''
                  }`}
                  style={
                    occupiedCell && !isHoverRange
                      ? {
                          backgroundColor: occupiedCell.color.border,
                          opacity: isSelected ? 0.75 : 1,
                        }
                      : undefined
                  }
                  title={getTitle()}
                  onClick={() => {
                    if (!occupiedCell || isDisabled) {
                      return;
                    }

                    setSelectedTaskId((prev) =>
                      prev === occupiedCell.taskId ? null : occupiedCell.taskId
                    );
                  }}
                  draggable={isSelected && !isDisabled}
                  onDragEnd={() => {
                    const ghost = (window as ANY).__dragGhost;
                    if (ghost) {
                      ghost.remove();
                    }

                    (window as ANY).__dragGhost = null;
                    (window as ANY).__ghostLocked = false;
                    (window as ANY).__dragPayload = null;
                  }}
                  onDrag={(e) => {
                    const ghost = (window as ANY).__dragGhost;
                    const original = (window as ANY).__ghostOriginal;
                    if (!ghost || !original) {
                      return;
                    }

                    ghost.style.left = `${e.clientX - original.width / 2}px`;
                    ghost.style.top = `${e.clientY - original.height / 2}px`;
                  }}
                  onDragStart={(e) => {
                    if (
                      !occupiedCell ||
                      !isSelected ||
                      !selectedTask ||
                      isDisabled
                    ) {
                      return;
                    }

                    const payload = {
                      taskId: selectedTask.id,
                      fromUserId: userId,
                      fromCalendar: true,
                      source: 'user' as const,
                      durationHours: selectedTask.timeEstimate / 3600,
                      TITLE: selectedTask.title,
                      TIME_ESTIMATE: selectedTask.timeEstimate,
                      groupColor: selectedTask.project?.ID
                        ? getProjectColorById(selectedTask.project.ID)
                        : '#BDBDBD',
                    };

                    // (window as ANY).__dragPayload = payload;

                    setDragPayload(payload);

                    e.dataTransfer.setData('text/plain', 'drag');

                    const { border } = occupiedCell.color;

                    const ghost = document.createElement('div');
                    ghost.style.position = 'fixed';
                    ghost.style.left = '-9999px';
                    ghost.style.top = '-9999px';
                    ghost.style.width = '160px';
                    ghost.style.pointerEvents = 'none';
                    ghost.style.zIndex = '99999';
                    ghost.style.background = border;
                    ghost.style.border = `1px solid #8AE6FF80`;
                    ghost.style.padding = '10px';
                    ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    ghost.style.fontSize = '12px';
                    ghost.style.color = 'white';

                    ghost.innerHTML = `
                        <div style="
                          height: 100%;
                          display: flex;
                          flex-direction: column;
                          overflow: hidden;
                        ">
                          <div style="
                            font-size: 8px;
                            font-weight: 400;
                            line-height: 130%;
                            margin-bottom: 4px;
                            letter-spacing: -0.5px;
                          ">
                            ${selectedTask.title}
                          </div>

                          <div style="
                            height: 1px;
                            background: white;
                            width: 100%;
                            margin-top: 4px;
                          "></div>

                          <div style="
                            font-size: 10px;
                            font-weight: 500;
                            color: #C0BDFF;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            margin-top: 4px;
                          ">
                            ${(selectedTask.timeEstimate / 3600).toFixed(1)} часов
                          </div>

                          <div style="
                            height: 1px;
                            background: white;
                            width: 100%;
                            margin-top: 4px;
                          "></div>
                        </div>
                      `;

                    document.body.appendChild(ghost);

                    (window as ANY).__dragGhost = ghost;
                    (window as ANY).__ghostOriginal = {
                      width: 160,
                      height: ghost.offsetHeight,
                    };
                    (window as ANY).__ghostLocked = false;

                    const empty = document.createElement('div');
                    empty.style.width = '1px';
                    empty.style.height = '1px';
                    empty.style.opacity = '0';

                    e.dataTransfer.setDragImage(empty, 0, 0);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();

                    // const payload = (window as ANY).__dragPayload;
                    const payload = useCalendarDragStore.getState().payload;
                    if (!payload) {
                      setHoverChunks([]);
                      return;
                    }

                    if (hour < WORK_START) {
                      setHoverChunks([]);
                      return;
                    }
                    if (!payload) {
                      setHoverChunks([]);
                      return;
                    }

                    const start = new Date(day);
                    start.setHours(hour, 0, 0, 0);

                    const duration = Math.max(
                      1,
                      Math.ceil(payload.durationHours)
                    );

                    const chunks = splitForwardByWorkHours(start, duration);

                    const hasClash = chunks.some((chunk) => {
                      const chunkStart = new Date(chunk.day);
                      chunkStart.setHours(chunk.startHour, 0, 0, 0);

                      const chunkEnd = new Date(chunk.day);
                      chunkEnd.setHours(chunk.endHour, 0, 0, 0);

                      return checkClash(
                        chunkStart,
                        chunkEnd,
                        tasks,
                        tempTasks,
                        Number(payload.taskId)
                      );
                    });

                    if (hasClash || isDisabled) {
                      setHoverChunks(chunks);
                      return;
                    }

                    setHoverChunks(chunks);

                    const ghost = (window as ANY).__dragGhost;
                    if (ghost) {
                      ghost.style.display = 'none';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const payload = useCalendarDragStore.getState().payload;
                    if (!payload || hoverChunks.length === 0) {
                      return;
                    }

                    const firstChunk = hoverChunks[0];

                    const start = new Date(firstChunk.day);
                    start.setHours(firstChunk.startHour, 0, 0, 0);

                    const duration = Math.max(
                      1,
                      Math.ceil(payload.durationHours)
                    );
                    const end = new Date(start);
                    end.setHours(start.getHours() + duration);

                    const hasClash = hoverChunks.some((chunk) => {
                      const chunkStart = new Date(chunk.day);
                      chunkStart.setHours(chunk.startHour, 0, 0, 0);

                      const chunkEnd = new Date(chunk.day);
                      chunkEnd.setHours(chunk.endHour, 0, 0, 0);

                      return checkClash(
                        chunkStart,
                        chunkEnd,
                        tasks,
                        tempTasks,
                        Number(payload.taskId)
                      );
                    });

                    if (isDisabled || hasClash) {
                      toast.error('Задача пересекается с другой задачей');
                      setHoverChunks([]);
                      return;
                    }

                    setHoverChunks([]);
                    onCellDrop(start);
                  }}
                  onDragLeave={() => {
                    stopAutoScroll();
                    setHoverChunks([]);

                    const ghost = (window as ANY).__dragGhost;
                    const original = (window as ANY).__ghostOriginal;
                    if (!ghost || !original) {
                      return;
                    }

                    ghost.style.display = 'flex';

                    (window as ANY).__ghostLocked = false;
                    ghost.style.width = original.width + 'px';
                    ghost.style.height = original.height + 'px';
                  }}
                >
                  {isPreviewCell && previewTask && (
                    <div
                      className="absolute inset-0 rounded pointer-events-none z-[150]"
                      style={{
                        backgroundColor: previewTask.projectColor + '55',
                        border: `1px solid ${previewTask.projectColor}`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
