import { getTaskTimeStatus } from '@/screens/tasks/_mobile/_calendar/utils/taskStatus';
import { Task } from '@/shared/types/task';

export const getTimeStatusBadge = (task: Task, elapsedSeconds: number) => {
  const timeStatus = getTaskTimeStatus(task, elapsedSeconds);

  if (!timeStatus.display) {
    return null;
  }

  const statusColors: Record<string, string> = {
    просрочено: 'bg-[#EF46421F] text-[#EF4642]',
    критично: 'bg-[#EF46421F] text-[#EF4642]',
    'могу не успеть': 'bg-[#E5B7021F] text-[#E5B702]',
    'все по плану': 'bg-[#21C5641F] text-[#21C564]',
  };

  const colorClass =
    statusColors[timeStatus.status!.toLowerCase()] ||
    'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={`py-[2px] px-[5px] rounded-[5px] text-center text-xs font-medium truncate ${colorClass}`}
    >
      {timeStatus.status}
    </span>
  );
};
