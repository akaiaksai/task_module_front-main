import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';
import { useCalendarDragStore } from '@/store/calendarDrag';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import React, { useCallback, useMemo, useState } from 'react';

const WORK_START = 9;
const WORK_END = 23;
const SLOT_COUNT = WORK_END - WORK_START;

type TaskChunk = {
  day: Date;
  startHour: number;
  endHour: number;
};

type OccupiedSlot = {
  taskId: string;
  groupId: number | null;
  projectId?: number;
};

function dayKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function MonthView({
  tasks,
  currentDate,
  onDrop,
  onDragOver,
}: {
  tasks: ANY[];
  currentDate: Date;
  onDrop: (start: Date) => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  const now = new Date();

  const [hoverChunks, setHoverChunks] = useState<TaskChunk[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const getPayload = () => useCalendarDragStore.getState().payload;
  const clearPayload = () => useCalendarDragStore.getState().clear();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      out.push(days.slice(i, i + 7));
    }
    return out;
  }, [days]);

  const splitTaskByWorkDays = useCallback(
    (dueDate: Date, durationHours: number): TaskChunk[] => {
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
    },
    []
  );

  const splitForwardByWorkHours = useCallback(
    (start: Date, durationHours: number): TaskChunk[] => {
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
        const used = Math.min(WORK_END - startHour, remaining);

        chunks.push({ day, startHour, endHour: startHour + used });

        remaining -= used;
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(WORK_START, 0, 0, 0);
      }

      return chunks;
    },
    []
  );

  const occupiedByDay = useMemo(() => {
    const map = new Map<string, (OccupiedSlot | null)[]>();

    for (const task of tasks) {
      if (!task?.dueDate) {
        continue;
      }

      const hours = Math.max(
        1,
        Math.ceil((task.timeEstimate ?? task.TIME_ESTIMATE ?? 0) / 3600)
      );

      const chunks = splitTaskByWorkDays(parseISO(task.dueDate), hours);

      for (const c of chunks) {
        const key = dayKey(c.day);

        if (!map.has(key)) {
          map.set(key, new Array(SLOT_COUNT).fill(null));
        }

        const arr = map.get(key)!;
        const groupId = task.groupId ?? task.GROUP_ID ?? null;

        for (let h = c.startHour; h < c.endHour; h++) {
          const idx = h - WORK_START;
          if (idx >= 0 && idx < SLOT_COUNT) {
            arr[idx] = {
              taskId: task.id,
              groupId,
              projectId: task.project?.ID ?? task.projectId,
            };
          }
        }
      }
    }

    return map;
  }, [tasks, splitTaskByWorkDays]);

  const hoverByDay = useMemo(() => {
    const map = new Map<string, boolean[]>();

    for (const c of hoverChunks) {
      const key = dayKey(c.day);
      if (!map.has(key)) {
        map.set(key, new Array(SLOT_COUNT).fill(false));
      }

      const arr = map.get(key)!;
      for (let h = c.startHour; h < c.endHour; h++) {
        const idx = h - WORK_START;
        if (idx >= 0 && idx < SLOT_COUNT) {
          arr[idx] = true;
        }
      }
    }
    return map;
  }, [hoverChunks]);

  const isPastDay = (day: Date) => {
    const d = new Date(day);
    d.setHours(now.getHours(), 0, 0, 0);
    return d < now;
  };

  const getStartFromPointer = (day: Date, el: HTMLElement, y: number) => {
    const r = el.getBoundingClientRect();
    const relY = clamp(y - r.top, 0, r.height - 1);
    const slot = Math.floor(relY / (r.height / SLOT_COUNT));
    const start = new Date(day);
    start.setHours(WORK_START + slot, 0, 0, 0);
    return start;
  };

  return (
    <div className="w-full max-w-[390px] lg:h-[244.44px] h-[401px] lg:w-[244.44px] border border-black rounded-[2.44px] overflow-hidden shadow-md bg-white">
      <div
        className="grid w-full h-full text-[12px] font-normal"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `39px repeat(${weeks.length}, 1fr)`,
        }}
      >
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
          <div
            key={d}
            className={`${i !== 6 ? 'border-r border-black' : ''} border-b border-black flex items-center justify-center`}
          >
            {d}
          </div>
        ))}

        {weeks.flat().map((day, index) => {
          const rowIndex = Math.floor(index / 7);
          const colIndex = index % 7;
          const key = dayKey(day);
          const past = isPastDay(day);
          const isLastRow = rowIndex === weeks.length - 1;
          const isLastCol = colIndex === 6;
          const occupied =
            occupiedByDay.get(key) ?? new Array(SLOT_COUNT).fill(null);
          const hover =
            hoverByDay.get(key) ?? new Array(SLOT_COUNT).fill(false);

          return (
            <div
              key={key}
              className={`relative ${!isLastRow ? 'border-b border-black' : ''}
    ${!isLastCol ? 'border-r border-black' : ''} border-black ${
      !isSameMonth(day, currentDate) ? 'bg-[#f0f0f0]' : 'bg-white'
    }`}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOver(e);
                if (past) {
                  return;
                }

                const payload = getPayload();
                if (!payload?.durationHours) {
                  setHoverChunks([]);
                  return;
                }

                const start = getStartFromPointer(
                  day,
                  e.currentTarget as HTMLElement,
                  e.clientY
                );

                setHoverChunks(
                  splitForwardByWorkHours(start, payload.durationHours)
                );
              }}
              onDragLeave={() => setHoverChunks([])}
              onDrop={(e) => {
                e.preventDefault();
                if (past) {
                  return;
                }

                const payload = getPayload();
                if (!payload?.durationHours) {
                  return;
                }

                const start = getStartFromPointer(
                  day,
                  e.currentTarget as HTMLElement,
                  e.clientY
                );

                setHoverChunks([]);
                onDrop(start);
                clearPayload();
              }}
            >
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateRows: `repeat(${SLOT_COUNT}, 1fr)` }}
              >
                {Array.from({ length: SLOT_COUNT }).map((_, i) => {
                  const style: React.CSSProperties = {};

                  if (past) {
                    style.backgroundColor = '#969696';
                  } else if (hover[i]) {
                    style.backgroundColor = '#86efac';
                  } else if (occupied[i]) {
                    const c = getProjectColorById(occupied[i]!.projectId);
                    style.backgroundColor = c;
                    style.opacity =
                      occupied[i]!.taskId === selectedTaskId ? 0.7 : 1;
                  }

                  const slot = occupied[i];

                  return (
                    <div
                      key={i}
                      style={style}
                      draggable={Boolean(
                        slot && slot.taskId === selectedTaskId
                      )}
                      onClick={() => {
                        if (!slot) {
                          return;
                        }
                        setSelectedTaskId((prev) =>
                          prev === slot.taskId ? null : slot.taskId
                        );
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
                        if (!slot) {
                          return;
                        }

                        const task = tasks.find((t) => t.id === slot.taskId);
                        if (!task) {
                          return;
                        }

                        const payload = {
                          source: 'user' as const,
                          taskId: task.id,
                          fromUserId: task.RESPONSIBLE_ID ?? task.assigneeId,
                          durationHours: Math.max(
                            1,
                            Math.ceil((task.timeEstimate ?? 0) / 3600)
                          ),
                          TIME_ESTIMATE: task.timeEstimate,
                          TITLE: task.title,
                          groupColor: task.project?.ID
                            ? getProjectColorById(task.project.ID)
                            : '#BDBDBD',
                        };

                        useCalendarDragStore.getState().setPayload(payload);

                        e.dataTransfer.setData('text/plain', 'drag');

                        const bgColor = task.project?.ID
                          ? getProjectColorById(task.project.ID)
                          : '#BDBDBD';

                        const ghost = document.createElement('div');
                        ghost.style.position = 'fixed';
                        ghost.style.left = '-9999px';
                        ghost.style.top = '-9999px';
                        ghost.style.width = '160px';
                        ghost.style.pointerEvents = 'none';
                        ghost.style.zIndex = '99999';
                        ghost.style.background = bgColor;
                        ghost.style.opacity = '0.85';
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
                            ${task.title}
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
                            ${(task.timeEstimate / 3600).toFixed(1)} часов
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
                      onDragEnd={() => {
                        const ghost = (window as ANY).__dragGhost;
                        if (ghost) {
                          ghost.remove();
                        }

                        (window as ANY).__dragGhost = null;
                        (window as ANY).__ghostOriginal = null;

                        useCalendarDragStore.getState().clear();
                      }}
                    />
                  );
                })}
              </div>

              <div className="absolute top-1 right-1 z-10 pointer-events-none">
                {format(day, 'd', { locale: ru })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
