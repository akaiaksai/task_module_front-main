import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';
import { taskKeys, useAllTasks, useTask } from '@/hooks/tasks/useTaskActions';
import { useTaskTimerStore } from '@/store/task-timer';
import { useElapsedTimeActions } from '@/hooks/tasks/elapsed-times/useElapsedTimeActions';
// import { useBreakTimerStore } from '@/store/break-timer';
import { completeTask } from '@/lib/api/tasks/tasks';
import { useQueryClient } from '@tanstack/react-query';
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/users/useUserActions';
import { useIntermediateTask } from '../useIntermediateTask';
import { useBreakWatcher } from './useBreakWatcher';

type TaskTab = 'today' | 'tomorrow' | 'week' | 'all';

function isTaskCompleted(task: ANY): boolean {
  return task.status === 'done' || task.STATUS === '5';
}

export function useTaskSelectionModalLogic() {
  const { userId } = useAuthStore();
  const { isOpen, closeModal, mode, targetTaskId, openModal } =
    useTaskSelectionModalStore();

  const { data: allTasks = [] } = useAllTasks();
  const { startTask, getCurrentElapsed, pauseTask, getTask } =
    useTaskTimerStore();

  const queryClient = useQueryClient();
  const { createElapsedTime } = useElapsedTimeActions();
  // const startBreak = useBreakTimerStore((s) => s.startBreak);
  const { startWatching } = useBreakWatcher();

  const [activeTab, setActiveTab] = useState<TaskTab>('today');
  const [pauseComment, setPauseComment] = useState('');
  const [breakMinutes, setBreakMinutes] = useState<number>(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pausedTaskId = targetTaskId ?? useTaskTimerStore.getState().lastTaskId;
  const { data: pausedTask } = useTask(pausedTaskId ?? '');

  const isSaveDisabled = breakMinutes <= 0 || !pausedTaskId;

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        pausedTaskId
          ? queryClient.invalidateQueries({ queryKey: ['task', pausedTaskId] })
          : Promise.resolve(),
        pausedTaskId
          ? queryClient.invalidateQueries({
              queryKey: ['elapsed-times', pausedTaskId],
            })
          : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!pausedTaskId) {
      return;
    }

    const taskTimer = getTask(String(pausedTaskId));

    console.log(taskTimer);

    if (taskTimer?.startTime) {
      const seconds = Math.floor((Date.now() - taskTimer.startTime) / 1000);

      if (seconds > 0) {
        await createElapsedTime({
          taskId: Number(pausedTaskId),
          seconds,
          ...(pauseComment.trim() ? { comment: pauseComment.trim() } : {}),
        });
      }
    }

    await pauseTask(pausedTaskId, breakMinutes);

    if (mode === 'complete') {
      await completeTask(pausedTaskId);

      useTaskTimerStore.setState({ activeTaskId: null, lastTaskId: null });
      queryClient.invalidateQueries({ queryKey: ['task', pausedTaskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача завершена');
    }

    const endsAt = Date.now() + breakMinutes * 60_000;

    startWatching(endsAt);

    // startBreak(breakMinutes);

    toast.success(
      mode === 'complete'
        ? 'Перерыв начался после завершения задачи'
        : 'Перерыв начался',
      { description: `Напомню через ${breakMinutes} мин` }
    );

    setPauseComment('');
    closeModal();
  };

  const getTasksByTab = (): Record<TaskTab, ANY[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const filtered = allTasks.filter(
      (t: ANY) => !isTaskCompleted(t) && t.assigneeId === userId
    );

    return {
      today: filtered.filter((t) => {
        if (!t.dueDate) {
          return false;
        }

        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);

        return d.getTime() === today.getTime();
      }),

      tomorrow: filtered.filter((t) => {
        if (!t.dueDate) {
          return false;
        }

        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);

        return d.getTime() === tomorrow.getTime();
      }),

      week: filtered.filter((t) => {
        if (!t.dueDate) {
          return false;
        }

        const d =
          typeof t.dueDate === 'string'
            ? parseISO(t.dueDate)
            : new Date(t.dueDate);

        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }),

      all: filtered,
    };
  };

  const tasksByTab = useMemo(getTasksByTab, [allTasks, userId]);

  const spentMs = pausedTask?.id != null ? getCurrentElapsed(pausedTask.id) : 0;

  const plannedMs = pausedTask?.timeEstimate
    ? pausedTask.timeEstimate * 1000
    : 0;

  const handleStartFromCard = (task: ANY) => {
    startTask(task.id.toString(), {
      title: task.title,
      plannedMinutes: task.timeEstimate
        ? Math.floor(task.timeEstimate / 60)
        : 0,
    });
    closeModal();
    toast.success('Задача началась', { description: task.title });
  };

  const handleCompleteFromCard = (taskId: string) => {
    closeModal();
    openModal({ mode: 'complete', taskId });
  };

  const userIds = useMemo(() => {
    return Array.from(
      new Set(
        tasksByTab[activeTab]
          .flatMap((task) => [task.assigneeId, task.createdBy])
          .filter((id): id is number => typeof id === 'number')
      )
    );
  }, [tasksByTab, activeTab]);

  const { data: users = [] } = useUsers.useByIds(userIds);

  const usersMap = useMemo(() => {
    const map = new Map<number, ANY>();
    users.forEach((u) => map.set(u.ID, u));
    return map;
  }, [users]);

  const assigneeId = pausedTask?.assigneeId;
  const { data: assignee } = useUsers.useById(assigneeId ?? null);

  const { data: createdByUser } = useUsers.useById(
    pausedTask?.createdBy ?? null
  );

  const activePreviewImage = useMemo(() => {
    const files = pausedTask?.files;
    if (!Array.isArray(files)) {
      return undefined;
    }
    return files.find((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name));
  }, [pausedTask]);

  const { createIntermediateTask } = useIntermediateTask({
    type: 'intermediate',
  });

  const handleCreateIntermediate = async () => {
    await createIntermediateTask('Промежуточная задача', undefined, userId!);
    closeModal();
    toast.success('Промежуточная задача началась');
  };

  const [quickCreateType, setQuickCreateType] = useState<
    'intermediate' | 'meeting' | null
  >(null);

  useEffect(() => {
    if (!isOpen) {
      setQuickCreateType(null);
    }
  }, [isOpen]);

  return {
    // modal state
    isOpen,
    mode,
    quickCreateType,

    // data
    pausedTask,
    assignee,
    createdByUser,
    activePreviewImage,
    tasksByTab,
    usersMap,

    // ui state
    activeTab,
    pauseComment,
    breakMinutes,
    isRefreshing,
    spentMs,
    plannedMs,
    isSaveDisabled,

    // setters
    setActiveTab,
    setPauseComment,
    setBreakMinutes,

    // actions
    handleSave,
    handleRefresh,
    handleStartFromCard,
    handleCompleteFromCard,
    handleCreateIntermediate,
    closeModal,
  };
}
