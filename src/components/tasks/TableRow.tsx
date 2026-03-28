import Button from '@/ui/Button';
import Skeleton from '@/ui/Skeleton';
import { TD, TR } from '@/ui/Table';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle, MessageSquare, Pause, Play, Plus } from 'lucide-react';
import { useMemo } from 'react';

import { useElapsedTimes } from '@/hooks/tasks/elapsed-times/useElapsedTimes';
import { getGroupColor } from '@/screens/tasks/_mobile/_calendar/utils/colors';
import { getTaskTimeStatus } from '@/screens/tasks/_mobile/_calendar/utils/taskStatus';
import { getTimeStatusBadge } from './getTimeStatusBadge';

export function TableRow({
  task,
  usersLoading,
  getDisplayNameById,
  isRefreshing,
  onTaskClick,
  handleAddComment,
  onCreateSubtask,
  handleStartTask,
  handlePauseTask,
  handleCompleteTask,
  isTaskRunning,
}: ANY) {
  const groupColor = getGroupColor(task.groupId);

  const { data: elapsedTimeData, isLoading: isLoadingElapsedTime } =
    useElapsedTimes(task.id.toString()) || { data: null, isLoading: false };

  const elapsedSeconds = useMemo(() => {
    if (!elapsedTimeData?.result) {
      return 0;
    }
    return elapsedTimeData.result.reduce(
      (total: number, r: ANY) => total + r.Seconds,
      0
    );
  }, [elapsedTimeData]);

  const timeStatus = getTaskTimeStatus(task, elapsedSeconds);

  const running = isTaskRunning(task.id);

  const handleCreateSubtaskLocal = () => {
    if (!isRefreshing && onCreateSubtask) {
      onCreateSubtask(task);
    }
  };

  return (
    <TR key={task.id} className={clsx(isRefreshing && 'opacity-50')}>
      <TD className="font-normal text-[14px] leading-[130%]">
        <button
          onClick={() => !isRefreshing && onTaskClick(task.id)}
          className={clsx(
            'hover:underline text-left flex-1 flex items-center gap-2',
            isRefreshing && 'cursor-not-allowed opacity-50'
          )}
          disabled={isRefreshing}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: groupColor.bg,
              border: `0.5px solid ${groupColor.border}`,
            }}
          />
          <span className="block truncate max-w-[400px]">{task.title}</span>
        </button>
      </TD>

      <TD className="w-[100px]">
        {isLoadingElapsedTime ? (
          <Skeleton className="h-4 w-24" />
        ) : timeStatus.display ? (
          <div className="flex flex-col">
            {getTimeStatusBadge(task, elapsedSeconds)}
          </div>
        ) : (
          <span className="text-xs text-gray-500 p-[2px] px-[5px]">
            Нет данных
          </span>
        )}
      </TD>

      <TD>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-[#000000B2] leading-[130%] text-right">
            {task.priority ? `${task.priority}/10` : '-'}
          </span>
        </div>
      </TD>

      <TD>
        {usersLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <div className="text-left text-[12px] leading-[130%] font-normal text-nowrap">
            {getDisplayNameById(task.assigneeId)}
          </div>
        )}
      </TD>

      <TD>
        <div className="text-[12px] font-normal leading-[130%] text-nowrap text-right">
          {task.dueDate
            ? format(parseISO(task.dueDate), 'dd MMM yyyy', { locale: ru })
            : '—'}
        </div>
      </TD>

      <TD>
        <div className="text-[12px] font-normal leading-[130%] text-nowrap text-right">
          {format(parseISO(task.updatedAt), 'dd MMM yyyy HH:mm', {
            locale: ru,
          })}
        </div>
      </TD>

      <TD>
        <div className="flex justify-end items-end">
          {onCreateSubtask && (
            <Button
              variant="ghost"
              onClick={handleCreateSubtaskLocal}
              className={clsx(
                'px-0 py-0 hover:bg-purple-50 text-[#1791FF]',
                isRefreshing && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isRefreshing}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => !isRefreshing && handleAddComment(task.id)}
            className={clsx(
              'p-1 hover:bg-green-50 text-[#21C564] px-0 py-0',
              isRefreshing && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isRefreshing}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {!running ? (
            <Button
              variant="ghost"
              className="px-0 py-0 hover:bg-blue-50 text-blue-600"
              disabled={isRefreshing}
              onClick={() => handleStartTask(task.id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="px-0 py-0 hover:bg-yellow-50 text-yellow-600"
              disabled={isRefreshing}
              onClick={() => handlePauseTask(task.id)}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="px-0 py-0 hover:bg-red-50 text-red-600"
            disabled={isRefreshing}
            onClick={() => handleCompleteTask(task.id)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </TD>
    </TR>
  );
}
