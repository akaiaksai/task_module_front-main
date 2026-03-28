import { UserAvatar } from '@/screens/groups/UserAvatar';
import { useElapsedTimes } from '@/hooks/tasks/elapsed-times/useElapsedTimes';
import { useUserLocal } from '@/hooks/users/useUserLocal';
import { Task } from '@/shared/types/task';
import { useMemo } from 'react';
import { getAssigneeColor } from './ProjectCardMobile';
import { getTaskTimeStatus } from '@/screens/tasks/_mobile/_calendar/utils/taskStatus';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

export const ProjectTaskItem = ({
  task,
  selectedGroupId,
  showAssigneeColors,
}: {
  task: Task;
  selectedGroupId?: number | null;
  showAssigneeColors?: boolean;
}) => {
  const assigneeColor = getAssigneeColor(task.assigneeId);
  const { data: elapsedTimeData } = useElapsedTimes(task.id.toString());
  const { getDisplayNameById, getUserById } = useUserLocal.useUsersMap();
  const assigneeName = getDisplayNameById(task.assigneeId);

  const assigneeUser = getUserById(task.assigneeId);

  const elapsedSeconds = useMemo(() => {
    if (!elapsedTimeData?.result) {
      return 0;
    }
    return elapsedTimeData.result.reduce(
      (total, item) => total + item.Seconds,
      0
    );
  }, [elapsedTimeData]);

  const timeStatus = getTaskTimeStatus(task, elapsedSeconds);

  if (task.status === 'done') {
    return null;
  }

  const lineColor =
    showAssigneeColors && selectedGroupId === task.groupId
      ? assigneeColor
      : '#E5CA1A';

  const accompliceCount = task.accomplices?.length || 0;

  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[#FFFFFFCC] bg-[#F7F7F7] text-black shadow-[0_3px_14px_rgba(0,0,0,0.3)]">
      <div
        className="absolute bottom-0 left-0 top-0 w-[8px]"
        style={{ backgroundColor: lineColor }}
      />

      <div className="py-4 pl-5 pr-4">
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            className="rounded px-1 text-[24px] leading-none text-[#1D2430]"
            aria-label="Действия задачи"
          >
            ...
          </button>
        </div>

        <div className="mb-2.5 text-[17px] font-semibold leading-[130%] text-[#0E0E0E]">
          {task.title}
        </div>

        <div className="mb-2.5 flex items-center gap-2 text-[14px] text-[#313131]">
          {assigneeUser ? (
            <UserAvatar user={assigneeUser} size="sm" />
          ) : (
            <span className="h-6 w-6 rounded-full bg-gray-300" />
          )}
          <span>{assigneeName || 'Не назначен'}</span>
          {accompliceCount > 0 && <span>+{accompliceCount}</span>}
        </div>

        {timeStatus.display && (
          <>
            <div className="text-[14px] leading-[130%] text-[#0E0E0E]">
              {timeStatus.timeEstimateMin} мин - {timeStatus.timeSpentMin} мин ={' '}
              {timeStatus.remainingTimeByPlan} мин
            </div>

            <div className="my-2 h-px bg-[#C2C2C2]" />

            <div className="flex items-center justify-between gap-2 text-[14px] leading-[130%]">
              {task.dueDate ? (
                <span className="text-[#0E0E0E]">
                  Сдача {format(new Date(task.dueDate), 'dd.MM.yy - HH:mm')}
                </span>
              ) : (
                <span className="text-[#0E0E0E]">Сдача не указана</span>
              )}

              <span
                className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none"
                style={{ color: timeStatus.statusColor }}
              >
                {timeStatus.status === 'Все по плану' ? (
                  <Activity size={16} strokeWidth={2.3} />
                ) : (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: timeStatus.statusColor }}
                  />
                )}
                {timeStatus.status}
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  );
};
