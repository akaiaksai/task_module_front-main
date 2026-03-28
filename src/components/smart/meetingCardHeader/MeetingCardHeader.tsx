import { Pause } from '@/components/icons/pauseIcon';
import { useUsers, useUserUtils } from '@/hooks/users/useUserActions';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/screens/groups/UserAvatar';
import { Task } from '@/shared/types/task';
import { formatHM } from '@/shared/utils/helpers';
import { useAuthStore } from '@/store/auth';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';
import { useTaskTimerStore } from '@/store/task-timer';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PlayIcon, User } from 'lucide-react';
import { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

interface MeetingCardProps {
  task: Task;
  className?: string;
  propsStyles?: CSSProperties;
  stopButtonClassName?: string;
}

export function MeetingCardHeader({
  task,
  className,
  propsStyles,
  stopButtonClassName,
}: MeetingCardProps) {
  const { userId } = useAuthStore();
  const { data: user } = useUsers.useById(userId);
  const navigate = useNavigate();
  const displayName = useUserUtils.getDisplayName(user);
  const { activeTaskId, tasks, startTask, requestPause } = useTaskTimerStore();
  const openTaskSelectionModal = useTaskSelectionModalStore((s) => s.openModal);

  const currentTaskInStore = tasks.find((t) => t.taskId === task.id);

  function handleOpenTask() {
    window.scrollTo({ top: 0, left: 0 });
    navigate(`/tasks/${task.id}`);
  }

  const isActive = activeTaskId === task.id;
  const isRunning = currentTaskInStore?.isRunning || false;

  const formattedTime = task.dueDate
    ? format(parseISO(task.dueDate), 'HH:mm', { locale: ru })
    : '';

  // const formattedDate = task.dueDate
  //   ? format(parseISO(task.dueDate), 'dd.MM.yy', { locale: ru })
  //   : '';

  const finishTime = task.timeEstimate ? formatHM(task.timeEstimate) : '';

  function handleStartPause() {
    if (!isActive) {
      startTask(task.id);
      return;
    }

    if (isRunning) {
      requestPause(task.id);
    } else {
      startTask(task.id);
    }
  }

  function handleFinishTask() {
    openTaskSelectionModal({
      mode: 'complete',
      taskId: task.id,
    });
  }

  return (
    <div
      onClick={handleOpenTask}
      className={cn(
        "relative flex flex-col pl-[18px] pr-4 py-2 text-white font-semibold border border-[#8AE6FF80] rounded-[4px] after:content-[''] after:absolute after:left-[6px] after:top-2 after:bottom-2 after:w-[1px] after:bg-white",
        className
      )}
      style={{
        backdropFilter: 'blur(100px)',
        WebkitBackdropFilter: 'blur(100px)',
        boxShadow:
          '0px 0px 0.92px 0px #0000004A, 0px 1.83px 1.83px 0px #00000042, 0px 3.66px 1.83px 0px #00000026, 0px 5.49px 2.75px 0px #0000000A, 0px 9.15px 2.75px 0px #00000003, 0px 0px 10px 0px #33C1E766',
        ...propsStyles,
      }}
    >
      <div className="absolute top-2 right-4 flex items-center gap-2">
        <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex-shrink-0">
          {user ? (
            <UserAvatar user={user} size="sm" />
          ) : (
            <div className="w-full h-full bg-gray-500 flex items-center justify-center">
              <User className="w-[18px] h-[18px] text-white" />
            </div>
          )}
        </div>
        <span className="text-[14px] font-normal whitespace-nowrap">
          {displayName}
        </span>
      </div>

      <span>
        {formattedTime} {task.timeEstimate && `- ${finishTime}`}
      </span>

      <span className="mt-2 pb-3 text-[12px]">{task.title}</span>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStartPause();
          }}
        >
          {isRunning ? <Pause /> : <PlayIcon />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFinishTask();
          }}
          className={cn(
            'py-2 px-6 border rounded-full text-[12px]',
            stopButtonClassName
          )}
        >
          Завершить
        </button>
      </div>
    </div>
  );
}
