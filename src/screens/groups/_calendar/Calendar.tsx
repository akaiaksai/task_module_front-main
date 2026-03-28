import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useModuleTaskDnD } from '@/hooks/groups/useModuleTaskDnD';
import { ModuleProjectWithTasks } from '@/hooks/groups/useProjectsModule';
import { taskKeys, useTaskActions } from '../../../hooks/tasks/useTaskActions';
import { useAuthStore } from '../../../store/auth';
import { UserHeader } from './UserHeader';
import { useOccupancy } from '@/screens/tasks/_mobile/_calendar/hooks/useOccupancy';
// import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import { PreviewTask, TempPanelTask } from './views/types';
import {
  loadProjectTaskIds,
  saveProjectTaskIds,
} from './utils/localProjectsTasks';
import { useCalendarDragStore } from '@/store/calendarDrag';
import MonthView from './views/MonthView';

export function UserCalendar({
  user,
  tasks,
  onTaskClick,
  onDayClick,
  viewMode,
  projectId,
  currentDate,
  compact,
}: {
  user: ANY;
  tasks: ANY[];
  onTaskClick: (taskId: string) => void;
  onDayClick: (day: Date, dayTasks: ANY[]) => void;
  viewMode: 'month' | 'week' | 'day';
  projectId?: string;
  project?: ModuleProjectWithTasks;
  compact?: boolean;
  currentDate: Date;
}) {
  const { updateTask } = useTaskActions();
  const { userId } = useAuthStore();
  const queryClient = useQueryClient();
  const occupancy = useOccupancy(user.ID, tasks, currentDate, viewMode);

  const [projectTaskIds, setProjectTaskIds] = useState<Set<string>>(() =>
    loadProjectTaskIds()
  );

  useModuleTaskDnD({
    userId,
    projectId: String(projectId),
  });

  const [tempTasksByUser] = useState<Record<number, TempPanelTask[]>>({});

  const [previewTask, setPreviewTask] = useState<PreviewTask | null>(null);

  const WORK_START = 9;
  const WORK_END = 23;

  function calculateEndDateByWorkHours(
    start: Date,
    durationHours: number
  ): Date {
    let remaining = durationHours;
    const cursor = new Date(start);

    // нормализуем старт
    if (cursor.getHours() < WORK_START) {
      cursor.setHours(WORK_START, 0, 0, 0);
    }

    if (cursor.getHours() >= WORK_END) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START, 0, 0, 0);
    }

    while (remaining > 0) {
      const availableToday = WORK_END - cursor.getHours();

      if (availableToday >= remaining) {
        cursor.setHours(cursor.getHours() + remaining);
        remaining = 0;
      } else {
        remaining -= availableToday;
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(WORK_START, 0, 0, 0);
      }
    }

    return cursor;
  }

  const handleCellDrop = useCallback(
    async (start: Date, targetUserId = user.ID) => {
      const payload = useCalendarDragStore.getState().payload;
      if (!payload) {
        return;
      }

      const { taskId, durationHours } = payload;

      if (start < new Date()) {
        toast.error('Нельзя ставить задачу в прошлое');
        return;
      }

      const end = calculateEndDateByWorkHours(start, durationHours);

      await updateTask({
        id: String(taskId),
        payload: {
          RESPONSIBLE_ID: targetUserId,
          DEADLINE: end.toISOString(),
        },
      });

      setProjectTaskIds((prev) => {
        const next = new Set(prev);
        next.add(String(taskId));
        saveProjectTaskIds(next);
        return next;
      });

      await queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
        exact: false,
      });

      useCalendarDragStore.getState().clear();
      toast.success('Задача обновлена');
    },
    [updateTask, user.ID]
  );

  return (
    <div className="h-full text-[10px] font-roboto">
      {!compact && (
        <UserHeader
          user={user}
          tasks={tasks}
          currentDate={currentDate}
          occupancy={occupancy}
        />
      )}

      <div className="w-full max-w-[390px] h-full lg:w-[244.44px]">
        {viewMode === 'month' && (
          <MonthView
            tasks={tasks}
            currentDate={currentDate}
            onDrop={(start) => handleCellDrop(start, user.ID)}
            onDragOver={(e) => e.preventDefault()}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            tasks={tasks}
            currentDate={currentDate}
            onTaskClick={onTaskClick}
            onDayClick={onDayClick}
            onCellDrop={(start) => handleCellDrop(start, user.ID)}
            onDragOver={(e) => e.preventDefault()}
            tempTasks={tempTasksByUser[user.ID] ?? []}
            userId={user.ID}
            previewTask={previewTask}
            setPreviewTask={setPreviewTask}
            projectTaskIds={projectTaskIds}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            tasks={tasks}
            currentDate={currentDate}
            onDayClick={onDayClick}
            onCellDrop={(start) => handleCellDrop(start, user.ID)}
            onDragOver={(e) => e.preventDefault()}
            tempTasks={tempTasksByUser[user.ID] ?? []}
            userId={user.ID}
            previewTask={previewTask}
            projectTaskIds={projectTaskIds}
          />
        )}
      </div>
    </div>
  );
}
