// import { useModuleTaskDnD } from '@/hooks/groups/useModuleTaskDnD';
// import { useAuthStore } from '@/store/auth';
import TaskCard from './TaskCard';
import useDragScroll from './useDragScroll';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskActions } from '@/hooks/tasks/useTaskActions';
import { toast } from 'sonner';
import { useState } from 'react';
// import { createTaskGhostFromElement } from '@/screens/tasks/_mobile/_calendar/utils/createTaskGhost';
import { ModuleTask } from '@/hooks/groups/useProjectsModule';
import { useAutoScrollOnDrag } from '@/hooks/groups/useDragAutoScroll';
import { useCalendarDragStore } from '@/store/calendarDrag';
import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';

export default function CalendarPanel({
  project,
}: {
  project: ANY;
  currentDate: Date;
  viewMode: 'week' | 'month' | 'day';
}) {
  // const { userId } = useAuthStore();
  // const { startDrag } = useModuleTaskDnD({
  //   userId,
  //   projectId: String(project.ID),
  // });
  const hours = ['1ч', '2ч', '3ч', '4ч', '5ч', '6ч', '7ч', '8ч', '9ч'];
  const [previewTask, setPreviewTask] = useState<ANY | null>(null);

  const WEEK_CELL_HEIGHT = 32.82;
  const WEEK_CELL_HEIGHT_LG = 20.06;

  const WEEK_CELL_WIDTH = 40;
  const WEEK_CELL_WIDTH_LG = 30.56;

  const { handleVerticalAutoScroll, stopAutoScroll } = useAutoScrollOnDrag();

  function createCellsGhost({
    hours,
    color,
  }: {
    hours: number;
    color: string;
  }) {
    const isLg = window.matchMedia('(min-width: 1024px)').matches;

    const cellHeight = isLg ? WEEK_CELL_HEIGHT_LG : WEEK_CELL_HEIGHT;
    const cellWidth = isLg ? WEEK_CELL_WIDTH_LG : WEEK_CELL_WIDTH;

    const ghost = document.createElement('div');

    ghost.style.position = 'fixed';
    ghost.style.left = '-9999px';
    ghost.style.top = '-9999px';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '99999';
    ghost.style.display = 'flex';
    ghost.style.flexDirection = 'column';
    ghost.style.width = `${cellWidth}px`;

    for (let i = 0; i < hours; i++) {
      const cell = document.createElement('div');

      cell.style.height = `${cellHeight}px`;
      cell.style.width = '100%';
      cell.style.background = color + '55';
      cell.style.border = `1px solid ${color}`;
      cell.style.boxSizing = 'border-box';

      ghost.appendChild(cell);
    }

    document.body.appendChild(ghost);

    return ghost;
  }

  function getTaskColor(task: ModuleTask, projectId: number) {
    const projectColor = getProjectColorById(projectId);

    return {
      bg: projectColor + '22',
      border: projectColor,
      text: '#FFFFFF',
    };
  }

  const { updateTask } = useTaskActions();
  const queryClient = useQueryClient();

  async function handleDropFromCalendar(task: ANY) {
    try {
      await updateTask({
        id: task.taskId,
        payload: {
          DEADLINE: '',
          RESPONSIBLE_ID: undefined,
        },
      });

      await queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'tasks',
      });

      toast.success('Задача возвращена в проект');
    } catch (e: ANY) {
      toast.error('Ошибка при возврате задачи', e);
    }
  }

  const tasks = project.tasks.filter(
    (t: { DEADLINE?: string | null }) => !t.DEADLINE
  );

  function normalizeToModuleTask(task: ANY): ModuleTask {
    return {
      ...task,
      TITLE: task.TITLE ?? task.title ?? 'Без названия',
      TIME_ESTIMATE:
        task.TIME_ESTIMATE ??
        (task.timeEstimate != null
          ? task.timeEstimate
          : task.durationHours != null
            ? task.durationHours * 3600
            : 0),
      Skills: task.Skills ?? [],
      Knowledge: task.Knowledge ?? '',
    };
  }

  const sortedTasks = tasks
    .slice()
    .sort((a: ANY, b: ANY) => a.TITLE.localeCompare(b.TITLE));

  const hourToPx = (h: number) => h * 36;
  const drag = useDragScroll();
  return (
    <div className="flex border border-[#00000052] bg-white min-h-[310px]">
      <div className="shrink-0">
        {hours.map((h, i) => (
          <div
            key={i}
            className={`h-[36px] w-[38px] flex items-center justify-center text-[12px] font-normal tracking-[-0.5px] text-[#000000] border-r border-black ${i !== hours.length - 1 && 'border-b border-black'}`}
          >
            {h}
          </div>
        ))}
      </div>

      <div
        className="overflow-x-auto overflow-y-hidden w-full block cursor-grab active:cursor-grabbing select-none"
        ref={drag.ref}
        onMouseDown={drag.onMouseDown}
        onMouseLeave={drag.onMouseLeave}
        onMouseUp={drag.onMouseUp}
        onMouseMove={drag.onMouseMove}
      >
        <div
          className="relative"
          style={{
            width: '100%',
            height: hourToPx(hours.length),
          }}
          onDragOver={(e) => {
            e.preventDefault();

            handleVerticalAutoScroll(e.nativeEvent);

            const payload = useCalendarDragStore.getState().payload;
            if (!payload) {
              return;
            }

            // if (!payload.fromCalendar) {
            //   return;
            // }

            if (payload.source !== 'user') {
              return;
            }

            setPreviewTask(payload);

            const ghost = (window as ANY).__dragGhost;
            if (ghost) {
              ghost.style.display = 'none';
            }
          }}
          onDrop={async (e) => {
            stopAutoScroll();
            e.preventDefault();

            const payload = useCalendarDragStore.getState().payload;
            if (!payload) {
              return;
            }

            // если нужно — фильтр
            // if (!payload.fromCalendar) return;
            if (payload.source !== 'user') {
              return;
            }

            setPreviewTask(null);

            await handleDropFromCalendar(payload);

            useCalendarDragStore.getState().clear();
          }}
          onDragLeave={() => {
            setPreviewTask(null);

            const ghost = (window as ANY).__dragGhost;
            if (ghost) {
              ghost.style.display = 'flex';
            }
          }}
        >
          {hours.map((_, i) => (
            <div
              key={i}
              className={`absolute left-0 right-0 h-[36px] ${
                i < hours.length - 1 ? 'border-b border-[#00000052]' : ''
              }`}
              style={{ top: i * 36 }}
            />
          ))}

          {sortedTasks.map((task: ANY, idx: number) => {
            const color = getTaskColor(task, project.ID);
            return (
              <div
                key={task.ID}
                draggable
                onDragStart={(e) => {
                  const durationHours = Math.max(
                    1,
                    Math.ceil(task.TIME_ESTIMATE / 3600)
                  );

                  // const payload = {
                  //   ID: task.ID,
                  //   TIME_ESTIMATE: task.TIME_ESTIMATE,
                  //   SOURCE: 'project',
                  //   fromCalendar: true,
                  // };

                  // (window as ANY).__dragPayload = payload;

                  // e.dataTransfer.setData(
                  //   'application/json',
                  //   JSON.stringify(payload)
                  // );
                  useCalendarDragStore.getState().setPayload({
                    taskId: task.ID,
                    durationHours: task.TIME_ESTIMATE / 3600,
                    TIME_ESTIMATE: task.TIME_ESTIMATE,
                    TITLE: task.TITLE,
                    GROUP_ID: task.GROUP_ID,
                    source: 'project',
                  });

                  e.dataTransfer.setData('text/plain', 'drag');

                  const ghost = createCellsGhost({
                    hours: durationHours,
                    color: color.border,
                  });

                  e.dataTransfer.setDragImage(
                    ghost,
                    ghost.offsetWidth / 2,
                    WEEK_CELL_HEIGHT / 2
                  );

                  setTimeout(() => {
                    ghost.remove();
                  }, 0);
                }}
                onDrag={(e) => {
                  const ghost = (window as ANY).__dragGhost;
                  const original = (window as ANY).__ghostOriginal;
                  const locked = (window as ANY).__ghostLocked;

                  if (!ghost || !original) {
                    return;
                  }

                  if (locked) {
                    return;
                  }

                  ghost.style.left = `${e.clientX - original.width / 2}px`;
                  ghost.style.top = `${e.clientY - original.height / 2}px`;
                }}
                onDragEnd={() => {
                  stopAutoScroll();
                  const ghost = (window as ANY).__dragGhost;
                  if (ghost) {
                    ghost.remove();
                  }
                  (window as ANY).__dragGhost = null;
                  (window as ANY).__ghostLocked = false;
                  (window as ANY).__dragPayload = null;
                }}
                className="
                absolute 
                border
                border-[#8AE6FF80]
                px-4 py-3
                w-[130px]
                overflow-hidden"
                style={{
                  top: 0,
                  left: idx * 140 + 10,
                  backgroundColor: color.border,
                  height: hourToPx(task.TIME_ESTIMATE / 3600),
                }}
              >
                <TaskCard task={task} />
              </div>
            );
          })}

          {previewTask &&
            (() => {
              const color = previewTask.groupColor;
              return (
                <div
                  className="
                      absolute
                      shadow-sm
                      px-4 py-3
                      w-[130px]
                      pointer-events-none
                      border border-[#8AE6FF80]
                    "
                  style={{
                    top: 0,
                    left: sortedTasks.length * 140 + 10,
                    backgroundColor: color,
                    height: hourToPx(previewTask.TIME_ESTIMATE / 3600),
                    opacity: 0.85,
                  }}
                >
                  <TaskCard task={normalizeToModuleTask(previewTask)} />
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
