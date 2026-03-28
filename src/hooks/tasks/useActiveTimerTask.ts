import { useTaskTimerStore } from '@/store/task-timer';
import { useTask } from '@/hooks/tasks/useTaskActions';
import { useRenewTask } from '@/screens/tasks/_mobile/_calendar/hooks/useRenewTask';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';

export function useActiveTimerTask() {
  const {
    activeTaskId,
    lastTaskId,
    getTask,
    getCurrentElapsed,
    requestPause,
    startTask,
    tasks,
  } = useTaskTimerStore();

  const displayTaskId = activeTaskId ?? lastTaskId;

  const timerTask = displayTaskId
    ? tasks.find((t) => t.taskId === displayTaskId)
    : undefined;

  const isLocalTask = displayTaskId?.includes('-');

  const realId = displayTaskId?.includes('-')
    ? displayTaskId.split('-')[1]
    : displayTaskId;

  const { data: apiTask } = useTask(realId ?? '');

  const isCompleted = apiTask?.status === 'done';

  const { renewTask, isLoading: isRenewing } = useRenewTask();

  const toggleTask = async () => {
    if (!realId || isCompleted) {
      return;
    }

    const timer = displayTaskId ? getTask(displayTaskId) : undefined;

    if (!timer || !timer.isRunning) {
      startTask(realId);
      return;
    }

    requestPause(realId);
  };

  const finishTask = async () => {
    if (!displayTaskId) {
      return;
    }

    useTaskSelectionModalStore.getState().openModal({
      mode: 'complete',
      taskId: displayTaskId,
    });
  };

  const renew = () => {
    if (!realId) {
      return;
    }
    renewTask(realId);
  };

  const title = isLocalTask
    ? (timerTask?.title ?? 'Без названия')
    : (apiTask?.title ?? 'Без названия');

  const plannedMinutes = isLocalTask
    ? (timerTask?.plannedMinutes ?? 0)
    : apiTask?.timeEstimate
      ? Math.floor(apiTask.timeEstimate / 60)
      : 0;

  const spentMinutes = displayTaskId
    ? Math.floor(getCurrentElapsed(displayTaskId) / 60000)
    : 0;

  const isRunning = !!displayTaskId && getTask(displayTaskId)?.isRunning;

  return {
    hasTask: !!displayTaskId,

    title,
    plannedMinutes,
    spentMinutes,

    isRunning,
    isCompleted,
    isRenewing,

    toggleTask,
    finishTask,
    renew,
  };
}
