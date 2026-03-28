import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';
import { useCalendarDragStore } from '@/store/calendarDrag';
import { checkClash } from '../utils/checkClash';
import { isSameDay, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallback, useMemo, useState } from 'react';
import { TempPanelTask, PreviewTask } from './types';
import { toast } from 'sonner';

type OccupiedCell = {
  taskId: string;
  projectId?: number;
  groupId: number | null;
  title: string;
  color: {
    bg?: string;
    text?: string;
    border: string;
  };
};

type TaskChunk = {
  day: Date;
  startHour: number;
  endHour: number;
};

export default function DayView({
  tasks,
  currentDate,
  onDayClick,
  onCellDrop,
  onDragOver,
  tempTasks,
  userId,
  projectTaskIds,
}: {
  tasks: ANY[];
  currentDate: Date;
  onDayClick: (day: Date, dayTasks: ANY[]) => void;
  onCellDrop: (start: Date) => void;
  onDragOver: (e: React.DragEvent) => void;
  tempTasks: TempPanelTask[];
  userId: number;
  projectTaskIds: Set<string>;
  previewTask: PreviewTask | null;
}) {
  const [hoverChunks, setHoverChunks] = useState<TaskChunk[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const WORK_START = 8;
  const WORK_END = 19;

  const hours = Array.from(
    { length: WORK_END - WORK_START },
    (_, i) => i + WORK_START
  );

  const hourRowHeight =
    'h-[32.82px] min-h-[32.82px] xl:h-[20.06px] xl:min-h-[20.06px]';
  const gridMinWidth = 'max-w-[390px] xl:max-w-[244.44px]';

  const isPastTime = useCallback((dateTime: Date): boolean => {
    return dateTime < new Date();
  }, []);

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
      const available = WORK_END - startHour;
      const used = Math.min(available, remaining);

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

  const occupiedHours = useMemo<(OccupiedCell | null)[]>(() => {
    const arr = new Array(WORK_END - WORK_START).fill(null);

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

      const chunks = splitTaskByWorkDays(parseISO(task.dueDate), durationHours);

      chunks.forEach((chunk) => {
        if (!isSameDay(chunk.day, currentDate)) {
          return;
        }

        for (let h = chunk.startHour; h < chunk.endHour; h++) {
          const idx = h - WORK_START;
          if (idx < 0 || idx >= arr.length) {
            continue;
          }

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

          arr[idx] = {
            taskId: task.id,
            projectId,
            groupId: task.groupId ?? task.GROUP_ID ?? null,
            title: task.title ?? 'Без названия',
            color,
          };
        }
      });
    });

    return arr;
  }, [tasks, currentDate, userId, projectTaskIds]);

  return (
    <div className="w-full max-w-[400px] h-[401px] xl:max-w-[244.44px] xl:h-[244.44px] border-t border-l rounded-[2.44px] border-black shadow-md">
      <div
        className={`grid text-[12px] font-normal ${gridMinWidth} grid-cols-[50px_1fr] xl:grid-cols-[30.56px_1fr]`}
      >
        <div className="w-[50px] h-[39px] xl:w-[30.56px] xl:h-[23.83px] border-r border-b border-black" />
        <div
          className="relative border-b border-r border-black py-1 cursor-pointer hover:bg-gray-300 transition-all duration-200 flex justify-center items-center rounded-tr-[2.44px]"
          onClick={() => onDayClick(currentDate, tasks)}
          onDragOver={onDragOver}
        >
          <span className="text-[12px] font-normal leading-[130%] tracking-[-0.5px]">
            {format(currentDate, 'EEEEEE d', { locale: ru }).replace(
              /^./,
              (c) => c.toUpperCase()
            )}
          </span>
        </div>

        {hours.map((hour, i) => {
          const cellDateTime = new Date(currentDate);
          cellDateTime.setHours(hour, 0, 0, 0);

          const occupiedCell = occupiedHours[i];
          const isOccupied = Boolean(occupiedCell);
          const isSelected = occupiedCell?.taskId === selectedTaskId;
          const isPast = isPastTime(cellDateTime);

          const isPlacedFromProjectPanel =
            occupiedCell && projectTaskIds.has(occupiedCell.taskId);

          const isDisabled =
            isPast || (isOccupied && !isPlacedFromProjectPanel);

          const isHoverRange = hoverChunks.some(
            (chunk) =>
              isSameDay(chunk.day, currentDate) &&
              hour >= chunk.startHour &&
              hour < chunk.endHour
          );

          const getCellStyles = () => {
            if (isHoverRange) {
              return 'bg-green-200 border-green-500 cursor-copy';
            }
            if (isDisabled) {
              return 'bg-[#969696] cursor-not-allowed';
            }
            if (isOccupied) {
              return 'cursor-pointer';
            }
            return 'hover:bg-gray-50';
          };

          return (
            <div key={hour} className="contents">
              <div
                className={`relative border-b border-r border-black h-[32.82px] w-[50px] xl:h-[20.06px] xl:w-[30.56px] flex items-center ${
                  i === hours.length - 1 ? 'rounded-bl-[2.44px]' : ''
                }`}
              >
                {hour !== WORK_START && (
                  <span className="absolute left-2 -top-[10px] text-[12px] xl:left-[5px] xl:-top-[6px] xl:text-[7.33px] text-[#00000080] bg-[#f7f9fa] px-[1px]">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                )}
              </div>

              <div
                className={`border-b border-r border-black ${hourRowHeight} transition-all duration-150 ${getCellStyles()} ${
                  i === hours.length - 1 ? 'rounded-br-[2.44px]' : ''
                }`}
                style={
                  occupiedCell && !isHoverRange
                    ? {
                        backgroundColor: occupiedCell.color.border,
                        opacity: isSelected ? 0.75 : 1,
                      }
                    : undefined
                }
                onClick={() => {
                  if (!occupiedCell || isDisabled) {
                    return;
                  }
                  setSelectedTaskId((p) =>
                    p === occupiedCell.taskId ? null : occupiedCell.taskId
                  );
                }}
                draggable={isSelected && !isDisabled}
                onDragStart={(e) => {
                  if (!selectedTask || !occupiedCell) {
                    return;
                  }

                  const projectId =
                    selectedTask.project?.ID ?? selectedTask.projectId;

                  const payload = {
                    taskId: selectedTask.id,
                    fromUserId: userId,
                    fromCalendar: true,
                    source: 'user' as const,
                    durationHours: selectedTask.timeEstimate / 3600,
                    TITLE: selectedTask.title,
                    TIME_ESTIMATE: selectedTask.timeEstimate,
                    groupColor: projectId
                      ? getProjectColorById(projectId)
                      : '#BDBDBD',
                  };

                  useCalendarDragStore.getState().setPayload(payload);
                  e.dataTransfer.setData('text/plain', 'drag');

                  const ghost = document.createElement('div');
                  ghost.style.position = 'fixed';
                  ghost.style.left = '-9999px';
                  ghost.style.top = '-9999px';
                  ghost.style.width = '160px';
                  ghost.style.pointerEvents = 'none';
                  ghost.style.zIndex = '99999';
                  ghost.style.background = projectId
                    ? getProjectColorById(projectId)
                    : '#BDBDBD';
                  ghost.style.border = `1px solid #8AE6FF80`;
                  ghost.style.padding = '10px';
                  ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  ghost.style.fontSize = '12px';
                  ghost.style.color = 'white';

                  ghost.innerHTML = `
                    <div style="font-size:8px;line-height:130%;margin-bottom:4px;">
                      ${selectedTask.title}
                    </div>
                    <div style="height:1px;background:white;margin:4px 0;"></div>
                    <div style="font-size:10px;color:#C0BDFF;">
                      ${(selectedTask.timeEstimate / 3600).toFixed(1)} часов
                    </div>
                  `;

                  document.body.appendChild(ghost);
                  (window as ANY).__dragGhost = ghost;
                  (window as ANY).__ghostOriginal = {
                    width: 160,
                    height: ghost.offsetHeight,
                  };

                  const empty = document.createElement('div');
                  empty.style.width = '1px';
                  empty.style.height = '1px';
                  empty.style.opacity = '0';
                  e.dataTransfer.setDragImage(empty, 0, 0);
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
                onDragOver={(e) => {
                  e.preventDefault();

                  const payload = useCalendarDragStore.getState().payload;
                  if (!payload) {
                    setHoverChunks([]);
                    return;
                  }

                  const start = new Date(currentDate);
                  start.setHours(hour, 0, 0, 0);

                  const chunks = splitForwardByWorkHours(
                    start,
                    payload.durationHours
                  );

                  const hasClash = chunks.some((chunk) => {
                    const s = new Date(chunk.day);
                    s.setHours(chunk.startHour, 0, 0, 0);
                    const e2 = new Date(chunk.day);
                    e2.setHours(chunk.endHour, 0, 0, 0);

                    return checkClash(
                      s,
                      e2,
                      tasks,
                      tempTasks,
                      Number(payload.taskId)
                    );
                  });

                  setHoverChunks(chunks);

                  if (hasClash || isDisabled) {
                    return;
                  }

                  const ghost = (window as ANY).__dragGhost;
                  if (ghost) {
                    ghost.style.display = 'none';
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();

                  const payload = useCalendarDragStore.getState().payload;
                  if (!payload || hoverChunks.length === 0) {
                    return;
                  }

                  const first = hoverChunks[0];
                  const start = new Date(first.day);
                  start.setHours(first.startHour, 0, 0, 0);

                  const hasClash = hoverChunks.some((chunk) => {
                    const s = new Date(chunk.day);
                    s.setHours(chunk.startHour, 0, 0, 0);
                    const e2 = new Date(chunk.day);
                    e2.setHours(chunk.endHour, 0, 0, 0);

                    return checkClash(
                      s,
                      e2,
                      tasks,
                      tempTasks,
                      Number(payload.taskId)
                    );
                  });

                  if (hasClash || isDisabled) {
                    toast.error('Задача пересекается с другой задачей');
                    setHoverChunks([]);
                    return;
                  }

                  setHoverChunks([]);
                  onCellDrop(start);
                }}
                onDragEnd={() => {
                  const ghost = (window as ANY).__dragGhost;
                  if (ghost) {
                    ghost.remove();
                  }
                  (window as ANY).__dragGhost = null;
                  useCalendarDragStore.getState().clear();

                  setHoverChunks([]);
                }}
                onDragLeave={() => {
                  setHoverChunks([]);

                  const ghost = (window as ANY).__dragGhost;
                  if (ghost) {
                    ghost.style.display = 'flex';
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
